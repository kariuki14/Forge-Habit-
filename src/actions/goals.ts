"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import type { GoalCategory } from "@prisma/client";

export type GoalFormState = { error: string | null };

const VALID_GOAL_CATEGORIES: GoalCategory[] = [
  "READING", "FITNESS", "FINANCE", "LEARNING", "CAREER", "CREATIVE", "PERSONAL", "TRAVEL",
];

export async function createGoalAction(_prev: GoalFormState, formData: FormData): Promise<GoalFormState> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  const title = String(formData.get("title") ?? "").trim();
  const description = formData.get("description") ? String(formData.get("description")).trim() : null;
  const category = String(formData.get("category") ?? "PERSONAL");
  const targetValue = Number(formData.get("targetValue"));
  const unit = String(formData.get("unit") ?? "").trim();
  const targetDate = formData.get("targetDate") ? String(formData.get("targetDate")) : null;

  if (!title || title.length > 160) return { error: "Title must be 1-160 characters" };
  if (!Number.isFinite(targetValue) || targetValue <= 0) return { error: "Target must be a positive number" };
  if (!unit) return { error: "Unit is required" };
  if (!VALID_GOAL_CATEGORIES.includes(category as GoalCategory)) return { error: "Invalid category" };

  try {
    await prisma.goal.create({
      data: {
        userId: user.id,
        title,
        description,
        category: category as GoalCategory,
        targetValue,
        unit,
        currentValue: 0,
        targetDate: targetDate ? new Date(targetDate) : null,
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

  if (!Number.isFinite(amount) || amount <= 0) return { error: "Amount must be a positive number" };

  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId: user.id, status: "ACTIVE" },
  });
  if (!goal) return { error: "Goal not found" };

  const newValue = Number(goal.currentValue) + amount;
  const completed = newValue >= Number(goal.targetValue);

  await prisma.goal.update({
    where: { id: goalId },
    data: {
      currentValue: Math.min(newValue, Number(goal.targetValue)),
      status: completed ? "COMPLETED" : "ACTIVE",
      completedAt: completed ? new Date() : null,
    },
  });

  revalidatePath("/goals");
  return { error: null, completed };
}

export async function goalUndoCheckinAction(goalId: string, amount: number): Promise<GoalCheckinState> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  if (!Number.isFinite(amount) || amount <= 0) return { error: "Amount must be a positive number" };

  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId: user.id },
  });
  if (!goal) return { error: "Goal not found" };

  const newValue = Math.max(0, Number(goal.currentValue) - amount);

  await prisma.goal.update({
    where: { id: goalId },
    data: {
      currentValue: newValue,
      status: "ACTIVE",
      completedAt: null,
    },
  });

  revalidatePath("/goals");
  return { error: null };
}
