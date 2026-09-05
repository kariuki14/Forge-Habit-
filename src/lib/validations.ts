import { z } from "zod";

/**
 * Shared Zod schemas for Server Actions and API routes.
 * Server-side validation is the source of truth — client-side checks are UX only.
 */

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address").max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
  fullName: z.string().trim().min(1, "Name is required").max(120, "Name too long"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required").max(128),
});

export const sendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  otp: z.string().trim().regex(/^\d{6}$/, "Verification code must be 6 digits"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Reset token is required").max(191),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
});

export const habitCategories = [
  "MINDFULNESS",
  "FOCUS",
  "HEALTH",
  "PHYSICAL",
  "GROWTH",
] as const;

export const timeWindows = ["MORNING", "AFTERNOON", "EVENING", "NIGHT", "ANYTIME"] as const;

export const habitFrequencies = ["DAILY", "WEEKLY", "CUSTOM_DAYS"] as const;

const daysOfWeek = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export const habitInputSchema = z.object({
  title: z.string().trim().min(1, "Title must be 1-120 characters").max(120),
  description: z.string().trim().max(500).optional().nullable(),
  category: z.enum(habitCategories),
  targetValue: z.number().positive("targetValue must be a positive number").max(1_000_000),
  unit: z.string().trim().min(1, "Unit is required").max(24),
  timeWindow: z.enum(timeWindows).default("ANYTIME"),
  frequency: z.enum(habitFrequencies).default("DAILY"),
  timesPerWeek: z.number().int().min(1).max(7).optional().nullable(),
  customDays: z.array(z.enum(daysOfWeek)).optional(),
  icon: z.string().trim().max(32).optional(),
  colorTheme: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{3,8}$/, "Invalid color")
    .optional(),
});

export const checkInSchema = z.object({
  valueLogged: z.number().min(0).max(1_000_000).optional(),
  durationMinutes: z.number().int().min(0).max(1440).optional(),
  note: z.string().trim().max(500).optional(),
});

export const goalSchema = z.object({
  title: z.string().trim().min(1, "Title must be 1-160 characters").max(160),
  description: z.string().trim().max(500).optional().nullable(),
  category: z.enum([
    "READING",
    "FITNESS",
    "FINANCE",
    "LEARNING",
    "CAREER",
    "CREATIVE",
    "PERSONAL",
    "TRAVEL",
  ]),
  targetValue: z.number().positive("Target must be a positive number").max(1_000_000_000),
  unit: z.string().trim().min(1, "Unit is required").max(24),
  targetDate: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date")
    .optional()
    .nullable(),
});

export const goalAmountSchema = z.object({
  goalId: z.string().trim().min(1).max(64),
  amount: z.number().positive("Amount must be a positive number").max(1_000_000_000),
});

export const settingsSchema = z
  .object({
    notificationsEnabled: z.boolean(),
    pushNotifications: z.boolean(),
    appearanceMode: z.enum(["LIGHT", "DARK", "SYSTEM"]),
  })
  .partial();
