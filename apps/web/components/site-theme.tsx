"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type SiteTheme = "dark" | "light";

const STORAGE_KEY = "arche-theme";
const EVENT = "arche-theme-change";

function readTheme(): SiteTheme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function writeTheme(theme: SiteTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage may be unavailable — the class toggle above still applies.
  }
  window.dispatchEvent(new CustomEvent<SiteTheme>(EVENT, { detail: theme }));
}

/** Site-wide light/dark state. Defaults to dark; persists to localStorage. */
export function useSiteTheme(): [SiteTheme, (theme: SiteTheme) => void] {
  const [theme, setTheme] = React.useState<SiteTheme>("dark");

  React.useEffect(() => {
    setTheme(readTheme());
    const onEvent = (e: Event) => setTheme((e as CustomEvent<SiteTheme>).detail);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === "dark" || e.newValue === "light")) {
        setTheme(e.newValue);
      }
    };
    window.addEventListener(EVENT, onEvent);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, onEvent);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return [theme, writeTheme];
}

/**
 * Icon-only dark/light switch for navbars and sidebars. Built on the
 * shared Button (ghost, icon-sm) so it matches the surrounding buttons:
 * 32px on desktop like the search trigger and CTA, 44px touch targets
 * on phones like the other nav buttons.
 */
export function SiteThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useSiteTheme();
  const dark = theme === "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={dark}
      className={cn("shrink-0 max-md:size-11", className)}
    >
      {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}
