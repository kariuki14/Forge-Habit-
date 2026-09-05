import { NextResponse } from "next/server";
import { AuthError, resetPassword } from "@/lib/auth";
import { rateLimit, clientKey, AUTH_LIMIT } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") throw new AuthError("Invalid request body");

    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const token = parsed.data.token;
    if (!rateLimit(clientKey(req.headers, token), AUTH_LIMIT.limit, AUTH_LIMIT.windowMs)) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    await resetPassword(token, parsed.data.password);

    return NextResponse.json({ message: "Password reset successfully. You can now log in." });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
