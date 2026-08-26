import { NextResponse } from "next/server";
import { authenticate, AuthError } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { rateLimit, clientKey, AUTH_LIMIT } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") throw new AuthError("Invalid request body");

    const email = String(body.email ?? "");
    if (!rateLimit(clientKey(req.headers, email), AUTH_LIMIT.limit, AUTH_LIMIT.windowMs)) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    const user = await authenticate(email, String(body.password ?? ""));

    await createSession(user.id);
    return NextResponse.json({
      user: { id: user.id, email: user.email, fullName: user.fullName },
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
