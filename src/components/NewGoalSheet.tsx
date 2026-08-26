"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { createGoalAction, type GoalFormState } from "@/actions/goals";
import { GOAL_CATEGORIES } from "@/lib/ui-constants";
import CustomDropdown from "@/components/CustomDropdown";

const initial: GoalFormState = { error: null };

const GOAL_ICONS: Record<string, string> = {
  READING: "📖",
  FITNESS: "💪",
  FINANCE: "💰",
  LEARNING: "🧠",
  CAREER: "💼",
  CREATIVE: "🎨",
  PERSONAL: "🌱",
  TRAVEL: "✈️",
};

export default function NewGoalSheet() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createGoalAction, initial);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Add goal"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-200 dark:border-amber-800 py-3.5 text-sm font-medium text-amber-600 dark:text-amber-400 transition-colors hover:border-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
      >
        <Plus size={16} strokeWidth={2.5} />
        Set a North Star goal
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-md items-end bg-black/60 backdrop-blur-sm">
      <form
        action={formAction}
        className="max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl bg-white dark:bg-slate-800 p-6 pb-10"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">New Goal</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="rounded-full bg-slate-100 dark:bg-slate-700 p-2 text-slate-500 dark:text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="ng-title" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Goal name
            </label>
            <input
              id="ng-title"
              name="title"
              required
              maxLength={160}
              placeholder="Read 24 books this year"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2.5 text-sm outline-none focus:border-lime-500"
            />
          </div>

          <div>
            <label htmlFor="ng-description" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Why does this matter?
            </label>
            <input
              id="ng-description"
              name="description"
              maxLength={500}
              placeholder="Expand my worldview through reading"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2.5 text-sm outline-none focus:border-lime-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ng-target" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Target value
              </label>
              <input
                id="ng-target"
                name="targetValue"
                type="number"
                step="any"
                min="0.01"
                required
                defaultValue={1}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2.5 text-sm outline-none focus:border-lime-500"
              />
            </div>
            <div>
              <label htmlFor="ng-unit" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Unit
              </label>
              <input
                id="ng-unit"
                name="unit"
                required
                maxLength={24}
                placeholder="books"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2.5 text-sm outline-none focus:border-lime-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Category
            </label>
            <CustomDropdown
              name="category"
              defaultValue="PERSONAL"
              options={GOAL_CATEGORIES.map((c) => ({
                value: c,
                label: c.toLowerCase(),
                icon: GOAL_ICONS[c],
              }))}
            />
          </div>

          <div>
            <label htmlFor="ng-date" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Target date (optional)
            </label>
            <input
              id="ng-date"
              name="targetDate"
              type="date"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2.5 text-sm outline-none focus:border-lime-500"
            />
          </div>

          {state.error && <p className="text-xs text-red-500">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
          >
            {pending ? "Creating..." : "Launch Goal"}
          </button>
        </div>
      </form>
    </div>
  );
}
