import { NextResponse } from "next/server";
import { AuthError, resetPassword } from "@/lib/auth";
import { rateLimit, clientKey, AUTH_LIMIT } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") throw new AuthError("Invalid request body");

    const token = String(body.token ?? "");
    const password = String(body.password ?? "");
    if (!rateLimit(clientKey(req.headers, token), AUTH_LIMIT.limit, AUTH_LIMIT.windowMs)) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    await resetPassword(token, password);

    return NextResponse.json({ message: "Password reset successfully. You can now log in." });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
