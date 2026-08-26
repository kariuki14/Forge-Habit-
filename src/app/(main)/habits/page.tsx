import PageHeader from "@/components/PageHeader";
import { HabitListCard } from "@/components/HabitCard";
import WeekMatrix from "@/components/WeekMatrix";
import NewHabitSheet from "@/components/NewHabitSheet";
import { getHabitsView } from "@/lib/queries";
import { getSessionUser } from "@/lib/session";

export default async function HabitsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  const { habits, weekMatrix } = await getHabitsView(sessionUser.id, sessionUser.timezone);

  return (
    <div className="space-y-6">
      <div className="lg:hidden">
        <PageHeader title="My Habits" user={sessionUser} />
      </div>
      <h1 className="hidden text-3xl font-bold text-slate-800 dark:text-slate-100 lg:block">My Habits</h1>

      <section className="rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Consistency Week
        </p>
        <WeekMatrix days={weekMatrix} />
      </section>

      <section className="grid gap-3 pb-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {habits.length === 0 ? (
          <p className="col-span-full rounded-2xl bg-white dark:bg-slate-800 p-8 text-center text-sm text-slate-400 dark:text-slate-500 shadow-sm">
            No habits yet — tap the + button to forge your first one.
          </p>
        ) : (
          habits.map((habit) => <HabitListCard key={habit.id} habit={habit} />)
        )}
      </section>

      <NewHabitSheet />
    </div>
  );
}
