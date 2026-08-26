const SEGMENT_COLORS = ["#A3E635", "#1A3C34", "#5EEAD4", "#FBBF24", "#A78BFA", "#F87171"];

export default function DonutChart({
  breakdown,
}: {
  breakdown: Array<{ label: string; pct: number }>;
}) {
  if (breakdown.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-400">
        Create habits to see your category mix.
      </p>
    );
  }

  let cursor = 0;
  const stops = breakdown.map((b, i) => {
    const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    const start = cursor;
    cursor += b.pct;
    return `${color} ${start}% ${cursor}%`;
  });
  const gradient = `conic-gradient(${stops.join(", ")})`;

  return (
    <div className="flex items-center gap-6 py-2">
      <div
        className="relative h-32 w-32 shrink-0 rounded-full"
        style={{ background: gradient }}
      >
        <div className="absolute inset-[22%] flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-inner">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Mix</span>
        </div>
      </div>
      <ul className="flex min-w-0 flex-1 flex-col gap-2">
        {breakdown.map((b, i) => (
          <li key={b.label} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
            />
            <span className="flex-1 truncate capitalize text-slate-600 dark:text-slate-400">
              {b.label.toLowerCase()}
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{b.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
