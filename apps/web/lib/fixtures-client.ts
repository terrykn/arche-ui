"use client";

/** Client-safe token-vars helper (no node:fs) for the demo rotator. */
export function tokenVars(
  payload: {
    tokens: Record<string, Record<string, { $type: string; $value: unknown }>>;
  },
  mode: "light" | "dark",
): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [name, token] of Object.entries(payload.tokens[mode] ?? {})) {
    if (typeof token.$value === "string") {
      vars[name] = token.$value;
    }
  }
  return vars;
}
