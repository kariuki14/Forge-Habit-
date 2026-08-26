import type { LucideIcon } from "lucide-react";

export default function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest/10 text-forest dark:text-lime-400">
          <Icon size={16} strokeWidth={2.2} />
        </span>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{value}</p>
      {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  );
}
