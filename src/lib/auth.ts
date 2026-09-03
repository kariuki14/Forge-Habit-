import { randomBytes, randomInt, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { prisma } from "@/lib/prisma";
import type { UserTier } from "@prisma/client";

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
}) {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();

  if (!EMAIL_RE.test(email)) throw new AuthError("Invalid email address");
  if (input.password.length < 8) throw new AuthError("Password must be at least 8 characters");
  if (fullName.length < 1 || fullName.length > 120) throw new AuthError("Name must be 1-120 characters");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AuthError("An account with this email already exists");

  const otp = generateOtp();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash: await hashPassword(input.password),
        fullName,
        verified: false,
        emailOtp: otp,
        emailOtpExpires: otpExpires,
        settings: { create: {} },
        subscription: { create: {} },
      },
    });
    return user;
  });
}

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user?.passwordHash) throw new AuthError("Invalid email or password");
  if (!(await verifyPassword(password, user.passwordHash))) {
    throw new AuthError("Invalid email or password");
  }
  if (!user.verified) throw new AuthError("Please verify your email before logging in", "UNVERIFIED");
  return user;
}

export function generateOtp(): string {
  // crypto.randomInt uses the OS CSPRNG — safe for security-sensitive codes.
  return randomInt(100_000, 1_000_000).toString();
}

export async function verifyOtp(email: string, otp: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user) throw new AuthError("No account found with this email");
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

  return user;
}

export async function resendOtp(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user) throw new AuthError("No account found with this email");
  if (user.verified) throw new AuthError("This account is already verified");

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
