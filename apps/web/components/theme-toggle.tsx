"use client";

import * as React from "react";

const STORAGE_KEY = "arche-theme";

function currentIsDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle() {
  const [dark, setDark] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    setDark(currentIsDark());
  }, []);

  const toggle = React.useCallback(() => {
    const next = !currentIsDark();
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // storage unavailable — theme still applies for this visit
    }
    setDark(next);
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark ?? false}
      className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-card-foreground"
    >
      {dark === null ? "Theme" : dark ? "Light mode" : "Dark mode"}
    </button>
  );
}
