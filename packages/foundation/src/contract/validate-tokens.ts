import { rgb } from "culori";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod";

export const CONTRACT_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "token-contract.json",
);

export const contract = JSON.parse(
  readFileSync(CONTRACT_FILE, "utf8"),
) as TokenContract;

export interface TokenDefinition {
  name: string;
  $type: string;
  group: string;
  contrastPair?: { fg: string; bg: string };
  subValues?: Array<{ $type: string; key: string }>;
  /**
   * Closed legal value set (e.g. --border-width). When present, values
   * outside the set fail like any contract violation. Optional so older
   * definitions without a set keep validating by type only.
   */
  values?: string[];
}

export interface TokenContract {
  contractVersion: number;
  colorSpace: string;
  modes: string[];
  tokens: TokenDefinition[];
  contrastPairs: Array<{ fg: string; bg: string; minRatio: number }>;
}

export interface TokenValue {
  $type: string;
  $value: unknown;
  $description?: string;
}

/** light and dark mode token sets: token name (CSS-variable form) -> token value */
export type ModeTokenSet = Record<string, TokenValue>;
export type IdentityTokens = Record<string /* mode */, ModeTokenSet>;

export interface ValidationIssue {
  /** stable, deterministic path of the failing item, e.g. `light.--primary` */
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

// ---------------------------------------------------------------------------
// Zod schemas for the incoming identity token payload
// ---------------------------------------------------------------------------

const tokenValueSchema = z.object({
  $type: z.string().min(1),
  $value: z.unknown(),
  $description: z.string().optional(),
});

const modeSetSchema = z.record(z.string(), tokenValueSchema);

const tokensSchema = z.record(z.string(), modeSetSchema);

// ---------------------------------------------------------------------------
// DTCG type conformance
// ---------------------------------------------------------------------------

const OKLCH_RE = /^oklch\(\s*[\d.]+%?\s+[\d.]+\s+[\d.]+(?:deg)?\s*(?:\/\s*[\d.%]+)?\s*\)$/i;
const DURATION_RE = /^\d+(?:\.\d+)?(?:ms|s)$/;
const EASING_RE = /^(?:linear|ease(?:-in)?(?:-out)?|cubic-bezier\(\s*[\d.,-\s]+\s*\))$/;
const DIMENSION_RE = /^\d+(?:\.\d+)?(?:px|rem|em|%)$/;
const FONT_FAMILY_RE = /^[^'"\\]+(?:,\s*[^'"\\]+)*$/;
const SHADOW_DISALLOWED_RE = /#|\b(?:rgb|rgba|hsl|hsla|lab|lch|oklab|color-mix)\s*\(/i;
const SHADOW_ALLOWED_RE = /^[a-z\s\d.,()\/%+-]*oklch\([\s\d.\/%,-]*\)[\s\d.()\/%,-]*$/i;
const SHADOW_OKLCH_TOKEN_RE = /oklch\(/;

function checkType(
  defName: string,
  expected: string,
  token: TokenValue,
): ValidationIssue | null {
  const path = defName;
  if (token.$type !== expected) {
    return { path, message: `token $type is '${token.$type}', contract requires '${expected}'` };
  }
  switch (expected) {
    case "color": {
      const value = token.$value;
      if (typeof value !== "string" || !OKLCH_RE.test(value)) {
        return {
          path,
          message: `color values must be OKLCH strings of the form 'oklch(l c h / a)', got '${String(value)}'`,
        };
      }
      return null;
    }
    case "dimension": {
      if (typeof token.$value !== "string" || !DIMENSION_RE.test(token.$value)) {
        return { path, message: `dimension must be a length string, got '${String(token.$value)}'` };
      }
      const legal = (contract.tokens.find((tokenDef) => tokenDef.name === defName)?.values ?? []);
      if (legal.length > 0 && !legal.includes(token.$value)) {
        return { path, message: `dimension must be one of [${legal.join(", ")}], got '${String(token.$value)}'` };
      }
      return null;
    }
    case "fontFamily": {
      if (typeof token.$value !== "string" || !FONT_FAMILY_RE.test(token.$value)) {
        return { path, message: `fontFamily must be a comma-separated family list, got '${String(token.$value)}'` };
      }
      return null;
    }
    case "shadow": {
      const value = token.$value;
      if (typeof value !== "string" || (value.trim() !== "none" && (!SHADOW_OKLCH_TOKEN_RE.test(value) || SHADOW_DISALLOWED_RE.test(value) || !SHADOW_ALLOWED_RE.test(value.trim())))) {
        return { path, message: `shadow must be an OKLCH-based box-shadow string or 'none', got '${String(value)}'` };
      }
      return null;
    }
    case "motion": {
      const value = token.$value;
      if (typeof value !== "object" || value === null) {
        return { path, message: "motion value must be an object with 'duration' and 'easing'" };
      }
      const record = value as Record<string, unknown>;
      const required = contract.tokens.find((tokenDef) => tokenDef.name === defName)?.subValues ?? [];
      for (const sub of required) {
        const present = sub.key in record;
        if (!present) {
          return { path, message: `motion value is missing '${sub.key}'` };
        }
        if (sub.$type === "duration") {
          if (typeof record[sub.key] !== "string" || !DURATION_RE.test(String(record[sub.key]))) {
            return { path, message: `motion 'duration' must be a duration string (e.g. '150ms'), got '${String(record[sub.key])}'` };
          }
        } else if (sub.$type === "cubicBezier") {
          if (typeof record[sub.key] !== "string" || !EASING_RE.test(String(record[sub.key]))) {
            return { path, message: `motion 'easing' must be an easing keyword or cubic-bezier(...) string, got '${String(record[sub.key])}'` };
          }
        }
      }
      return null;
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// WCAG 2.1 contrast

export function relativeLuminance(color: { r: number; g: number; b: number }): number;
export function relativeLuminance(color: unknown): number | null;
export function relativeLuminance(color: unknown): number | null {
  const c = color as { r?: number; g?: number; b?: number } | null;
  if (!c || typeof c.r !== "number" || typeof c.g !== "number" || typeof c.b !== "number") {
    return null;
  }
  const toLinear = (channel: number): number => {
    const v = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return Math.round(v * 100000) / 100000;
  };
  return 0.2126 * toLinear(c.r) + 0.7152 * toLinear(c.g) + 0.0722 * toLinear(c.b);
}

export function contrastRatio(fg: string, bg: string): number {
  const fgColor = rgb(fg);
  const bgColor = rgb(bg);
  if (!fgColor || !bgColor) {
    return NaN;
  }
  const fgLum = relativeLuminance(fgColor);
  const bgLum = relativeLuminance(bgColor);
  if (fgLum == null || bgLum == null) {
    return NaN;
  }
  const lighter = Math.max(fgLum, bgLum) + 0.05;
  const darker = Math.min(fgLum, bgLum) + 0.05;
  return Math.round((lighter / darker) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Main validator
// ---------------------------------------------------------------------------

export function validateTokens(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  const parsedTokens = tokensSchema.safeParse(input);
  if (!parsedTokens.success) {
    issues.push({
      path: "tokens",
      message: `tokens must be a record of mode -> token name -> { $type, $value }: ${parsedTokens.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`,
    });
    return { ok: false, issues };
  }

  const tokens = tokensSchema.parse(input) as IdentityTokens;

  for (const mode of contract.modes) {
    if (!(mode in tokens)) {
      issues.push({ path: mode, message: `missing required mode set '${mode}'` });
      continue;
    }
    const modeSet = tokens[mode]!;
    for (const tokenDef of contract.tokens) {
      const token = modeSet[tokenDef.name];
      if (!token) {
        issues.push({ path: `${mode}.${tokenDef.name}`, message: "missing required token" });
        continue;
      }
      const issue = checkType(tokenDef.name, tokenDef.$type, token);
      if (issue) {
        issues.push({ ...issue, path: `${mode}.${issue.path}` });
      }
    }
    // reject unknown tokens (closed contract)
    for (const name of Object.keys(modeSet)) {
      if (!contract.tokens.some((tokenDef) => tokenDef.name === name)) {
        issues.push({ path: `${mode}.${name}`, message: "token is not part of the contract" });
      }
    }
  }

  // contrast pairs (checked per mode, contract requires both)
  for (const mode of contract.modes) {
    const modeSet = tokens[mode];
    if (!modeSet) {
      continue;
    }
    for (const pair of contract.contrastPairs) {
      const fg = modeSet[pair.fg];
      const bg = modeSet[pair.bg];
      if (!fg || !bg) {
        continue; // missing tokens already reported
      }
      const ratio = contrastRatio(String(fg.$value), String(bg.$value));
      if (Number.isNaN(ratio)) {
        issues.push({
          path: `${mode}.${pair.fg} on ${pair.bg}`,
          message: `contrast pair could not be computed`,
        });
        continue;
      }
      if (ratio < pair.minRatio) {
        issues.push({
          path: `${mode}.${pair.fg} on ${pair.bg}`,
          message: `contrast pair '${pair.fg}' on '${pair.bg}' fails WCAG AA: ratio ${ratio} < ${pair.minRatio}`,
        });
      }
    }
  }

  return { ok: issues.length === 0, issues };
}
