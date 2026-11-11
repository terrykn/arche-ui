import registryJson from "./font-registry.json" with { type: "json" };
import type { FontEntry, FontRegistry, FontSelection } from "./fonts.js";

/** Browser-safe closed font registry data (no Node APIs). */
export const FONT_REGISTRY_DATA: FontRegistry = registryJson as unknown as FontRegistry;

function fontshareCssUrl(slug: string, italics: boolean): string {
  return `https://api.fontshare.com/v2/css?f[]=${slug}@${italics ? "1,2" : "1"}&display=swap`;
}

/** Official webfont stylesheet URL for a browser-safe registry entry. */
export function fontDataCssUrl(font: FontEntry): string | null {
  if (font.loading.kind !== "fontshare") return null;
  if (font.variable) return fontshareCssUrl(font.loading.slug, font.italics);
  return `https://api.fontshare.com/v2/css?f[]=${font.loading.slug}@${font.weights.join(",")}&display=swap`;
}

/**
 * Official Fontshare stylesheets required by an identity's font selection.
 * Google selections are intentionally omitted: they load through
 * next/font/google, which requires static imports rather than stylesheets.
 */
export function identityFontStylesheetUrls(selection: FontSelection): string[] {
  const entries = new Map(FONT_REGISTRY_DATA.fonts.map((font) => [font.id, font]));
  const urls: string[] = [];
  for (const slot of ["sans", "display", "mono"] as const) {
    const url = fontDataCssUrl(entries.get(selection[slot])!);
    if (url && !urls.includes(url)) urls.push(url);
  }
  return urls;
}
