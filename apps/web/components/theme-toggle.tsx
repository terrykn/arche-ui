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
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
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
