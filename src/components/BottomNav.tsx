"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ListChecks, BarChart2, Target, type LucideIcon } from "lucide-react";

const TABS: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/habits", label: "Habits", icon: ListChecks },
  { href: "/insights", label: "Insights", icon: BarChart2 },
  { href: "/goals", label: "Goals", icon: Target },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-800/95 backdrop-blur lg:hidden">
      <div className="grid grid-cols-4 px-2 py-2">{TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors ${
                active ? "text-forest dark:text-lime-400" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <span
                className={`flex items-center justify-center rounded-full px-4 py-1 ${
                  active ? "bg-forest/10 dark:bg-lime-500/10" : ""
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
