const STATUS_STYLES: Record<string, { dot: string; num: string }> = {
  done: { dot: "bg-lime-400", num: "text-white" },
  partial: { dot: "bg-emerald-200 dark:bg-emerald-700", num: "text-emerald-900 dark:text-emerald-100" },
  missed: { dot: "bg-slate-100 dark:bg-slate-700", num: "text-slate-400 dark:text-slate-500" },
  today: { dot: "border-2 border-dashed border-lime-500 bg-white dark:bg-slate-800", num: "text-lime-600 dark:text-lime-400" },
};

export default function WeekMatrix({
  days,
}: {
  days: Array<{ label: string; dayNum: number; status: "done" | "partial" | "missed" | "today" }>;
}) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((d, i) => {
        const s = STATUS_STYLES[d.status] ?? STATUS_STYLES.missed;
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {d.label}
            </span>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold ${s.dot} ${s.num}`}
            >
              {d.dayNum}
            </span>
          </div>
        );
      })}
    </div>
  );
}
