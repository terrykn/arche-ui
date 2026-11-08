"use client";

import * as React from "react";

/**
 * First-visit theme fallback. Return visits SSR the stored arche-theme
 * cookie directly on <html>; this covers only visitors with no stored
 * choice, applying the OS preference before paint and persisting it so the
 * next load is correct server-side.
 */
export function ThemeBootstrap() {
  React.useLayoutEffect(() => {
    try {
      if (localStorage.getItem("arche-theme") || /(?:^|;\s*)arche-theme=/.test(document.cookie)) {
        return;
      }
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      const value = dark ? "dark" : "light";
      localStorage.setItem("arche-theme", value);
      document.cookie = `arche-theme=${value}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // storage unavailable — page keeps the SSR default for this visit
    }
  }, []);
  return null;
}
