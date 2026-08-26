import { Quote } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ProgressRing from "@/components/ProgressRing";
import HabitCard from "@/components/HabitCard";
import WeekMatrix from "@/components/WeekMatrix";
import QuickAddHabit from "@/components/QuickAddHabit";
import { getTodayView } from "@/lib/queries";
import { getSessionUser } from "@/lib/session";

export default async function TodayPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  const { user, habits, quote, momentum, weekMatrix } = await getTodayView(sessionUser.id);

  return (
    <div className="space-y-6">
      {/* Hide PageHeader on desktop since Sidebar shows user info */}
      <div className="lg:hidden">
        <PageHeader title="Today" user={user} />
      </div>
      <h1 className="hidden text-3xl font-bold text-slate-800 dark:text-slate-100 lg:block">Today</h1>

      <section className="rounded-3xl bg-forest p-5 text-white shadow-sm">
        <div className="flex items-center gap-2">
          <Quote size={16} className="text-lime-300" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-lime-300">
            Daily Spark
          </p>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-emerald-50">"{quote.content}"</p>
        <p className="mt-1.5 text-xs font-medium text-lime-200">— {quote.author}</p>
      </section>

      <section className="rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
          <ProgressRing pct={momentum.pct} />
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Daily Momentum</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-forest dark:text-lime-400">{momentum.completed} of {momentum.total}</span>{" "}
              habits completed today
            </p>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              {momentum.pct === 100
                ? "Perfect day. The forge is hot."
                : momentum.pct >= 50
                  ? "Strong start — keep the fire going."
                  : "Every check-in counts. Start with one."}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 dark:border-slate-700 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Consistency Week
          </p>
          <WeekMatrix days={weekMatrix} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {habits.map((habit) => (
          <HabitCard key={habit.id} habit={habit} />
        ))}
        <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
          <QuickAddHabit />
        </div>
      </section>
    </div>
  );
}
