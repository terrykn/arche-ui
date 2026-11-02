/* GENERATED — do not hand-edit. Source: fixtures/identity.arche.json
 * Produced by apps/web/scripts/sync-theme.mjs. Edit the payload, then run:
 * pnpm --filter web sync-theme */
import { Geist_Mono, Inter } from "next/font/google";

export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const fontDisplay = fontSans;

export const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});
