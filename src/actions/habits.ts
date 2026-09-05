"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/session";
import { createHabit, toggleCheckIn, habitInputFromFormData, HabitError } from "@/lib/habits";

export type HabitFormState = { error: string | null };

function refreshHabitViews() {
  revalidatePath("/today");
  revalidatePath("/habits");
  revalidatePath("/insights");
}

export async function toggleCheckInAction(habitId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  try {
    await toggleCheckIn(user.id, habitId);
  } catch (e) {
    if (e instanceof HabitError) return { error: e.message };
    console.error(e);
    return { error: "Could not update habit" };
  }
  refreshHabitViews();
  return { error: null };
}

export async function quickAddHabitAction(_prev: HabitFormState, formData: FormData): Promise<HabitFormState> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  try {
    await createHabit(user.id, {
      title: String(formData.get("title") ?? ""),
      category: "GROWTH",
      targetValue: 1,
      unit: "times",
      timeWindow: "ANYTIME",
      frequency: "DAILY",
    });
  } catch (e) {
    if (e instanceof HabitError) return { error: e.message };
    console.error(e);
    return { error: "Could not create habit" };
  }
  refreshHabitViews();
  return { error: null };
}

export async function createHabitAction(_prev: HabitFormState, formData: FormData): Promise<HabitFormState> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  try {
    await createHabit(user.id, habitInputFromFormData(formData));
  } catch (e) {
    if (e instanceof HabitError) return { error: e.message };
    console.error(e);
    return { error: "Could not create habit" };
  }
  refreshHabitViews();
  return { error: null };
}
