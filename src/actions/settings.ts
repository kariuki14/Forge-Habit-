"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function updateSettingsAction(input: {
  notificationsEnabled?: boolean;
  pushNotifications?: boolean;
  appearanceMode?: "LIGHT" | "DARK" | "SYSTEM";
}) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.userSettings.update({
    where: { userId: user.id },
    data: input,
  });

  revalidatePath("/settings");
}
