"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { AuthError, authenticate } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";
import { rateLimit, clientKey, AUTH_LIMIT } from "@/lib/rate-limit";

export type AuthState = { error: string | null };

async function authRateLimited(email: string): Promise<boolean> {
  const h = await headers();
  return !rateLimit(clientKey(h, email.trim().toLowerCase()), AUTH_LIMIT.limit, AUTH_LIMIT.windowMs);
}

export async function logInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (await authRateLimited(String(formData.get("email") ?? ""))) {
    return { error: "Too many attempts. Please try again later." };
  }
  try {
    const user = await authenticate(
      String(formData.get("email") ?? ""),
      String(formData.get("password") ?? "")
    );
    await createSession(user.id);
  } catch (e) {
    if (e instanceof AuthError) return { error: e.message };
    console.error(e);
    return { error: "Something went wrong. Please try again." };
  }
  redirect("/today");
}

export async function signOutAction() {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/login");
}
