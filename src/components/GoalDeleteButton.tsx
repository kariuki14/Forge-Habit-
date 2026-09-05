"use client";

import { useTransition, useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteGoalAction } from "@/actions/goals";

export default function GoalDeleteButton({ goalId }: { goalId: string }) {
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      await deleteGoalAction(goalId);
    });
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-[11px] text-slate-500 dark:text-slate-400">Delete?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="rounded-md bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-red-600 disabled:opacity-50"
        >
          {pending ? "..." : "Yes"}
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          disabled={pending}
          className="rounded-md bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-300"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirm(true)}
      className="text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors p-1"
      title="Delete goal"
    >
      <Trash2 size={13} />
    </button>
  );
}
