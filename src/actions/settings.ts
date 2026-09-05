"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { settingsSchema } from "@/lib/validations";

export async function updateSettingsAction(input: {
  notificationsEnabled?: boolean;
  pushNotifications?: boolean;
  appearanceMode?: "LIGHT" | "DARK" | "SYSTEM";
}) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid settings" };
  }

  try {
    await prisma.userSettings.update({
      where: { userId: user.id },
      data: parsed.data,
    });
  } catch (e) {
    console.error(e);
    return { error: "Could not update settings" };
  }

  revalidatePath("/settings");
  return { error: null };
}
