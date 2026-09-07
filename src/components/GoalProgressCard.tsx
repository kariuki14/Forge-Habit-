import { ChevronRight, Flag, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import GoalCheckin from "@/components/GoalCheckin";
import GoalDeleteButton from "@/components/GoalDeleteButton";

const PACE_META: Record<string, { icon: LucideIcon; className: string; label: string }> = {
  ahead: { icon: TrendingUp, className: "text-lime-600", label: "Ahead of schedule" },
  "on-track": { icon: Minus, className: "text-emerald-600", label: "On track" },
  behind: { icon: TrendingDown, className: "text-orange-500", label: "Behind pace" },
};

export default function GoalProgressCard({
  goal,
}: {
  goal: {
    id: string;
    title: string;
    description: string | null;
    currentValue: number;
    targetValue: number;
    unit: string;
    pct: number;
    nextMilestone: { title: string; sequenceOrder: number } | null;
    pace: "ahead" | "on-track" | "behind";
  };
}) {
  const PaceIcon = PACE_META[goal.pace]?.icon ?? Minus;
  const paceLabel = PACE_META[goal.pace]?.label ?? "On track";
  const paceClass = PACE_META[goal.pace]?.className ?? "text-emerald-600";

  return (
    <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{goal.title}</p>
          {goal.description && (
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500 truncate">{goal.description}</p>
          )}
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            {formatNumber(goal.currentValue)} of {formatNumber(goal.targetValue)}{" "}
            {goal.unit.toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`flex items-center gap-1 rounded-full bg-slate-50 dark:bg-slate-700 px-2 py-1 text-[11px] font-semibold ${paceClass}`}>
            <PaceIcon size={12} strokeWidth={2.5} />
            {paceLabel}
          </span>
          <GoalDeleteButton goalId={goal.id} />
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/40">
        <div
          className="h-full rounded-full bg-gradient-to-r from-forest to-lime-400 transition-[width] duration-500"
          style={{ width: `${Math.max(3, Math.min(100, goal.pct))}%` }}
        />
      </div>
      <p className="mt-1 text-right text-[11px] font-semibold text-forest dark:text-lime-400">{goal.pct}%</p>

      {goal.nextMilestone && (
        <div className="mt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-2">
          <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Flag size={12} className="text-lime-500" />
            Next: {goal.nextMilestone.title}
          </span>
          <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />
        </div>
      )}

      <GoalCheckin
        goalId={goal.id}
        currentValue={goal.currentValue}
        targetValue={goal.targetValue}
        unit={goal.unit}
      />
    </div>
  );
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}
