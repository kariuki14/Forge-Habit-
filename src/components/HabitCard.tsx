import HabitIcon from "@/components/HabitIcon";
import CheckinToggle from "@/components/CheckinToggle";
import { StreakBadge, CategoryPill, FrequencyBadge } from "@/components/badges";
import type { TodayHabit } from "@/lib/queries";

const WINDOW_LABEL: Record<string, string> = {
  MORNING: "Morning",
  AFTERNOON: "Afternoon",
  EVENING: "Evening",
  NIGHT: "Night",
  ANYTIME: "Anytime",
};

export default function HabitCard({ habit }: { habit: TodayHabit }) {
  const progress =
    habit.todayValue != null
      ? `${habit.todayValue} ${habit.unit}`
      : `${habit.targetValue} ${habit.unit}`;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-3.5 shadow-sm">
      <HabitIcon icon={habit.icon} size={44} />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-semibold ${
            habit.todayCompleted ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-800 dark:text-slate-100"
          }`}
        >
          {habit.title}
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{progress}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            {WINDOW_LABEL[habit.timeWindow] ?? habit.timeWindow}
          </span>
          <StreakBadge streak={habit.currentStreak} />
        </div>
      </div>
      <CheckinToggle habitId={habit.id} completed={habit.todayCompleted} />
    </div>
  );
}

export function HabitListCard({
  habit,
}: {
  habit: {
    id: string;
    title: string;
    icon: string;
    colorTheme: string | null;
    category: string;
    frequency: string;
    timesPerWeek: number | null;
    currentStreak: number;
  };
}) {
  return (
    <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <HabitIcon icon={habit.icon} colorTheme={habit.colorTheme} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{habit.title}</p>
            <StreakBadge streak={habit.currentStreak} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <CategoryPill category={habit.category} />
            <FrequencyBadge frequency={habit.frequency} timesPerWeek={habit.timesPerWeek} />
          </div>
        </div>
      </div>
    </div>
  );
}
