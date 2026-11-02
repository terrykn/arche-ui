"use client";

import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "arche-theme";

/** Prototype theme switch: data-theme + dark class (Tailwind surfaces follow). */
export function applyTheme(dark: boolean) {
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    // ignore
  }
}

export function ProtoThemeToggle({ compact = false }: { compact?: boolean }) {
  const [dark, setDark] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  const toggle = () => {
    const next = !(document.documentElement.dataset.theme === "dark");
    applyTheme(next);
    setDark(next);
  };

  if (compact) {
    return (
      <Button
        variant="outline"
        size="icon"
        type="button"
        onClick={toggle}
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        title={dark ? "Light mode" : "Dark mode"}
      >
        <span aria-hidden>{dark ? <Sun /> : <Moon />}</span>
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" type="button" onClick={toggle}>
      <span aria-hidden>{dark ? <Sun /> : <Moon />}</span>
      <span>{dark ? "Light mode" : "Dark mode"}</span>
    </Button>
  );
}
