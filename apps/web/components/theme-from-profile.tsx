"use client";

import * as React from "react";

/** Applies the signed-in user's stored theme preference when the visitor
 * has not made an explicit local choice. */
export function ThemeFromProfile({ theme }: { theme: "light" | "dark" | "system" }) {
  React.useEffect(() => {
    try {
      if (localStorage.getItem("arche-theme")) {
        return;
      }
      if (theme !== "dark" && theme !== "light") {
        return;
      }
      const dark = theme === "dark";
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.dataset.theme = theme;
      // Persist so the server renders it on the next load (no script needed).
      localStorage.setItem("arche-theme", theme);
      document.cookie = `arche-theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // ignore
    }
  }, [theme]);
  return null;
}
