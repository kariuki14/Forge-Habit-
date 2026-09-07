"use client";

import { useTransition, useState } from "react";
import { updateSettingsAction } from "@/actions/settings";

export default function ToggleSwitch({
  field,
  checked,
  label,
}: {
  field: "notificationsEnabled" | "pushNotifications";
  checked: boolean;
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      const res = await updateSettingsAction({ [field]: !checked });
      if (res.error) setError(res.error);
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={error ? `${label}: ${error}` : label}
      onClick={toggle}
      disabled={pending}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        checked ? "bg-lime-400" : "bg-slate-200 dark:bg-slate-600"
      } ${pending ? "opacity-70" : ""} ${error ? "ring-2 ring-red-400" : ""}`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export function AppearanceModeSwitch({ mode }: { mode: "LIGHT" | "DARK" | "SYSTEM" }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dark = mode === "DARK";

  function toggleTheme() {
    const newMode = dark ? "LIGHT" : "DARK";
    const newTheme = newMode === "DARK" ? "dark" : "light";

    setError(null);

    // Apply theme immediately for instant feedback
    localStorage.setItem("forge-theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");

    // Then update database in background; roll back local state on failure.
    startTransition(async () => {
      const res = await updateSettingsAction({ appearanceMode: newMode });
      if (res.error) {
        setError(res.error);
        const revert = dark ? "dark" : "light";
        localStorage.setItem("forge-theme", revert);
        document.documentElement.classList.toggle("dark", revert === "dark");
      }
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={error ? `Dark mode: ${error}` : "Dark mode"}
      disabled={pending}
      onClick={toggleTheme}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        dark ? "bg-forest" : "bg-slate-200 dark:bg-slate-700"
      } ${pending ? "opacity-70" : ""} ${error ? "ring-2 ring-red-400" : ""}`}
    >
      <span
        className={`absolute top-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px] shadow-sm transition-all ${
          dark ? "left-[22px] bg-white" : "left-0.5 bg-white"
        }`}
      >
        {dark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
