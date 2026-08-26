import { NextResponse } from "next/server";
import { AuthError, createPasswordResetToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, clientKey, AUTH_LIMIT } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") throw new AuthError("Invalid request body");

    const email = String(body.email ?? "").trim().toLowerCase();
    if (!rateLimit(clientKey(req.headers, email), AUTH_LIMIT.limit, AUTH_LIMIT.windowMs)) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = await createPasswordResetToken(user.id);
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const resetUrl = `${appUrl}/reset-password?token=${token}`;
      await sendPasswordResetEmail(email, resetUrl);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ message: "If an account exists with this email, you will receive a reset link." });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
