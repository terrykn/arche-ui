import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { identityFontStylesheetUrls } from "./font-data.js";

export type FontRole = "sans" | "display" | "mono";
export type FontSlot = "body" | "display" | "mono";
export type FontSource = "fontshare" | "google";
export type FontClassification =
  | "grotesque"
  | "humanist"
  | "geometric"
  | "serif"
  | "display-serif"
  | "calligraphic"
  | "handwritten"
  | "monospace";
export type FontExpression = "neutral" | "expressive" | "serif";

export interface FontshareLoading {
  kind: "fontshare";
  slug: string;
  css: string;
}

export interface GoogleLoading {
  kind: "google";
  import: string;
  subsets: string[];
}

export type FontLoading = FontshareLoading | GoogleLoading;

export interface FontEntry {
  id: string;
  family: string;
  source: FontSource;
  classification: FontClassification;
  expression: FontExpression;
  /** Slots this family may occupy in an identity payload. */
  slots: FontSlot[];
  /** Legacy token-slot roles retained for compiler compatibility. */
  roles: FontRole[];
  /** Verified static styles offered by the provider. */
  weights: number[];
  /** Whether the provider offers a true italic style. */
  italics: boolean;
  variable: boolean;
  /** Continuous variable-font weight range, when applicable. */
  weightRange?: [number, number];
  displayOnly: boolean;
  loading: FontLoading;
  fallback: string;
}

export interface FontRegistry {
  registryVersion: number;
  fonts: FontEntry[];
  pairing: {
    recommended: Array<[string, string]>;
  };
}

export interface FontSelection {
  sans: string;
  display: string;
  mono: string;
}

export type SlotFontSelection = FontSelection;

/** Identity payload shape for the closed-registry font selection. */
export type ArcheIdentityFonts = FontSelection;

export interface RegistryIssue {
  path: string;
  message: string;
}

export interface RequestedSlotUsage {
  weights?: number[];
  italic?: boolean;
}

export type RequestedFontUsage = Partial<Record<keyof FontSelection, RequestedSlotUsage>>;

const REGISTRY_FILE = join(dirname(fileURLToPath(import.meta.url)), "font-registry.json");

let cached: FontRegistry | null = null;

/** Loads the closed font registry (parsed + typed). */
export function loadFontRegistry(): FontRegistry {
  if (!cached) {
    cached = JSON.parse(readFileSync(REGISTRY_FILE, "utf8")) as FontRegistry;
  }
  return cached;
}

/** Fonts by id. */
export function fontEntriesById(): Map<string, FontEntry> {
  return new Map(loadFontRegistry().fonts.map((font) => [font.id, font]));
}

/** Fonts by family name. */
export function fontEntriesByFamily(): Map<string, FontEntry> {
  return new Map(loadFontRegistry().fonts.map((font) => [font.family, font]));
}

function fontshareCssUrl(slug: string, weights: number[], italics: boolean, variable: boolean): string {
  if (variable) {
    return `https://api.fontshare.com/v2/css?f[]=${slug}@${italics ? "1,2" : "1"}&display=swap`;
  }
  return `https://api.fontshare.com/v2/css?f[]=${slug}@${weights.join(",")}&display=swap`;
}

/** Official webfont stylesheet for a Fontshare registry entry. */
export function fontCssUrl(font: FontEntry): string | null {
  if (font.loading.kind !== "fontshare") return null;
  return fontshareCssUrl(font.loading.slug, font.weights, font.italics, font.variable);
}

/**
 * Official Fontshare stylesheets required by an identity's font selection.
 * Google selections are intentionally omitted: they load through
 * next/font/google, which requires static imports rather than stylesheets.
 */
export function identityFontStylesheets(selection: FontSelection): string[] {
  return identityFontStylesheetUrls(selection);
}

/** Canonical fallback stack for a token slot behind the selected family. */
export function fallbackStack(role: FontRole): string {
  return role === "mono"
    ? "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    : "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif";
}

/** Expected --font-* token value for a selected registry font. */
export function expectedFontStack(font: FontEntry, role: FontRole): string {
  const classification = font.classification;
  if (classification === "serif" || classification === "display-serif") {
    return `${font.family}, ui-serif, Georgia, Times New Roman, serif`;
  }
  if (classification === "calligraphic" || classification === "handwritten") {
    return `${font.family}, Segoe Script, Comic Sans MS, cursive`;
  }
  if (role === "mono" || classification === "monospace") {
    return `${font.family}, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  }
  return `${font.family}, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif`;
}

const SANS_REQUIRED_WEIGHTS = [400, 500, 600, 700];

/** Whether a registry entry can render a numeric CSS weight. */
export function fontSupportsWeight(font: FontEntry, weight: number): boolean {
  if (font.weights.includes(weight)) return true;
  if (!font.variable || !font.weightRange) return false;
  const [min, max] = font.weightRange;
  return weight >= min && weight <= max;
}

/**
 * Validates explicitly requested weights/italics against a registry entry.
 * Payloads store font ids only, so callers pass the interface weights they
 * intend to render; the registry never assumes an unavailable style.
 */
export function validateRequestedFontUsage(
  font: FontEntry,
  slot: keyof FontSelection,
  usage: RequestedSlotUsage | undefined,
): RegistryIssue[] {
  const issues: RegistryIssue[] = [];
  if (!usage) return issues;
  for (const weight of usage.weights ?? []) {
    if (!fontSupportsWeight(font, weight)) {
      issues.push({
        path: `fonts.${slot}`,
        message: `font '${font.id}' (${font.family}) does not offer weight ${weight}`,
      });
    }
  }
  if (usage.italic && !font.italics) {
    issues.push({
      path: `fonts.${slot}`,
      message: `font '${font.id}' (${font.family}) does not offer an italic style`,
    });
  }
  return issues;
}

function recommendedPairKeys(): Set<string> {
  return new Set(loadFontRegistry().pairing.recommended.map(([display, body]) => `${display}+${body}`));
}

/** Registered compatible display+body pairs ([display id, body id]). */
export function recommendedFontPairs(): Array<[string, string]> {
  return loadFontRegistry().pairing.recommended.map(([display, body]) => [display, body] as [string, string]);
}

/**
 * Display/body compatibility rule for generated identities. Recommended pairs
 * always pass. Distinct neutral grotesques, distinct expressive display faces,
 * and distinct serif text faces are explicitly incompatible.
 */
export function validateFontPairing(display: FontEntry, body: FontEntry): RegistryIssue[] {
  if (display.id === body.id) return [];
  if (recommendedPairKeys().has(`${display.id}+${body.id}`)) return [];
  if (display.expression === "neutral" && body.expression === "neutral") {
    return [
      {
        path: "fonts.display",
        message: `fonts '${display.id}' and '${body.id}' are distinct neutral grotesques and are not a registered compatible pair`,
      },
    ];
  }
  if (display.expression === "expressive" && body.expression === "expressive") {
    return [
      {
        path: "fonts.display",
        message: `fonts '${display.id}' and '${body.id}' are unrelated expressive display faces and must not be paired`,
      },
    ];
  }
  if (display.expression === "serif" && body.expression === "serif") {
    return [
      {
        path: "fonts.display",
        message: `fonts '${display.id}' and '${body.id}' are distinct serif faces and are not a registered compatible pair`,
      },
    ];
  }
  return [];
}

/**
 * Validates an identity's fonts selection against the closed registry:
 * unknown ids fail, role violations fail, display-only fonts fail in body,
 * unavailable interface weights fail, raw stacks fail, and explicitly
 * incompatible display/body pairings fail. Token stacks must mirror the
 * selected registry family exactly.
 */
export function validateFontSelection(
  selection: FontSelection | undefined,
  tokenStacks: { sans?: string; display?: string; mono?: string },
  requestedUsage?: RequestedFontUsage,
): RegistryIssue[] {
  const issues: RegistryIssue[] = [];
  if (selection === undefined) {
    issues.push({
      path: "fonts",
      message: "identity declares no fonts selection; exactly one font per slot (sans/display/mono) is required",
    });
    return issues;
  }
  const byId = fontEntriesById();
  const byFamily = fontEntriesByFamily();
  const slots: Array<{ slot: keyof FontSelection; role: FontRole; token: string }> = [
    { slot: "sans", role: "sans", token: "--font-sans" },
    { slot: "display", role: "display", token: "--font-display" },
    { slot: "mono", role: "mono", token: "--font-mono" },
  ];
  for (const { slot, role, token } of slots) {
    const id = selection[slot];
    const entry = typeof id === "string" ? byId.get(id) : undefined;
    if (!entry) {
      issues.push({
        path: `fonts.${slot}`,
        message: `font '${String(id)}' is not in the closed font registry`,
      });
      continue;
    }
    if (!entry.roles.includes(role)) {
      issues.push({
        path: `fonts.${slot}`,
        message: `font '${entry.id}' (${entry.family}) may not fill the ${slot} slot (roles: ${entry.roles.join(", ")})`,
      });
    }
    if (slot === "sans" && entry.displayOnly) {
      issues.push({
        path: "fonts.sans",
        message: `font '${entry.id}' (${entry.family}) is display-only and must not be selected for body text`,
      });
    }
    const stack = tokenStacks[slot];
    if (typeof stack === "string") {
      const family = stack.split(",")[0]!.trim().replace(/^['"]|['"]$/g, "");
      const stackEntry = byFamily.get(family);
      if (!stackEntry) {
        issues.push({
          path: `tokens.${token}`,
          message: `${token} stack '${stack}' is a raw font stack and does not resolve to a registry family`,
        });
      } else if (stack !== expectedFontStack(entry, role)) {
        issues.push({
          path: `tokens.${token}`,
          message: `${token} stack must mirror the selected font ('${entry.id}'): expected '${expectedFontStack(entry, role)}', got '${stack}'`,
        });
      }
    }
    if (role === "sans") {
      const missing = SANS_REQUIRED_WEIGHTS.filter((w) => !fontSupportsWeight(entry, w));
      if (missing.length > 0) {
        issues.push({
          path: `fonts.${slot}`,
          message: `font '${entry.id}' (${entry.family}) cannot be the sans selection: missing required weights [${missing.join(", ")}]`,
        });
      }
    }
    issues.push(...validateRequestedFontUsage(entry, slot, requestedUsage?.[slot]));
  }

  const displayEntry = typeof selection.display === "string" ? byId.get(selection.display) : undefined;
  const bodyEntry = typeof selection.sans === "string" ? byId.get(selection.sans) : undefined;
  if (displayEntry && bodyEntry) {
    issues.push(...validateFontPairing(displayEntry, bodyEntry));
    const nonMono = new Set([displayEntry.family, bodyEntry.family]);
    if (nonMono.size > 2) {
      issues.push({
        path: "fonts",
        message: "an identity must use no more than two non-mono families",
      });
    }
  }
  return issues;
}
