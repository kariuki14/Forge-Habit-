"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { createHabitAction, type HabitFormState } from "@/actions/habits";
import { HABIT_CATEGORIES, TIME_WINDOWS } from "@/lib/ui-constants";
import CustomDropdown from "@/components/CustomDropdown";

const initial: HabitFormState = { error: null };

const CATEGORY_ICONS: Record<string, string> = {
  MINDFULNESS: "🧘",
  FOCUS: "🎯",
  HEALTH: "💚",
  PHYSICAL: "💪",
  GROWTH: "🌱",
};

const WINDOW_ICONS: Record<string, string> = {
  ANYTIME: "⏰",
  MORNING: "🌅",
  AFTERNOON: "☀️",
  EVENING: "🌇",
  NIGHT: "🌙",
};

export default function NewHabitSheet() {
  const [open, setOpen] = useState(false);
  const [frequency, setFrequency] = useState("DAILY");
  const [state, formAction, pending] = useActionState(createHabitAction, initial);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Create habit"
        className="absolute bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-forest text-white shadow-lg shadow-forest/30 transition-transform active:scale-90"
      >
        <Plus size={26} strokeWidth={2.4} />
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
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">New Habit</h2>
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
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Habit name
            </label>
            <input
              name="title"
              required
              maxLength={120}
              placeholder="Morning Meditation"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2.5 text-sm outline-none focus:border-lime-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Daily target
              </label>
              <input
                name="targetValue"
                type="number"
                step="any"
                min="0.01"
                required
                defaultValue={10}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2.5 text-sm outline-none focus:border-lime-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Unit
              </label>
              <input
                name="unit"
                required
                maxLength={24}
                placeholder="mins"
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
              defaultValue="HEALTH"
              options={HABIT_CATEGORIES.map((c) => ({
                value: c,
                label: c.toLowerCase(),
                icon: CATEGORY_ICONS[c],
              }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Time of day
            </label>
            <CustomDropdown
              name="timeWindow"
              defaultValue="ANYTIME"
              options={TIME_WINDOWS.map((w) => ({
                value: w,
                label: w.toLowerCase(),
                icon: WINDOW_ICONS[w],
              }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Frequency
            </label>
            <CustomDropdown
              name="frequency"
              value={frequency}
              onChange={setFrequency}
              options={[
                { value: "DAILY", label: "Every day", icon: "📅" },
                { value: "WEEKLY", label: "X times per week", icon: "📆" },
              ]}
            />
          </div>

          {frequency === "WEEKLY" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Times per week (1-7)
              </label>
              <input
                name="timesPerWeek"
                type="number"
                min={1}
                max={7}
                defaultValue={3}
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2.5 text-sm outline-none focus:border-lime-500"
              />
            </div>
          )}

          {state.error && <p className="text-xs text-red-500">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 w-full rounded-xl bg-lime-400 py-3 text-sm font-bold text-forest transition-colors hover:bg-lime-300 disabled:opacity-60"
          >
            {pending ? "Creating..." : "Create Habit"}
          </button>
        </div>
      </form>
    </div>
  );
}
