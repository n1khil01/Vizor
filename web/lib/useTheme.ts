"use client";

import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

export const THEME_EVENT = "vizor-theme-change";

function getSnapshot(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// SSR has no DOM to read; the inline no-flash script (see lib/theme.ts) has
// already set the real attribute by the time the client reads getSnapshot,
// so useSyncExternalStore's built-in hydration handling swaps this
// placeholder for the real value without a visible flash or a mismatch
// warning — that special-cased hydration behaviour is the reason theme state
// is read through useSyncExternalStore rather than useEffect.
function getServerSnapshot(): Theme {
  return "light";
}

function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    media.removeEventListener("change", callback);
  };
}

/** The live theme, shared by ThemeToggle and VizorMark so both react to the
    same source instead of each re-implementing the read. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setTheme(next: Theme) {
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Private browsing or storage disabled — the change still applies to
    // this page load, it just won't be remembered next visit.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}
