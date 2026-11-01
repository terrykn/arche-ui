"use client";

import * as React from "react";

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

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={compact ? "proto-icon-btn" : "proto-toggle"}
    >
      <span aria-hidden>{dark ? "☀" : "☾"}</span>
      {!compact && <span>{dark ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}
