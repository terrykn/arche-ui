/* GENERATED — do not hand-edit. Source: fixtures/identity.arche.json
 * Produced by apps/web/scripts/sync-theme.mjs. Edit the payload, then run:
 * pnpm --filter web sync-theme */
import { JetBrains_Mono } from "next/font/google";

export const fontSans = { variable: "--font-sans" } as const;

export const fontDisplay = fontSans;

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});
