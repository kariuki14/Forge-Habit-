// UI-facing option lists. Must stay in sync with Prisma enums in
// prisma/schema.prisma (HabitCategory, TimeWindow, FrequencyType).
// Server-side validation in lib/habits.ts remains the source of truth.

export const HABIT_CATEGORIES = [
  "MINDFULNESS",
  "FOCUS",
  "HEALTH",
  "PHYSICAL",
  "GROWTH",
] as const;

export const TIME_WINDOWS = [
  "ANYTIME",
  "MORNING",
  "AFTERNOON",
  "EVENING",
  "NIGHT",
] as const;

export const GOAL_CATEGORIES = [
  "READING",
  "FITNESS",
  "FINANCE",
  "LEARNING",
  "CAREER",
  "CREATIVE",
  "PERSONAL",
  "TRAVEL",
] as const;
