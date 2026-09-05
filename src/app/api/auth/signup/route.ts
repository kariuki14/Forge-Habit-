import { NextResponse } from "next/server";
import { AuthError, createUserWithDefaults } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";
import { rateLimit, clientKey, AUTH_LIMIT } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") throw new AuthError("Invalid request body");

    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const email = parsed.data.email;
    if (!rateLimit(clientKey(req.headers, email), AUTH_LIMIT.limit, AUTH_LIMIT.windowMs)) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    const user = await createUserWithDefaults({
      email,
      password: parsed.data.password,
      fullName: parsed.data.fullName,
    });

    // Send OTP email (OTP was generated in createUserWithDefaults)
    if (user.emailOtp) {
      await sendOtpEmail(user.email, user.emailOtp);
    }

    return NextResponse.json(
      { message: "Account created. Please verify your email.", email: user.email },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
