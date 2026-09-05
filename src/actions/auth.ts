"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { AuthError, authenticate } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";
import { rateLimit, clientKey, AUTH_LIMIT } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations";

export type AuthState = { error: string | null };

async function authRateLimited(email: string): Promise<boolean> {
  const h = await headers();
  return !rateLimit(clientKey(h, email.trim().toLowerCase()), AUTH_LIMIT.limit, AUTH_LIMIT.windowMs);
}

export async function logInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (await authRateLimited(String(formData.get("email") ?? ""))) {
    return { error: "Too many attempts. Please try again later." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const user = await authenticate(parsed.data.email, parsed.data.password);
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
