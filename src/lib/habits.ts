import { Prisma, HabitCategory, FrequencyType, TimeWindow, DayOfWeek } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { XP_PER_COMPLETION, tierForXp } from "@/lib/auth";
import { habitInputSchema } from "@/lib/validations";

export class HabitError extends Error {}

type Tx = Prisma.TransactionClient;

const VALID_CATEGORIES = Object.values(HabitCategory) as string[];
const VALID_FREQUENCIES = Object.values(FrequencyType) as string[];
const VALID_WINDOWS = Object.values(TimeWindow) as string[];
const VALID_DAYS = Object.values(DayOfWeek) as string[];

// ---------------------------------------------------------------------------
// Timezone helpers
// "Today" for a user is their LOCAL calendar date. We store it canonically
// as a UTC-midnight Date of that local date (schema field is @db.Date).
// ---------------------------------------------------------------------------

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "UTC",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function dayKeyInTimezone(tz: string, d: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    // Invalid timezone string — fall back to UTC.
    return dayFormatter.format(d);
  }
}

export function utcDateOfDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

/** Start of the user's local "today" (and of `d`'s local date), as UTC-midnight Date. */
export function startOfLocalDay(tz: string, d: Date = new Date()): Date {
  return utcDateOfDayKey(dayKeyInTimezone(tz, d));
}

// ---------------------------------------------------------------------------
// Habit input parsing (shared by server actions and API routes)
// ---------------------------------------------------------------------------

export type HabitInput = {
  title: string;
  description?: string;
  category: string;
  targetValue: number;
  unit: string;
  timeWindow?: string;
  frequency?: string;
  timesPerWeek?: number | null;
  customDays?: string[];
  icon?: string;
  colorTheme?: string;
};

export function habitInputFromFormData(formData: FormData): HabitInput {
  const frequency = String(formData.get("frequency") ?? "DAILY");
  return {
    title: String(formData.get("title") ?? ""),
    description: formData.get("description") ? String(formData.get("description")) : undefined,
    category: String(formData.get("category") ?? ""),
    targetValue: Number(formData.get("targetValue")),
    unit: String(formData.get("unit") ?? ""),
    timeWindow: String(formData.get("timeWindow") ?? "ANYTIME"),
    frequency,
    timesPerWeek: frequency === "WEEKLY" ? Number(formData.get("timesPerWeek")) : null,
  };
}

// ---------------------------------------------------------------------------
// Habit creation
// ---------------------------------------------------------------------------
export async function createHabit(userId: string, rawInput: HabitInput) {
  const parsed = habitInputSchema.safeParse(rawInput);
  if (!parsed.success) throw new HabitError(parsed.error.issues[0]?.message ?? "Invalid habit data");
  const input = parsed.data;

  const title = input.title.trim();
  if (title.length < 1 || title.length > 120) throw new HabitError("Title must be 1-120 characters");
  const description = input.description?.trim() || null;
  if (description && description.length > 500)
    throw new HabitError("Description must be at most 500 characters");
  if (!VALID_CATEGORIES.includes(input.category)) throw new HabitError("Invalid category");
  if (!Number.isFinite(input.targetValue) || input.targetValue <= 0)
    throw new HabitError("targetValue must be a positive number");
  const unit = input.unit.trim();
  if (unit.length < 1 || unit.length > 24) throw new HabitError("Unit must be 1-24 characters");

  const frequency = input.frequency ?? FrequencyType.DAILY;
  if (!VALID_FREQUENCIES.includes(frequency)) throw new HabitError("Invalid frequency");
  const timeWindow = input.timeWindow ?? TimeWindow.ANYTIME;
  if (!VALID_WINDOWS.includes(timeWindow)) throw new HabitError("Invalid time window");

  let customDays: DayOfWeek[] = [];
  if (input.customDays) {
    if (!Array.isArray(input.customDays) || input.customDays.some((d) => !VALID_DAYS.includes(d))) {
      throw new HabitError("customDays must be an array of day names");
    }
    customDays = input.customDays as DayOfWeek[];
  }
  if (frequency === FrequencyType.CUSTOM_DAYS && customDays.length === 0) {
    throw new HabitError("CUSTOM_DAYS requires at least one day");
  }

  try {
    return await prisma.habit.create({
      data: {
        userId,
        title,
        description,
        category: input.category as HabitCategory,
        targetValue: input.targetValue,
        unit,
        timeWindow: timeWindow as TimeWindow,
        frequency: frequency as FrequencyType,
        timesPerWeek:
          frequency === FrequencyType.WEEKLY
            ? Math.min(7, Math.max(1, input.timesPerWeek ?? 1))
            : null,
        customDays,
        icon: input.icon ?? "flame",
        colorTheme: input.colorTheme ?? "#F97316",
      },
    });
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      throw new HabitError("You already have a habit with this title");
    }
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Check-ins (transactional: log upsert + counter recompute + XP/tier update)
// ---------------------------------------------------------------------------

async function applyUserStreakStats(userId: string, tx: Tx) {
  const agg = await tx.habit.aggregate({
    where: { userId, isArchived: false },
    _max: { currentStreak: true, bestStreak: true },
  });
  await tx.user.update({
    where: { id: userId },
    data: {
      currentStreak: agg._max.currentStreak ?? 0,
      bestStreak: Math.max(agg._max.bestStreak ?? 0, 0),
    },
  });
}

/**
 * Incrementally update streak + totalCompletions counters without scanning
 * all logs. We only need:
 *   - the current habit row (for existing counters)
 *   - yesterday's log (to decide if the current streak continues)
 *
 * This avoids an O(N) full-log fetch on every check-in.
 */
async function incrementalCounters(
  habit: { id: string; currentStreak: number; bestStreak: number; totalCompletions: number },
  date: Date,
  wasCompleted: boolean,
  nowCompleted: boolean,
  tx: Tx
) {
  // No state change → nothing to recompute.
  if (wasCompleted === nowCompleted) {
    return {
      currentStreak: habit.currentStreak,
      bestStreak: habit.bestStreak,
      totalCompletions: habit.totalCompletions,
    };
  }

  const yesterday = new Date(date.getTime() - 86_400_000);
  const prevLog = await tx.habitLog.findUnique({
    where: { habitId_date: { habitId: habit.id, date: yesterday } },
    select: { completed: true },
  });
  const yesterdayDone = prevLog?.completed ?? false;

  let { currentStreak, bestStreak, totalCompletions } = habit;

  if (nowCompleted) {
    // Checking in: extend streak if yesterday was done, otherwise start fresh.
    currentStreak = yesterdayDone ? currentStreak + 1 : 1;
    bestStreak = Math.max(bestStreak, currentStreak);
    totalCompletions += 1;
  } else {
    // Un-checking: subtract from totals.
    totalCompletions = Math.max(0, totalCompletions - 1);
    // If streak was built on today, step it back; clamp at 0.
    if (currentStreak > 0) currentStreak = yesterdayDone ? currentStreak - 1 : 0;
    // bestStreak never shrinks on undo.
  }

  await tx.habit.update({
    where: { id: habit.id },
    data: { currentStreak, bestStreak, totalCompletions },
  });
  return { currentStreak, bestStreak, totalCompletions };
}

/** Award or revoke XP inside the transaction; clamps at 0 atomically. */
async function applyXpDelta(userId: string, delta: number, tx: Tx) {
  const user = await tx.user.update({
    where: { id: userId },
    data: { xpPoints: { increment: delta } },
  });
  let xp = user.xpPoints;
  if (xp < 0) {
    xp = 0;
    await tx.user.update({ where: { id: userId }, data: { xpPoints: 0 } });
  }
  const tier = tierForXp(xp);
  if (tier !== user.tier) {
    await tx.user.update({ where: { id: userId }, data: { tier } });
  }
}

export async function toggleCheckIn(userId: string, habitId: string) {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
    include: { user: { select: { timezone: true } } },
  });
  if (!habit) throw new HabitError("Habit not found");
  if (habit.isArchived) throw new HabitError("Habit is archived");

  const date = startOfLocalDay(habit.user.timezone);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.habitLog.findUnique({
      where: { habitId_date: { habitId, date } },
    });

    const wasCompleted = existing?.completed ?? false;
    const nowCompleted = !wasCompleted;
    const value = nowCompleted
      ? (existing?.valueLogged != null
          ? Math.max(Number(existing.valueLogged), Number(habit.targetValue))
          : Number(habit.targetValue))
      : (existing?.valueLogged ?? null);

    await tx.habitLog.upsert({
      where: { habitId_date: { habitId, date } },
      create: {
        habitId,
        userId,
        date,
        completed: nowCompleted,
        valueLogged: value,
        completedAt: nowCompleted ? new Date() : null,
      },
      update: {
        completed: nowCompleted,
        valueLogged: value,
        completedAt: nowCompleted ? new Date() : null,
      },
    });

    const counters = await incrementalCounters(habit, date, wasCompleted, nowCompleted, tx);
    await applyXpDelta(userId, nowCompleted ? XP_PER_COMPLETION : -XP_PER_COMPLETION, tx);
    await applyUserStreakStats(userId, tx);

    return { completed: nowCompleted, ...counters };
  });
}
