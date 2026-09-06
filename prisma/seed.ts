import "dotenv/config";
import { PrismaClient, DayOfWeek, HabitCategory } from "@prisma/client";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { emailIndex, generateDek, wrapDek, encryptField } from "../src/lib/crypto";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@forgehabit.app";
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "demo-password-change-me";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function daysAgo(n: number): Date {
  return startOfDay(new Date(Date.now() - n * 86_400_000));
}

function at(date: Date, hour: number, minute: number): Date {
  const copy = new Date(date);
  copy.setUTCHours(hour, minute, 0, 0);
  return copy;
}

const WEEKDAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
];

type LogSeed = {
  date: Date;
  completed: boolean;
  valueLogged: number;
  durationMinutes?: number;
  completedAt?: Date;
  note?: string;
};

function meditationLogs(): LogSeed[] {
  const logs: LogSeed[] = [];
  for (let i = 27; i >= 1; i--) {
    if (i % 7 === 0) continue;
    const date = daysAgo(i);
    logs.push({
      date,
      completed: true,
      valueLogged: 10,
      durationMinutes: 10,
      completedAt: at(date, 8, 0),
    });
  }
  return logs;
}

function hydrationLogs(): LogSeed[] {
  const logs: LogSeed[] = [];
  for (let i = 27; i >= 0; i--) {
    const date = daysAgo(i);
    const values = [2.5, 1.8, 2.6, 2.2, 1.4];
    const value = values[i % values.length];
    const completed = value >= 2.5;
    logs.push({
      date,
      completed,
      valueLogged: value,
      completedAt: completed ? at(date, 19, 30) : undefined,
      note: completed ? undefined : "Forgot the afternoon refill",
    });
  }
  return logs;
}

function readingLogs(): LogSeed[] {
  const logs: LogSeed[] = [];
  for (let i = 20; i >= 0; i--) {
    const date = daysAgo(i);
    const day = date.getUTCDay();
    if (day === 0 || day === 6) continue;
    const pages = [20, 24, 18, 32][i % 4];
    logs.push({
      date,
      completed: pages >= 20,
      valueLogged: pages,
      durationMinutes: Math.round(pages * 1.8),
      completedAt: at(date, 21, 45),
    });
  }
  return logs;
}

function runningLogs(): LogSeed[] {
  const logs: LogSeed[] = [];
  for (let i = 27; i >= 0; i--) {
    const date = daysAgo(i);
    const day = date.getUTCDay();
    if (day !== 1 && day !== 3 && day !== 6) continue;
    const km = [3, 5, 4.2][i % 3];
    logs.push({
      date,
      completed: true,
      valueLogged: km,
      durationMinutes: Math.round(km * 6),
      completedAt: at(date, 6, 30),
    });
  }
  return logs;
}

function computeStreaks(logs: LogSeed[]) {
  let currentStreak = 0;
  const sortedDesc = [...logs].sort((a, b) => b.date.getTime() - a.date.getTime());
  for (const log of sortedDesc) {
    if (!log.completed) break;
    currentStreak++;
  }
  let bestStreak = 0;
  let running = 0;
  for (const log of [...logs].sort((a, b) => a.date.getTime() - b.date.getTime())) {
    running = log.completed ? running + 1 : 0;
    bestStreak = Math.max(bestStreak, running);
  }
  const totalCompletions = logs.filter((l) => l.completed).length;
  return { currentStreak, bestStreak, totalCompletions };
}

async function main() {
  await prisma.user.deleteMany({ where: { emailIndex: emailIndex(DEMO_EMAIL) } });

  await seedCatalogs();

  const dek = generateDek();
  const user = await prisma.user.create({
    data: {
      email: encryptField(dek, DEMO_EMAIL)!,
      emailIndex: emailIndex(DEMO_EMAIL),
      passwordHash: hashPassword(DEMO_PASSWORD),
      fullName: encryptField(dek, "Simon Wanjira")!,
      avatarUrl: encryptField(dek, "https://api.dicebear.com/9.x/notionists/svg?seed=forge-demo"),
      bio: encryptField(dek, "Forging discipline, one rep at a time."),
      key: { create: { wrappedDek: wrapDek(dek) } },
      currentStreak: 12,
      bestStreak: 34,
      xpPoints: 12_450,
      tier: "ELITE",
      timezone: "Africa/Nairobi",
      settings: {
        create: {
          notificationsEnabled: true,
          pushNotifications: true,
          emailNotifications: false,
          appearanceMode: "DARK",
          themeColor: "ember",
          language: "en",
          weekStartsOn: DayOfWeek.MONDAY,
        },
      },
      subscription: {
        create: {
          tier: "PREMIUM",
          status: "ACTIVE",
          paymentProvider: "stripe",
          externalId: "sub_demo_premium",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000),
          cancelAtPeriodEnd: false,
        },
      },
    },
  });

  await prisma.account.create({
    data: {
      userId: user.id,
      provider: "google",
      providerAccountId: "google-1048291038572-demo",
      scope: "openid email profile",
      tokenType: "Bearer",
    },
  });

  const habitSpecs = [
    {
      title: "Morning Meditation",
      description: "10 minutes of guided breathing before the day starts.",
      category: HabitCategory.MINDFULNESS,
      icon: "lotus",
      colorTheme: "#A78BFA",
      targetValue: 10,
      unit: "mins",
      timeWindow: "MORNING" as const,
      frequency: "DAILY" as const,
      customDays: [],
      logs: meditationLogs(),
    },
    {
      title: "Hydrate",
      description: "Drink water consistently across the day.",
      category: HabitCategory.HEALTH,
      icon: "droplet",
      colorTheme: "#38BDF8",
      targetValue: 2.5,
      unit: "Liters",
      timeWindow: "ANYTIME" as const,
      frequency: "DAILY" as const,
      customDays: [],
      logs: hydrationLogs(),
    },
    {
      title: "Read Pages",
      description: "Evening reading session, no phone allowed.",
      category: HabitCategory.GROWTH,
      icon: "book-open",
      colorTheme: "#FBBF24",
      targetValue: 20,
      unit: "Pages",
      timeWindow: "EVENING" as const,
      frequency: "DAILY" as const,
      customDays: [],
      logs: readingLogs(),
    },
    {
      title: "Deep Work Block",
      description: "Single-tasking on the hardest problem of the day.",
      category: HabitCategory.FOCUS,
      icon: "target",
      colorTheme: "#34D399",
      targetValue: 90,
      unit: "mins",
      timeWindow: "MORNING" as const,
      frequency: "CUSTOM_DAYS" as const,
      customDays: WEEKDAYS,
      timesPerWeek: null,
      logs: [] as LogSeed[],
    },
    {
      title: "Morning Run",
      description: "Zone 2 pace along the river loop.",
      category: HabitCategory.PHYSICAL,
      icon: "activity",
      colorTheme: "#F87171",
      targetValue: 3,
      unit: "Kilometers",
      timeWindow: "MORNING" as const,
      frequency: "WEEKLY" as const,
      timesPerWeek: 3,
      customDays: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.SATURDAY],
      logs: runningLogs(),
    },
  ];

  for (const spec of habitSpecs) {
    const streaks = computeStreaks(spec.logs);
    const habit = await prisma.habit.create({
      data: {
        userId: user.id,
        title: spec.title,
        description: spec.description,
        category: spec.category,
        icon: spec.icon,
        colorTheme: spec.colorTheme,
        targetValue: spec.targetValue,
        unit: spec.unit,
        timeWindow: spec.timeWindow,
        frequency: spec.frequency,
        timesPerWeek: spec.timesPerWeek,
        customDays: spec.customDays,
        startDate: daysAgo(28),
        isArchived: false,
        ...streaks,
      },
    });

    if (spec.logs.length > 0) {
      await prisma.habitLog.createMany({
        data: spec.logs.map((log) => ({
          habitId: habit.id,
          userId: user.id,
          date: log.date,
          completed: log.completed,
          valueLogged: log.valueLogged,
          durationMinutes: log.durationMinutes ?? null,
          completedAt: log.completedAt ?? null,
          note: log.note ?? null,
        })),
      });
    }
  }

  const booksGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      category: "READING",
      title: "Read 52 Books This Year",
      description: "One book a week. Fiction and non-fiction alternating.",
      targetValue: 52,
      unit: "books",
      currentValue: 26,
      startDate: daysAgo(182),
      targetDate: daysAgo(-183),
      status: "ACTIVE",
      milestones: {
        create: [
          {
            title: "Book 13: First Quarter",
            sequenceOrder: 1,
            isCompleted: true,
            completedAt: daysAgo(120),
          },
          {
            title: "Book 26: Halfway!",
            sequenceOrder: 2,
            isCompleted: true,
            completedAt: daysAgo(14),
          },
          {
            title: "Book 39: Three Quarters",
            sequenceOrder: 3,
            isCompleted: false,
          },
          {
            title: "Book 52: Finish Line",
            sequenceOrder: 4,
            isCompleted: false,
          },
        ],
      },
    },
  });

  const runGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      category: "FITNESS",
      title: "Run 1,000 Kilometers",
      description: "Annual distance challenge across road and trail.",
      targetValue: 1000,
      unit: "Kilometers",
      currentValue: 340,
      startDate: daysAgo(210),
      targetDate: daysAgo(-155),
      status: "ACTIVE",
      milestones: {
        create: [
          { title: "First 100K", sequenceOrder: 1, isCompleted: true, completedAt: daysAgo(160) },
          { title: "Halfway: 500K", sequenceOrder: 2, isCompleted: false },
          { title: "Final Stretch: 900K", sequenceOrder: 3, isCompleted: false },
        ],
      },
    },
  });

  await prisma.goal.create({
    data: {
      userId: user.id,
      category: "FINANCE",
      title: "Save $10,000 Emergency Fund",
      description: "Six months of runway, automated monthly transfers.",
      targetValue: 10_000,
      unit: "USD",
      currentValue: 6_200,
      startDate: daysAgo(240),
      targetDate: daysAgo(-125),
      status: "ACTIVE",
    },
  });

  await prisma.goal.create({
    data: {
      userId: user.id,
      category: "LEARNING",
      title: "Reach B1 French Level",
      description: "Daily practice plus weekly conversation classes.",
      targetValue: 100,
      unit: "%",
      currentValue: 100,
      startDate: daysAgo(300),
      targetDate: daysAgo(60),
      status: "COMPLETED",
      completedAt: daysAgo(60),
    },
  });

  const achievements = await prisma.achievement.findMany();
  const byCode = new Map(achievements.map((a) => [a.code, a]));

  await prisma.userAchievement.createMany({
    data: [
      {
        userId: user.id,
        achievementId: byCode.get("MEDITATION_MASTER")!.id,
        earnedAt: daysAgo(9),
      },
      {
        userId: user.id,
        achievementId: byCode.get("A2_FRENCH_LEVEL")!.id,
        earnedAt: daysAgo(150),
      },
      {
        userId: user.id,
        achievementId: byCode.get("GOAL_CRUSHER")!.id,
        goalId: booksGoal.id,
        earnedAt: daysAgo(14),
      },
      {
        userId: user.id,
        achievementId: byCode.get("IRON_LEGS")!.id,
        goalId: runGoal.id,
        earnedAt: daysAgo(160),
      },
    ],
  });

  const today = daysAgo(0);
  await prisma.quote.upsert({
    where: { displayedDate: today },
    update: {},
    create: {
      content:
        "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
      author: "Aristotle",
      displayedDate: today,
    },
  });

  await prisma.insight.createMany({
    data: [
      {
        userId: user.id,
        type: "BEST_TIME",
        title: "You are most consistent at 8:00 AM",
        content:
          "92% of your Morning Meditation check-ins land within 15 minutes of 8:00 AM. Schedule new habits right after it to inherit the momentum.",
        data: { hour: 8, adherence: 0.92, sampleDays: 24 },
      },
      {
        userId: user.id,
        type: "HABIT_CORRELATION",
        title: "Meditation boosts your Deep Work output",
        content:
          "On days you meditate, your Deep Work sessions run 23% longer. Protecting the morning stack pays off.",
        data: { correlation: 0.71, liftPct: 23, habits: ["Morning Meditation", "Deep Work Block"] },
      },
      {
        userId: user.id,
        type: "STREAK_ALERT",
        title: "Hydration streak at risk this week",
        content:
          "Your Hydrate completions drop 40% on weekdays after 16:00 meetings. Try a 2L checkpoint before your commute home.",
        data: { habitTitle: "Hydrate", riskLevel: "medium", dropPct: 40 },
      },
    ],
  });

  const weekLogs = await prisma.habitLog.findMany({
    where: { userId: user.id, date: { gte: daysAgo(6) } },
    include: { habit: true },
  });

  const scheduledThisWeek = 7 * habitSpecs.filter(
    (h) => h.frequency === "DAILY"
  ).length;

  await prisma.analyticsSnapshot.create({
    data: {
      userId: user.id,
      period: "WEEKLY",
      periodStart: daysAgo(6),
      metrics: {
        totalImpactPct: 81,
        completions: weekLogs.filter((l) => l.completed).length,
        scheduled: scheduledThisWeek,
        consistencyWeekMatrix: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].map(
          (day, idx) => ({
            day,
            ratio: Number(
              (
                weekLogs.filter(
                  (l) => l.completed && (l.date.getUTCDay() + 6) % 7 === idx
                ).length /
                Math.max(
                  1,
                  weekLogs.filter((l) => (l.date.getUTCDay() + 6) % 7 === idx)
                    .length
                )
              ).toFixed(2)
            ),
          })
        ),
        bestWindow: "MORNING",
        partialCompletions: weekLogs.filter(
          (l) => !l.completed && Number(l.valueLogged) > 0
        ).length,
      },
    },
  });
}

async function seedCatalogs() {
  const quotes = [
    {
      content:
        "Discipline is choosing between what you want now and what you want most.",
      author: "Abraham Lincoln",
      offset: 1,
    },
    {
      content: "Small disciplines repeated with consistency lead to great achievements.",
      author: "John Maxwell",
      offset: 2,
    },
    {
      content: "You do not rise to the level of your goals. You fall to the level of your systems.",
      author: "James Clear",
      offset: 3,
    },
    {
      content: "The mind is the athlete; the body is simply the means it uses.",
      author: "Bryce Courtenay",
      offset: 4,
    },
    {
      content: "Motivation gets you going, but discipline keeps you growing.",
      author: "John Maxwell",
      offset: 5,
    },
    {
      content: "He who has a why to live can bear almost any how.",
      author: "Friedrich Nietzsche",
      offset: 6,
    },
    {
      content: "Success is the product of daily habits, not once-in-a-lifetime transformations.",
      author: "James Clear",
      offset: 7,
    },
  ];

  for (const q of quotes) {
    await prisma.quote.upsert({
      where: { displayedDate: daysAgo(q.offset) },
      update: {},
      create: {
        content: q.content,
        author: q.author,
        displayedDate: daysAgo(q.offset),
      },
    });
  }

  const achievements = [
    {
      code: "MEDITATION_MASTER",
      title: "Meditation Master",
      description: "Complete 100 meditation sessions.",
      icon: "lotus",
      type: "CONSISTENCY" as const,
    },
    {
      code: "A2_FRENCH_LEVEL",
      title: "A2 French Level",
      description: "Pass the A2 French proficiency milestone.",
      icon: "languages",
      type: "SKILL_LEVEL" as const,
    },
    {
      code: "GOAL_CRUSHER",
      title: "Goal Crusher",
      description: "Complete every milestone on an active goal.",
      icon: "target",
      type: "MILESTONE" as const,
    },
    {
      code: "IRON_LEGS",
      title: "Iron Legs",
      description: "Run your first 100 kilometers.",
      icon: "activity",
      type: "STREAK" as const,
    },
    {
      code: "FIRST_NORTH_STAR",
      title: "North Star Reached",
      description: "Complete your first long-term goal.",
      icon: "star",
      type: "GOAL_COMPLETION" as const,
    },
    {
      code: "STREAK_30",
      title: "Unbreakable Thirty",
      description: "Hold a 30-day streak on any habit.",
      icon: "flame",
      type: "STREAK" as const,
    },
  ];

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { code: a.code },
      update: {},
      create: a,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
