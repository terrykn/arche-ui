"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    const value = next ? "dark" : "light";
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.dataset.theme = value;
    try {
      localStorage.setItem(STORAGE_KEY, value);
      // Mirror to the cookie so the server renders the theme on next load.
      document.cookie = `arche-theme=${value}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // storage unavailable — theme still applies for this visit
    }
    setDark(next);
  }, []);

  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark ?? false}
    >
      {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      {dark === null ? "Theme" : dark ? "Light mode" : "Dark mode"}
    </Button>
  );
}
