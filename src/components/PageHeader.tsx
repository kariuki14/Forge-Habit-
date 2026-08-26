import Link from "next/link";
import { Settings } from "lucide-react";

export function Avatar({
  name,
  avatarUrl,
  size = 40,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-forest font-semibold text-lime-300"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials || "F"}
    </span>
  );
}

export default function PageHeader({
  title,
  user,
}: {
  title: string;
  user: { fullName: string; avatarUrl?: string | null };
}) {
  return (
    <header className="mb-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar name={user.fullName} avatarUrl={user.avatarUrl} />
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Forge
          </p>
          <h1 className="-mt-0.5 text-lg font-bold leading-tight text-slate-800 dark:text-slate-100">{title}</h1>
        </div>
      </div>
      <Link
        href="/settings"
        aria-label="Settings"
        className="rounded-full bg-white dark:bg-slate-800 p-2.5 text-slate-500 dark:text-slate-400 shadow-sm transition-colors hover:text-slate-700 dark:hover:text-slate-200"
      >
        <Settings size={18} strokeWidth={2.2} />
      </Link>
    </header>
  );
}
