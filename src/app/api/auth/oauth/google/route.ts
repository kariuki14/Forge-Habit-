import { NextResponse } from "next/server";
import { generateState, generateCodeVerifier } from "arctic";
import { google, GOOGLE_OAUTH_STATE_COOKIE, GOOGLE_OAUTH_VERIFIER_COOKIE } from "@/lib/oauth";

export async function GET() {
  if (!google) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_not_configured", process.env.APP_URL || "http://localhost:3000")
    );
  }

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, ["openid", "profile", "email"]);

  const res = NextResponse.redirect(url);
  const opts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60, // 10 minutes
  };
  res.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, opts);
  res.cookies.set(GOOGLE_OAUTH_VERIFIER_COOKIE, codeVerifier, opts);

  return res;
}
