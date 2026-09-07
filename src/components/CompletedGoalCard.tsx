"use client";

import { useTransition, useState } from "react";
import { CheckCircle2, RotateCcw, Trash2 } from "lucide-react";
import { reopenGoalAction, deleteGoalAction } from "@/actions/goals";

export default function CompletedGoalCard({
  goal,
}: {
  goal: {
    id: string;
    title: string;
    description: string | null;
    currentValue: number;
    targetValue: number;
    unit: string;
    completedAt: Date | null;
  };
}) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleReopen() {
    setError(null);
    startTransition(async () => {
      const res = await reopenGoalAction(goal.id);
      if (res.error) setError(res.error);
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteGoalAction(goal.id);
      if (res.error) setError(res.error);
    });
  }

  const completedDateStr = goal.completedAt
    ? new Date(goal.completedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Completed";

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-lime-200/60 dark:border-lime-900/40 bg-lime-50/40 dark:bg-lime-950/10 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-100 dark:bg-lime-900/40 text-lime-600 dark:text-lime-400">
          <CheckCircle2 size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{goal.title}</p>
            <span className="shrink-0 rounded-full bg-lime-100 dark:bg-lime-900/40 px-2 py-0.5 text-[10px] font-semibold text-lime-700 dark:text-lime-300">
              100%
            </span>
          </div>
          {goal.description && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">{goal.description}</p>
          )}
          <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
            {goal.targetValue.toLocaleString("en-US")} {goal.unit.toLowerCase()} • {completedDateStr}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 border-t border-lime-200/40 dark:border-lime-900/30 pt-2.5">
        {confirmDelete ? (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Delete goal?</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="rounded-md bg-red-500 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={pending}
              className="rounded-md bg-slate-200 dark:bg-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={pending}
              className="flex items-center gap-1 rounded-lg p-1.5 text-xs text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
              title="Delete completed goal"
            >
              <Trash2 size={14} />
            </button>
            <button
              type="button"
              onClick={handleReopen}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <RotateCcw size={12} />
              Reopen
            </button>
          </>
        )}
        {error && <p className="text-[10px] text-red-500">{error}</p>}
      </div>
    </div>
  );
}
