import { Flame, Zap, Clock, TrendingUp, Link2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import MetricCard from "@/components/MetricCard";
import DonutChart from "@/components/DonutChart";
import { getInsightsView } from "@/lib/queries";
import { getSessionUser } from "@/lib/session";

const INSIGHT_ICONS: Record<string, typeof Clock> = {
  BEST_TIME: Clock,
  HABIT_CORRELATION: Link2,
  CONSISTENCY_TREND: TrendingUp,
  RECOMMENDATION: Zap,
  STREAK_ALERT: Flame,
};

export default async function InsightsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  const { bestStreak, impactPct, breakdown, insights } = await getInsightsView(sessionUser.id);

  return (
    <div className="space-y-6">
      <div className="lg:hidden">
        <PageHeader title="Insights" user={sessionUser} />
      </div>
      <h1 className="hidden text-3xl font-bold text-slate-800 dark:text-slate-100 lg:block">Insights</h1>

      <section className="grid gap-3 sm:grid-cols-2">
        <MetricCard
          label="Best Streak"
          value={`${bestStreak} days`}
          sub="Personal record"
          icon={Flame}
        />
        <MetricCard
          label="Total Impact"
          value={`${impactPct}%`}
          sub="Weekly completion rate"
          icon={Zap}
        />
      </section>

      <section className="rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Weekly Consistency
        </p>
        <div className="flex items-end gap-4">
          <div className="h-24 flex-1 overflow-hidden rounded-xl bg-emerald-50">
            <div
              className="flex h-full items-center justify-center bg-gradient-to-r from-forest to-lime-400 text-lg font-bold text-white transition-[width] duration-500"
              style={{ width: `${Math.max(8, impactPct)}%` }}
            >
              {impactPct >= 25 ? `${impactPct}%` : ""}
            </div>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Share of scheduled check-ins completed over the last 7 days.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Habit Breakdown
        </p>
        <DonutChart breakdown={breakdown} />
      </section>

      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Quick Insights
        </p>
        {insights.length === 0 ? (
          <p className="rounded-2xl bg-white dark:bg-slate-800 p-8 text-center text-sm text-slate-400 dark:text-slate-500 shadow-sm">
            Keep checking in — patterns will appear here.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {insights.map((insight) => {
              const Icon = INSIGHT_ICONS[insight.type] ?? Zap;
              return (
                <div
                  key={insight.id}
                  className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400">
                      <Icon size={17} strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug text-slate-800 dark:text-slate-100">
                        {insight.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {insight.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
