import { randomBytes, randomInt, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { prisma } from "@/lib/prisma";
import { emailIndex, generateDek, wrapDek } from "@/lib/crypto";
import { decryptUser, decryptUserFields, encryptUserFields } from "@/lib/pii";
import type { User, UserTier } from "@prisma/client";

const scryptAsync = promisify(scrypt);

const TIER_THRESHOLDS: Array<{ tier: UserTier; min: number }> = [
  { tier: "ROOKIE", min: 0 },
  { tier: "APPRENTICE", min: 1_000 },
  { tier: "ADEPT", min: 5_000 },
  { tier: "ELITE", min: 15_000 },
  { tier: "LEGEND", min: 30_000 },
];

export const XP_PER_COMPLETION = 10;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, expectedHex] = parts;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export function tierForXp(xpPoints: number): UserTier {
  let tier: UserTier = "ROOKIE";
  for (const t of TIER_THRESHOLDS) {
    if (xpPoints >= t.min) tier = t.tier;
  }
  return tier;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

export async function createUserWithDefaults(input: {
  email: string;
  password: string;
  fullName: string;
}): Promise<User> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();

  if (!EMAIL_RE.test(email)) throw new AuthError("Invalid email address");
  if (input.password.length < 8) throw new AuthError("Password must be at least 8 characters");
  if (fullName.length < 1 || fullName.length > 120) throw new AuthError("Name must be 1-120 characters");

  const existing = await prisma.user.findUnique({ where: { emailIndex: emailIndex(email) } });
  if (existing) throw new AuthError("An account with this email already exists");

  const dek = generateDek();
  const otp = generateOtp();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        ...encryptUserFields(dek, { email, fullName }),
        passwordHash: await hashPassword(input.password),
        verified: false,
        emailOtp: otp,
        emailOtpExpires: otpExpires,
        settings: { create: {} },
        subscription: { create: {} },
        key: { create: { wrappedDek: wrapDek(dek) } },
      },
    });
    // Return a copy with plaintext PII — never expose ciphertext to callers.
    return decryptUserFields(dek, user);
  });
}

export interface OAuthProfile {
  provider: string;
  providerAccountId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

export interface OAuthSignInResult {
  user: User; // plaintext PII fields
  /** 6-digit OTP to email when the account still needs verification, else null. */
  otp: string | null;
}

/**
 * Find-or-create a user from an OAuth provider profile.
 * - Existing linked account -> its user.
 * - Existing email -> link the provider to that user.
 * - New email -> create unverified user + linked account; OTP returned for verification.
 * Returns `otp` when the user still needs email verification.
 */
export async function signInWithOAuth(profile: OAuthProfile): Promise<OAuthSignInResult> {
  const email = profile.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw new AuthError("Invalid email address from provider");

  const linked = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      },
    },
    include: { user: { include: { key: true } } },
  });
  if (linked) {
    const user = decryptUser(linked.user);
    if (user.verified) return { user, otp: null };
    return { user, otp: await resendOtp(email) };
  }

  const existing = await prisma.user.findUnique({
    where: { emailIndex: emailIndex(email) },
    include: { key: true },
  });
  if (existing) {
    await prisma.account.create({
      data: {
        userId: existing.id,
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      },
    });
    const user = decryptUser(existing);
    if (existing.verified) return { user, otp: null };
    return { user, otp: await resendOtp(email) };
  }

  const dek = generateDek();
  const otp = generateOtp();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  const user = await prisma.$transaction(async (tx) => {
    return tx.user.create({
      data: {
        ...encryptUserFields(dek, {
          email,
          fullName: profile.fullName.trim().slice(0, 120) || email.split("@")[0],
          avatarUrl: profile.avatarUrl ?? null,
        }),
        verified: false,
        emailOtp: otp,
        emailOtpExpires: otpExpires,
        settings: { create: {} },
        subscription: { create: {} },
        key: { create: { wrappedDek: wrapDek(dek) } },
        accounts: {
          create: {
            provider: profile.provider,
            providerAccountId: profile.providerAccountId,
          },
        },
      },
    });
  });
  return { user: decryptUserFields(dek, user), otp };
}

export async function authenticate(email: string, password: string): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { emailIndex: emailIndex(email) },
    include: { key: true },
  });
  if (!user?.passwordHash) throw new AuthError("Invalid email or password");
  if (!(await verifyPassword(password, user.passwordHash))) {
    throw new AuthError("Invalid email or password");
  }
  if (!user.verified) throw new AuthError("Please verify your email before logging in", "UNVERIFIED");
  return decryptUser(user);
}

export function generateOtp(): string {
  // crypto.randomInt uses the OS CSPRNG — safe for security-sensitive codes.
  return randomInt(100_000, 1_000_000).toString();
}

export async function verifyOtp(email: string, otp: string): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { emailIndex: emailIndex(email) },
    include: { key: true },
  });
  if (!user) throw new AuthError("Invalid verification code");
  if (user.verified) throw new AuthError("This account is already verified");
  if (!user.emailOtp || !user.emailOtpExpires) throw new AuthError("No verification code found. Please request a new one.");
  if (user.emailOtpExpires < new Date()) throw new AuthError("Verification code expired. Please request a new one.");
  if (user.emailOtp !== otp.trim()) throw new AuthError("Invalid verification code");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verified: true,
      emailOtp: null,
      emailOtpExpires: null,
    },
  });

  return decryptUser(user);
}

export async function resendOtp(email: string) {
  const user = await prisma.user.findUnique({
    where: { emailIndex: emailIndex(email) },
  });
  // Use generic error to prevent account enumeration
  if (!user || user.verified) throw new AuthError("Invalid verification code");

  const otp = generateOtp();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { emailOtp: otp, emailOtpExpires: otpExpires },
  });

  return otp;
}

export async function createPasswordResetToken(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.deleteMany({
    where: { userId, OR: [{ used: true }, { expiresAt: { lt: new Date() } }] },
  });

  await prisma.passwordResetToken.create({
    data: { userId, token, expiresAt },
  });

  return token;
}

export async function verifyPasswordResetToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!record) throw new AuthError("Invalid or expired reset link");
  if (record.used) throw new AuthError("This reset link has already been used");
  if (record.expiresAt < new Date()) throw new AuthError("This reset link has expired");
  return record.user;
}

/**
 * Permanent account erasure with crypto-shredding ("right to be forgotten").
 *
 * 1. The UserKey row (wrapped DEK) is destroyed FIRST. From this point the
 *    user's ciphertext PII is unrecoverable even from cold backups — the
 *    only copy of the DEK was wrapped under the KEK and stored nowhere else.
 * 2. The user row is hard-deleted; every relation (settings, subscription,
 *    key, OAuth accounts, sessions, habits + logs, goals + milestones,
 *    achievements, insights, analytics snapshots, password reset tokens)
 *    cascades. Orphaned VerificationToken rows are removed by email.
 */
export async function eraseAccount(userId: string, email: string) {
  await prisma.$transaction([
    prisma.userKey.deleteMany({ where: { userId } }),
    prisma.verificationToken.deleteMany({ where: { identifier: email.trim().toLowerCase() } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await verifyPasswordResetToken(token);
  if (newPassword.length < 8) throw new AuthError("Password must be at least 8 characters");

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { 
        passwordHash: await hashPassword(newPassword),
        verified: true,
        emailOtp: null,
        emailOtpExpires: null,
      },
    });
    await tx.passwordResetToken.update({
      where: { token },
      data: { used: true },
    });
  });

  return user;
}
