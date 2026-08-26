import { Bell, Smartphone, Moon, ChevronRight, HelpCircle, FileText } from "lucide-react";
import { Avatar } from "@/components/PageHeader";
import ToggleSwitch, { AppearanceModeSwitch } from "@/components/ToggleSwitch";
import { signOutAction } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export default async function SettingsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  const settings = await prisma.userSettings.findUniqueOrThrow({
    where: { userId: sessionUser.id },
  });

  const accountItems = [
    { icon: FileText, label: "Personal Information", hint: sessionUser.email },
    { icon: HelpCircle, label: "Help & Support", hint: "" },
  ];

  return (
    <div className="space-y-6 pb-6">
      <div className="lg:hidden">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Profile Settings</h1>
      </div>
      <h1 className="hidden text-3xl font-bold text-slate-800 dark:text-slate-100 lg:block">Profile Settings</h1>

      <section className="rounded-3xl bg-gradient-to-b from-forest to-forest-deep p-6 text-white shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar name={sessionUser.fullName} avatarUrl={sessionUser.avatarUrl} size={64} />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{sessionUser.fullName}</p>
            <p className="truncate text-sm text-emerald-100/90">
              {sessionUser.bio ?? "Forging discipline, one rep at a time."}
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2.5">
          <span className="flex items-center gap-1.5 rounded-full bg-lime-400/15 px-3 py-1 text-xs font-semibold text-lime-300">
            🔥 {sessionUser.currentStreak} Day Streak
          </span>
          <span className="rounded-full bg-lime-400/15 px-3 py-1 text-xs font-semibold capitalize text-lime-300">
            {sessionUser.tier.toLowerCase()} level
          </span>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Account
          </p>
          <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 shadow-sm">
            {accountItems.map(({ icon: Icon, label, hint }, i) => (
              <button
                key={label}
                type="button"
                className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                  i > 0 ? "border-t border-slate-100 dark:border-slate-700" : ""
                }`}
              >
                <Icon size={18} className="text-slate-500 dark:text-slate-400" />
                <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
                {hint && <span className="max-w-[45%] truncate text-xs text-slate-400 dark:text-slate-500">{hint}</span>}
                <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Notifications
          </p>
          <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 shadow-sm">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Bell size={18} className="text-slate-500 dark:text-slate-400" />
              <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">Daily Reminders</span>
              <ToggleSwitch
                field="notificationsEnabled"
                checked={settings.notificationsEnabled}
                label="Daily Reminders"
              />
            </div>
          <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-700 px-4 py-3.5">
            <Smartphone size={18} className="text-slate-500 dark:text-slate-400" />
            <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">Push Notifications</span>
              <ToggleSwitch
                field="pushNotifications"
                checked={settings.pushNotifications}
                label="Push Notifications"
              />
            </div>
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Appearance
          </p>
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 shadow-sm">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Moon size={18} className="text-slate-500 dark:text-slate-400" />
              <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">Dark Mode</span>
              <AppearanceModeSwitch mode={settings.appearanceMode} />
            </div>
          </div>
        </section>
      </div>

      <form action={signOutAction}>
        <button
          type="submit"
          className="w-full rounded-2xl border border-red-200 dark:border-red-900 bg-white dark:bg-slate-800 py-3.5 text-sm font-semibold text-red-500 dark:text-red-400 shadow-sm transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 lg:max-w-xs"
        >
          Log Out
        </button>
      </form>
    </div>
  );
}
