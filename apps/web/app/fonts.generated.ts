/* GENERATED — do not hand-edit. Source: fixtures/identity.default.json
 * Produced by apps/web/scripts/sync-theme.mjs. Edit the payload, then run:
 * pnpm --filter web sync-theme */
import { Geist_Mono } from "next/font/google";

export const fontSans = { variable: "--font-sans" } as const;

export const fontDisplay = fontSans;

export const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});
