"use client";

import { useEffect } from "react";

export default function ThemeSync({ mode }: { mode: "LIGHT" | "DARK" | "SYSTEM" }) {
  useEffect(() => {
    // Sync database theme to localStorage on mount
    const theme = mode === "DARK" ? "dark" : mode === "LIGHT" ? "light" : null;
    
    if (theme) {
      localStorage.setItem("forge-theme", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
    } else {
      // SYSTEM mode - use system preference
      localStorage.removeItem("forge-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, [mode]);

  return null;
}
