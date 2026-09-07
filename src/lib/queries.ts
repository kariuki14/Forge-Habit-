import { prisma } from "@/lib/prisma";
import { startOfLocalDay } from "@/lib/habits";
import type { UserTier } from "@prisma/client";
import { decryptUser } from "@/lib/pii";

export type TodayHabit = {
  id: string;
  title: string;
  icon: string;
  category: string;
  targetValue: number;
  unit: string;
  timeWindow: string;
  currentStreak: number;
  todayCompleted: boolean;
  todayValue: number | null;
};

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

export async function getTodayView(userId: string) {
  const userWithKey = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { key: true },
  });
  const user = decryptUser(userWithKey);
  const today = startOfLocalDay(user.timezone);

  const [habits, quote, weekLogs, todayLogs] = await Promise.all([
    prisma.habit.findMany({
      where: { userId, isArchived: false },
      orderBy: [{ timeWindow: "asc" }, { createdAt: "asc" }],
    }),
    prisma.quote.findUnique({ where: { displayedDate: today } }),
    prisma.habitLog.findMany({
      where: { userId, date: { gte: new Date(today.getTime() - 6 * 86_400_000), lte: today } },
      select: { date: true, completed: true },
    }),
    // Fetch today's logs in the same round-trip instead of a separate query.
    prisma.habitLog.findMany({
      where: { userId, date: today },
      select: { habitId: true, completed: true, valueLogged: true },
    }),
  ]);

  const todayByHabit = new Map<string, boolean>();
  const valueByHabit = new Map<string, number | null>();
  for (const log of todayLogs) {
    todayByHabit.set(log.habitId, log.completed);
    if (log.valueLogged != null) valueByHabit.set(log.habitId, Number(log.valueLogged));
  }

  const list: TodayHabit[] = habits.map((h) => ({
    id: h.id,
    title: h.title,
    icon: h.icon,
    category: h.category,
    targetValue: Number(h.targetValue),
    unit: h.unit,
    timeWindow: h.timeWindow,
    currentStreak: h.currentStreak,
    todayCompleted: todayByHabit.get(h.id) ?? false,
    todayValue: valueByHabit.get(h.id) ?? null,
  }));

  const completed = list.filter((h) => h.todayCompleted).length;
  const momentumPct = list.length === 0 ? 0 : Math.round((completed / list.length) * 100);

  const weekMatrix = buildWeekMatrix(weekLogs, today);

  return {
    user,
    habits: list,
    quote:
      quote ??
      ({
        content: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
        author: "Aristotle",
      } as { content: string; author: string }),
    momentum: { completed, total: list.length, pct: momentumPct },
    weekMatrix,
  };
}

function buildWeekMatrix(
  logs: Array<{ date: Date; completed: boolean }>,
  today: Date
): Array<{ label: string; dayNum: number; status: "done" | "partial" | "missed" | "today" }> {
  const byDate = new Map<number, { done: number; total: number }>();
  for (const log of logs) {
    // log.date is already day-aligned (stored as UTC midnight of the local date)
    const key = log.date.getTime();
    const entry = byDate.get(key) ?? { done: 0, total: 0 };
    entry.total += 1;
    if (log.completed) entry.done += 1;
    byDate.set(key, entry);
  }

  const days: Array<{ label: string; dayNum: number; status: "done" | "partial" | "missed" | "today" }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86_400_000);
    const entry = byDate.get(d.getTime());
    let status: "done" | "partial" | "missed" | "today" = "missed";
    if (i === 0 && !entry) status = "today";
    else if (entry) status = entry.done === entry.total ? "done" : entry.done > 0 ? "partial" : "missed";
    days.push({
      label: WEEKDAY_LABELS[d.getUTCDay()],
      dayNum: d.getUTCDate(),
      status,
    });
  }
  return days;
}

export async function getHabitsView(userId: string, timezone = "UTC") {
  const today = startOfLocalDay(timezone);
  const [habits, weekLogs] = await Promise.all([
    prisma.habit.findMany({
      where: { userId, isArchived: false },
      orderBy: { createdAt: "asc" },
    }),
    prisma.habitLog.findMany({
      where: { userId, date: { gte: new Date(today.getTime() - 6 * 86_400_000), lte: today } },
      select: { habitId: true, date: true, completed: true },
    }),
  ]);

  return {
    habits: habits.map((h) => ({
      id: h.id,
      title: h.title,
      description: h.description,
      icon: h.icon,
      colorTheme: h.colorTheme,
      category: h.category,
      frequency: h.frequency,
      timesPerWeek: h.timesPerWeek,
      customDays: h.customDays,
      currentStreak: h.currentStreak,
      bestStreak: h.bestStreak,
      targetValue: Number(h.targetValue),
      unit: h.unit,
    })),
    weekMatrix: buildWeekMatrix(weekLogs, today),
  };
}

export async function getInsightsView(userId: string) {
  const [habits, insights, snapshot] = await Promise.all([
    prisma.habit.findMany({
      where: { userId, isArchived: false },
      select: { bestStreak: true, category: true },
    }),
    prisma.insight.findMany({
      where: { userId, isDismissed: false },
      orderBy: { generatedAt: "desc" },
      take: 5,
    }),
    prisma.analyticsSnapshot.findFirst({
      where: { userId },
      orderBy: { periodStart: "desc" },
    }),
  ]);

  const bestStreak = habits.reduce((m, h) => Math.max(m, h.bestStreak), 0);

  const metrics = (snapshot?.metrics ?? {}) as { totalImpactPct?: number };
  let impactPct = metrics.totalImpactPct;
  if (impactPct == null) {
    const since = new Date(Date.now() - 7 * 86_400_000);
    const logs = await prisma.habitLog.findMany({
      where: { userId, date: { gte: since } },
      select: { completed: true },
    });
    impactPct =
      logs.length === 0 ? 0 : Math.round((logs.filter((l) => l.completed).length / logs.length) * 100);
  }

  const catCounts = new Map<string, number>();
  for (const h of habits) {
    catCounts.set(h.category, (catCounts.get(h.category) ?? 0) + 1);
  }
  const breakdown = [...catCounts.entries()]
    .map(([label, count]) => ({ label, pct: Math.round((count / habits.length) * 100) }))
    .sort((a, b) => b.pct - a.pct);

  return { bestStreak, impactPct, breakdown, insights };
}

export async function getGoalsView(userId: string) {
  const [goals, completedGoals, earned] = await Promise.all([
    prisma.goal.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
      include: { milestones: { orderBy: { sequenceOrder: "asc" } } },
    }),
    prisma.goal.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      include: { milestones: { orderBy: { sequenceOrder: "asc" } } },
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      orderBy: { earnedAt: "desc" },
      include: { achievement: true },
    }),
  ]);

  const now = Date.now();
  return {
    goals: goals.map((g) => {
      const pct = Math.min(100, Math.round((Number(g.currentValue) / Number(g.targetValue)) * 100));
      const nextMilestone = g.milestones.find((m) => !m.isCompleted) ?? null;
      let pace: "ahead" | "on-track" | "behind";
      if (!g.targetDate || g.startDate >= g.targetDate) {
        pace = "on-track";
      } else {
        const elapsed = now - g.startDate.getTime();
        const totalSpan = g.targetDate.getTime() - g.startDate.getTime();
        const expectedPct = Math.min(100, Math.max(0, (elapsed / totalSpan) * 100));
        pace = pct >= expectedPct + 10 ? "ahead" : pct >= expectedPct - 10 ? "on-track" : "behind";
      }
      return {
        id: g.id,
        title: g.title,
        description: g.description,
        category: g.category,
        icon: goalIcon(g.category),
        currentValue: Number(g.currentValue),
        targetValue: Number(g.targetValue),
        unit: g.unit,
        pct,
        targetDate: g.targetDate,
        nextMilestone: nextMilestone
          ? { title: nextMilestone.title, sequenceOrder: nextMilestone.sequenceOrder }
          : null,
        pace,
      };
    }),
    completedGoals: completedGoals.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      category: g.category,
      icon: goalIcon(g.category),
      currentValue: Number(g.currentValue),
      targetValue: Number(g.targetValue),
      unit: g.unit,
      completedAt: g.completedAt,
    })),
    trophies: earned.map((ua) => ({
      id: ua.id,
      code: ua.achievement.code,
      title: ua.achievement.title,
      icon: ua.achievement.icon,
      type: ua.achievement.type,
      earnedAt: ua.earnedAt,
    })),
  };
}

function goalIcon(category: string): string {
  switch (category) {
    case "READING":
      return "book-open";
    case "FITNESS":
      return "activity";
    case "FINANCE":
      return "banknote";
    case "LEARNING":
      return "languages";
    case "CAREER":
      return "briefcase";
    case "CREATIVE":
      return "palette";
    case "TRAVEL":
      return "plane";
    default:
      return "target";
  }
}
