import { NextResponse } from "next/server";
import { OAuth2RequestError, ArcticFetchError } from "arctic";
import { google, fetchGoogleUser, GOOGLE_OAUTH_STATE_COOKIE, GOOGLE_OAUTH_VERIFIER_COOKIE } from "@/lib/oauth";
import { signInWithOAuth, AuthError } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { sendOtpEmail } from "@/lib/email";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

function redirectToLogin(error: string) {
  const res = NextResponse.redirect(new URL(`/login?error=${error}`, APP_URL));
  res.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
  res.cookies.delete(GOOGLE_OAUTH_VERIFIER_COOKIE);
  return res;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError || !code || !state) return redirectToLogin("oauth_cancelled");
  if (!google) return redirectToLogin("oauth_not_configured");

  const cookieHeader = req.headers.get("cookie") ?? "";
  const readCookie = (name: string) => {
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  };
  const storedState = readCookie(GOOGLE_OAUTH_STATE_COOKIE);
  const codeVerifier = readCookie(GOOGLE_OAUTH_VERIFIER_COOKIE);

  if (!storedState || !codeVerifier || storedState !== state) {
    return redirectToLogin("invalid_state");
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const profile = await fetchGoogleUser(tokens.accessToken());

    const { user, otp } = await signInWithOAuth({
      provider: "google",
      providerAccountId: profile.sub,
      email: profile.email,
      fullName: profile.name,
      avatarUrl: profile.picture,
    });

    if (user.verified) {
      await createSession(user.id);
      const res = NextResponse.redirect(new URL("/today", APP_URL));
      res.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
      res.cookies.delete(GOOGLE_OAUTH_VERIFIER_COOKIE);
      return res;
    }

    // First-time / unverified user: email them an OTP and send them to verify.
    if (otp) {
      try {
        await sendOtpEmail(user.email, otp);
      } catch (e) {
        console.error("Failed to send verification email", e);
      }
    }
    const res = NextResponse.redirect(
      new URL(`/verify-email?email=${encodeURIComponent(user.email)}`, APP_URL)
    );
    res.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
    res.cookies.delete(GOOGLE_OAUTH_VERIFIER_COOKIE);
    return res;
  } catch (e) {
    if (e instanceof OAuth2RequestError || e instanceof ArcticFetchError || e instanceof AuthError) {
      console.error("Google OAuth error:", e);
      return redirectToLogin("oauth_failed");
    }
    console.error("Google OAuth unexpected error:", e);
    return redirectToLogin("oauth_failed");
  }
}
