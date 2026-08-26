"use client";

import { useTransition, useState } from "react";
import { Check } from "lucide-react";
import { toggleCheckInAction } from "@/actions/habits";

export default function CheckinToggle({
  habitId,
  completed,
}: {
  habitId: string;
  completed: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        aria-label={completed ? "Mark as not done" : "Mark as done"}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await toggleCheckInAction(habitId);
            setError(res.error);
          })
        }
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all active:scale-90 ${
          completed
            ? "border-lime-500 bg-lime-500 text-white"
            : "border-slate-300 dark:border-slate-600 bg-transparent text-transparent hover:border-lime-500"
        } ${pending ? "opacity-60" : ""}`}
      >
        <Check size={18} strokeWidth={3} />
      </button>
      {error && <span className="text-[10px] text-red-500">{error}</span>}
    </div>
  );
}
