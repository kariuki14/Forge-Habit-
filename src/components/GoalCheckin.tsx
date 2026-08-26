"use client";

import { useTransition, useState } from "react";
import { Plus, Minus, Check, RotateCcw } from "lucide-react";
import { goalCheckinAction, goalUndoCheckinAction } from "@/actions/goals";

export default function GoalCheckin({
  goalId,
  currentValue,
  targetValue,
  unit,
}: {
  goalId: string;
  currentValue: number;
  targetValue: number;
  unit: string;
}) {
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [celebrated, setCelebrated] = useState(false);

  const remaining = Math.max(0, targetValue - currentValue);
  const isComplete = currentValue >= targetValue;

  function handleCheckin() {
    setError(null);
    startTransition(async () => {
      const res = await goalCheckinAction(goalId, amount);
      if (res.error) {
        setError(res.error);
      } else if (res.completed) {
        setCelebrated(true);
      }
    });
  }

  function handleUndo() {
    setError(null);
    startTransition(async () => {
      const res = await goalUndoCheckinAction(goalId, amount);
      if (res.error) setError(res.error);
      setCelebrated(false);
    });
  }

  if (isComplete) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-lime-100 dark:bg-lime-900/30 px-3 py-2.5">
        <Check size={16} className="text-lime-600 dark:text-lime-400" />
        <span className="flex-1 text-sm font-semibold text-lime-700 dark:text-lime-400">
          {celebrated ? "🎉 Goal reached!" : "Goal completed!"}
        </span>
        <button
          type="button"
          onClick={handleUndo}
          disabled={pending}
          className="rounded-lg bg-white dark:bg-slate-800 p-1.5 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
          title="Undo"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        {/* Decrease button */}
        <button
          type="button"
          onClick={() => setAmount(Math.max(0.5, amount - 1))}
          disabled={pending}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <Minus size={14} />
        </button>

        {/* Amount input */}
        <input
          type="number"
          min="0.5"
          step="any"
          value={amount}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v > 0) setAmount(v);
          }}
          className="w-16 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-2 py-1.5 text-center text-sm font-semibold outline-none focus:border-lime-500"
        />

        {/* Increase button */}
        <button
          type="button"
          onClick={() => setAmount(amount + 1)}
          disabled={pending}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <Plus size={14} />
        </button>

        {/* Unit label */}
        <span className="text-xs text-slate-400 dark:text-slate-500">{unit}</span>

        {/* Log button */}
        <button
          type="button"
          onClick={handleCheckin}
          disabled={pending}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-forest px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-forest-deep disabled:opacity-60"
        >
          <Plus size={12} />
          {pending ? "..." : "Log"}
        </button>
      </div>

      {remaining > 0 && (
        <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          {remaining} {unit} remaining
        </p>
      )}
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
