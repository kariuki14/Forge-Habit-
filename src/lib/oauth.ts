import { Google } from "arctic";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

export const GOOGLE_OAUTH_STATE_COOKIE = "oauth_state";
export const GOOGLE_OAUTH_VERIFIER_COOKIE = "oauth_code_verifier";

export const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? new Google(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${APP_URL}/api/auth/oauth/callback/google`
      )
    : null;

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
}

export async function fetchGoogleUser(accessToken: string): Promise<GoogleProfile> {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch Google user info");
  const data = await res.json();
  if (!data.sub || !data.email) throw new Error("Google did not return an email address");
  return {
    sub: String(data.sub),
    email: String(data.email).toLowerCase(),
    emailVerified: Boolean(data.email_verified),
    name: typeof data.name === "string" && data.name.trim() ? data.name.trim() : String(data.email).split("@")[0],
    picture: typeof data.picture === "string" ? data.picture : undefined,
  };
}
