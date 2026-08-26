"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { quickAddHabitAction, type HabitFormState } from "@/actions/habits";

const initial: HabitFormState = { error: null };

export default function QuickAddHabit() {
  const [state, formAction, pending] = useActionState(quickAddHabitAction, initial);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-200 py-3.5 text-sm font-medium text-emerald-600 transition-colors hover:border-lime-400 hover:text-lime-600"
      >
        <Plus size={16} strokeWidth={2.5} />
        Add another focus for today
      </button>
    );
  }

  return (
    <form action={formAction} className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-3.5 shadow-sm">
      <label htmlFor="quick-habit" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
        New daily focus
      </label>
      <div className="flex gap-2">
        <input
          id="quick-habit"
          name="title"
          required
          maxLength={120}
          placeholder="e.g. Stretch for 10 minutes"
          autoFocus
          className="min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm outline-none focus:border-lime-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "..." : "Add"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl px-2 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
        >
          ✕
        </button>
      </div>
      {state.error && <p className="mt-2 text-xs text-red-500">{state.error}</p>}
    </form>
  );
}
