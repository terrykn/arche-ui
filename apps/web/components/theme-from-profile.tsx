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
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (theme === "light") {
        document.documentElement.classList.remove("dark");
      }
    } catch {
      // ignore
    }
  }, [theme]);
  return null;
}
