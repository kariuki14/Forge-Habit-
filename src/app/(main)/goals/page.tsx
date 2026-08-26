import { Trophy, Star } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import GoalProgressCard from "@/components/GoalProgressCard";
import NewGoalSheet from "@/components/NewGoalSheet";
import { getGoalsView } from "@/lib/queries";
import { getSessionUser } from "@/lib/session";

export default async function GoalsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  const { goals, trophies } = await getGoalsView(sessionUser.id);

  return (
    <div className="space-y-6">
      <div className="lg:hidden">
        <PageHeader title="North Star" user={sessionUser} />
      </div>
      <h1 className="hidden text-3xl font-bold text-slate-800 dark:text-slate-100 lg:block">North Star</h1>

      <section className="flex-1">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Active Journeys
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {goals.length === 0 ? (
            <p className="col-span-full rounded-2xl bg-white dark:bg-slate-800 p-8 text-center text-sm text-slate-400 dark:text-slate-500 shadow-sm">
              No active goals yet. Set a North Star and start the climb.
            </p>
          ) : (
            goals.map((goal) => <GoalProgressCard key={goal.id} goal={goal} />)
          )}
        </div>
        <div className="mt-4">
          <NewGoalSheet />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Trophy size={16} className="text-amber-400" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Wall of Victory
          </p>
        </div>

        {trophies.length === 0 ? (
          <p className="rounded-2xl bg-white dark:bg-slate-800 p-8 text-center text-sm text-slate-400 dark:text-slate-500 shadow-sm">
            Your trophies will live here once earned.
          </p>
        ) : (
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 xl:grid-cols-4">
            {trophies.map((t) => (
              <div
                key={t.id}
                className="flex w-36 shrink-0 flex-col items-center rounded-2xl bg-gradient-to-b from-forest to-forest-deep p-4 text-center shadow-sm lg:w-auto"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-lime-400/20 text-lime-300">
                  <Star size={22} fill="currentColor" strokeWidth={0} />
                </span>
                <p className="mt-2.5 text-sm font-bold leading-tight text-white">{t.title}</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-lime-300/80">
                  Earned {t.earnedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
