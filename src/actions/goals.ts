"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { goalSchema, goalAmountSchema } from "@/lib/validations";
import type { GoalCategory } from "@prisma/client";

export type GoalFormState = { error: string | null };

const GENERIC_ERROR = "Something went wrong. Please try again.";

export async function createGoalAction(_prev: GoalFormState, formData: FormData): Promise<GoalFormState> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  const parsed = goalSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || null,
    category: formData.get("category") ?? "PERSONAL",
    targetValue: Number(formData.get("targetValue")),
    unit: formData.get("unit"),
    targetDate: formData.get("targetDate") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await prisma.goal.create({
      data: {
        userId: user.id,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        category: parsed.data.category as GoalCategory,
        targetValue: parsed.data.targetValue,
        unit: parsed.data.unit,
        currentValue: 0,
        targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null,
      },
    });
  } catch (e) {
    console.error(e);
    return { error: "Could not create goal" };
  }

  revalidatePath("/goals");
  return { error: null };
}

export type GoalCheckinState = { error: string | null; completed?: boolean };

export async function goalCheckinAction(goalId: string, amount: number): Promise<GoalCheckinState> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  const parsed = goalAmountSchema.safeParse({ goalId, amount });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const goal = await prisma.goal.findFirst({
      where: { id: parsed.data.goalId, userId: user.id, status: "ACTIVE" },
    });
    if (!goal) return { error: "Goal not found" };

    const newValue = Number(goal.currentValue) + parsed.data.amount;
    const completed = newValue >= Number(goal.targetValue);

    await prisma.goal.update({
      where: { id: goal.id },
      data: {
        currentValue: Math.min(newValue, Number(goal.targetValue)),
        status: completed ? "COMPLETED" : "ACTIVE",
        completedAt: completed ? new Date() : null,
      },
    });

    if (completed) {
      try {
        const achievement = await prisma.achievement.findUnique({
          where: { code: "FIRST_NORTH_STAR" },
        });
        if (achievement) {
          await prisma.userAchievement.upsert({
            where: {
              userId_achievementId: {
                userId: user.id,
                achievementId: achievement.id,
              },
            },
            update: {},
            create: {
              userId: user.id,
              achievementId: achievement.id,
              goalId: goal.id,
            },
          });
        }
      } catch (e) {
        console.error("Achievement award error:", e);
      }
    }

    revalidatePath("/goals");
    return { error: null, completed };
  } catch (e) {
    console.error(e);
    return { error: GENERIC_ERROR };
  }
}

export async function goalUndoCheckinAction(goalId: string, amount: number): Promise<GoalCheckinState> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  const parsed = goalAmountSchema.safeParse({ goalId, amount });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const goal = await prisma.goal.findFirst({
      where: { id: parsed.data.goalId, userId: user.id },
    });
    if (!goal) return { error: "Goal not found" };

    const newValue = Math.max(0, Number(goal.currentValue) - parsed.data.amount);

    await prisma.goal.update({
      where: { id: goal.id },
      data: {
        currentValue: newValue,
        status: "ACTIVE",
        completedAt: null,
      },
    });

    revalidatePath("/goals");
    return { error: null };
  } catch (e) {
    console.error(e);
    return { error: GENERIC_ERROR };
  }
}

export async function reopenGoalAction(goalId: string): Promise<{ error: string | null }> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: user.id },
    });
    if (!goal) return { error: "Goal not found" };

    await prisma.goal.update({
      where: { id: goal.id },
      data: {
        status: "ACTIVE",
        completedAt: null,
      },
    });

    revalidatePath("/goals");
    return { error: null };
  } catch (e) {
    console.error(e);
    return { error: GENERIC_ERROR };
  }
}

export async function deleteGoalAction(goalId: string): Promise<{ error: string | null }> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  try {
    // deleteMany with userId scoping deletes atomically — no separate fetch needed.
    const result = await prisma.goal.deleteMany({
      where: { id: goalId, userId: user.id },
    });
    if (result.count === 0) return { error: "Goal not found" };

    revalidatePath("/goals");
    return { error: null };
  } catch (e) {
    console.error(e);
    return { error: GENERIC_ERROR };
  }
}
