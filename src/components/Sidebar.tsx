"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ListChecks, BarChart2, Target, Settings, Flame, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/PageHeader";

const TABS: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/habits", label: "Habits", icon: ListChecks },
  { href: "/insights", label: "Insights", icon: BarChart2 },
  { href: "/goals", label: "Goals", icon: Target },
];

export default function Sidebar({ user }: { user: { fullName: string; avatarUrl?: string | null; currentStreak: number; tier: string } }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest text-lime-300">
            <Flame size={22} />
          </span>
          <span className="text-xl font-bold text-slate-800 dark:text-slate-100">Forge Habit</span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul className="flex flex-1 flex-col gap-y-1">
            {TABS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`group flex gap-x-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-forest/10 text-forest dark:bg-lime-500/10 dark:text-lime-400"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-100"
                    }`}
                  >
                    <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* User Profile Section */}
          <div className="mt-auto space-y-3">
            <div className="rounded-2xl bg-gradient-to-br from-forest to-forest-deep p-4 text-white">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={user.fullName} avatarUrl={user.avatarUrl} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{user.fullName}</p>
                  <p className="text-xs text-lime-200 capitalize">{user.tier.toLowerCase()} Level</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-lime-300">
                🔥 {user.currentStreak} Day Streak
              </div>
            </div>

            <Link
              href="/settings"
              className={`group flex gap-x-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                pathname === "/settings"
                  ? "bg-forest/10 text-forest dark:bg-lime-500/10 dark:text-lime-400"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-100"
              }`}
            >
              <Settings size={20} strokeWidth={pathname === "/settings" ? 2.4 : 2} />
              Settings
            </Link>
          </div>
        </nav>
      </div>
    </aside>
  );
}
