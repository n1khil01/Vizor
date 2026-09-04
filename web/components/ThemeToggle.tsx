"use client";

import { SunIcon, MoonIcon } from "@/components/icons";
import { useTheme, setTheme } from "@/lib/useTheme";

/**
 * A two-state toggle, not a three-way light/dark/system picker: simpler to
 * reason about, and the inline script in the root layout already falls back
 * to the OS preference for anyone who has never touched it. Clicking always
 * commits an explicit choice to localStorage.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`p-1.5 rounded-md text-ink-faint transition-colors duration-150 ease-out hover:text-ink hover:bg-rule/45 active:scale-[0.96] ${className}`}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
