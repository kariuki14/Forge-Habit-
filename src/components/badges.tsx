export function StreakBadge({ streak }: { streak: number }) {
  if (streak <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
        No streak yet
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 text-[11px] font-semibold text-orange-600 dark:text-orange-400">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
      </svg>
      {streak} Day Streak
    </span>
  );
}

export function CategoryPill({ category }: { category: string }) {
  const styles: Record<string, string> = {
    MINDFULNESS: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400",
    FOCUS: "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400",
    HEALTH: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400",
    PHYSICAL: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    GROWTH: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
        styles[category] ?? "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
      }`}
    >
      {category.toLowerCase()}
    </span>
  );
}

export function FrequencyBadge({
  frequency,
  timesPerWeek,
}: {
  frequency: string;
  timesPerWeek: number | null;
}) {
  let label = "Daily";
  if (frequency === "WEEKLY") label = `${timesPerWeek ?? 1}x / Week`;
  if (frequency === "CUSTOM_DAYS") label = "Custom days";
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
      {label}
    </span>
  );
}
