import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type FontRole = "sans" | "display" | "mono";

export interface FontEntry {
  id: string;
  family: string;
  nextFontImport: string;
  fontsourcePackage: string;
  roles: FontRole[];
  weights: number[];
  variable: boolean;
  defaultFor?: "sans" | "mono";
}

export interface FontRegistry {
  registryVersion: number;
  fonts: FontEntry[];
}

export interface FontSelection {
  sans: string;
  display: string;
  mono: string;
}

/** Identity payload shape for the closed-registry font selection. */
export type ArcheIdentityFonts = FontSelection;

export interface RegistryIssue {
  path: string;
  message: string;
}

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

/** Canonical fallback stack for a token slot behind the selected family. */
export function fallbackStack(role: FontRole): string {
  return role === "mono"
    ? "ui-monospace, SFMono-Regular, Menlo, monospace"
    : "ui-sans-serif, system-ui, sans-serif";
}

/** Expected --font-* token value for a selected registry font. */
export function expectedFontStack(font: FontEntry, role: FontRole): string {
  return `${font.family}, ${fallbackStack(role)}`;
}

const SANS_REQUIRED_WEIGHTS = [400, 500, 600, 700];

/**
 * Validates an identity's fonts selection against the closed registry:
 * unknown ids fail, role violations fail, and a sans selection must offer
 * weights 400/500/600/700. Also checks every --font-* token stack matches
 * its selected registry family exactly (identities store ids; stacks mirror them).
 */
export function validateFontSelection(
  selection: FontSelection | undefined,
  tokenStacks: { sans?: string; display?: string; mono?: string },
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
    if (role === "sans") {
      const missing = SANS_REQUIRED_WEIGHTS.filter((w) => !entry.weights.includes(w));
      if (missing.length > 0) {
        issues.push({
          path: `fonts.${slot}`,
          message: `font '${entry.id}' (${entry.family}) cannot be the sans selection: missing required weights [${missing.join(", ")}]`,
        });
      }
    }
    const stack = tokenStacks[slot];
    if (typeof stack === "string" && stack !== expectedFontStack(entry, role)) {
      issues.push({
        path: `tokens.${token}`,
        message: `${token} stack must mirror the selected font ('${entry.id}'): expected '${expectedFontStack(entry, role)}', got '${stack}'`,
      });
    }
  }
  return issues;
}
