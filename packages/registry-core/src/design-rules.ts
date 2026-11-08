/**
 * @arche/registry-core design-rule enforcement (post-Brief #6 Deliverable 2).
 *
 * Every enforce-tier rule from @arche/foundation/design-rules gets a named
 * check here producing findings with the rule id, token name, actual value,
 * and limit — same reporting style as contrast failures. Pure deterministic
 * local code: zero model cost.
 *
 * Scope: findings are LINT for hand-authored payloads (validateIdentity
 * appends them without blocking) and BLOCKING for Shapeshift-generated
 * payloads (compileValidIdentity repairs-or-fails; the publish gate refuses
 * generated payloads with remaining findings).
 */
import {
  deriveTypeScale,
  DISPLAY_CAP_ABSOLUTE_PX,
  DISPLAY_CAP_BY_PROFILE,
  roleGroup,
  TYPE_ROLES,
  validateTypeScaleSelection,
  type GenerationProfile,
} from "@arche/foundation/typography";
import type { ArcheIdentity } from "./index.js";

export interface DesignRuleFinding {
  /** Permanent rule id from the design-rules registry. */
  rule: string;
  path: string;
  message: string;
}

interface Oklch {
  l: number;
  c: number;
  h: number;
}

function parseOklch(value: unknown): Oklch | null {
  if (typeof value !== "string") return null;
  const match = value.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.%]+)?\s*\)$/);
  if (!match) return null;
  return { l: Number(match[1]), c: Number(match[2]), h: Number(match[3]) };
}

/** Circular hue distance in degrees. */
function hueDistance(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return Math.min(d, 360 - d);
}

/** OKLCH → OKLab (L shared; a/b from polar). Euclidean distance ≈ ΔE. */
function oklab(value: Oklch): { l: number; a: number; b: number } {
  const rad = (value.h * Math.PI) / 180;
  return { l: value.l, a: value.c * Math.cos(rad), b: value.c * Math.sin(rad) };
}

function deltaE(a: Oklch, b: Oklch): number {
  const x = oklab(a);
  const y = oklab(b);
  return Math.sqrt((x.l - y.l) ** 2 + (x.a - y.a) ** 2 + (x.b - y.b) ** 2);
}

function tokenColor(
  tokens: Record<string, { $value?: unknown }>,
  name: string,
): Oklch | null {
  return parseOklch((tokens[name] as { $value?: unknown } | undefined)?.$value);
}

function profileOf(identity: ArcheIdentity): GenerationProfile {
  const profile = (identity.dna as { profile?: unknown } | undefined)?.profile;
  return profile === "enterprise" || profile === "standard" || profile === "expressive"
    ? profile
    : "standard";
}

const BG_TOKENS = ["--background", "--card", "--popover", "--muted", "--secondary"];
const TEXT_TOKENS = [
  "--foreground",
  "--card-foreground",
  "--popover-foreground",
  "--primary-foreground",
  "--secondary-foreground",
  "--accent-foreground",
  "--destructive-foreground",
  "--muted-foreground",
];
const BORDER_TOKENS = ["--border", "--input"];
const SOLID_TOKENS = ["--primary", "--accent", "--destructive"];
const NEUTRAL_TOKENS = [
  "--background",
  "--card",
  "--popover",
  "--muted",
  "--secondary",
  "--border",
  "--input",
];
const CHART_TOKENS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"];

/** Easings the compiler may emit (the existing closed motion set). */
export const CLOSED_EASINGS = new Set([
  "cubic-bezier(0.3, 0, 0, 1)",
  "cubic-bezier(0.4, 0, 0.2, 1)",
  "cubic-bezier(0.34, 1.56, 0.64, 1)",
  "cubic-bezier(0.34, 1.4, 0.64, 1)",
  "cubic-bezier(0.9, 0, 0.1, 1)",
  "ease-in-out",
]);

function durationMs(value: unknown): number | null {
  if (typeof value !== "object" || value === null) return null;
  const duration = (value as Record<string, unknown>).duration;
  if (typeof duration !== "string") return null;
  const match = duration.match(/^(\d+(?:\.\d+)?)(ms|s)$/);
  if (!match) return null;
  const n = Number(match[1]);
  return match[2] === "s" ? n * 1000 : n;
}

/**
 * Runs every enforce-tier check over both mode token sets. Findings carry
 * the permanent rule id. Never throws on malformed tokens (those belong to
 * the contract validator); skips what it cannot parse.
 */
export function checkDesignRules(identity: ArcheIdentity): DesignRuleFinding[] {
  const findings: DesignRuleFinding[] = [];
  const profile = profileOf(identity);
  const modes = ["light", "dark"] as const;
  const tokens = identity.tokens as Record<string, Record<string, { $value?: unknown }>>;

  for (const mode of modes) {
    const set = tokens[mode] ?? {};
    const at = (token: string): string => `${mode}.${token}`;

    // color-bg-chroma-cap (profile-scaled; darker dark-mode allowance)
    const bgCap = Math.round(
      (mode === "light" ? 0.025 : 0.035) *
        (profile === "enterprise" ? 0.6 : profile === "expressive" ? 1.5 : 1) *
        10000,
    ) / 10000;
    for (const name of BG_TOKENS) {
      const c = tokenColor(set, name);
      if (c && c.c > bgCap) {
        findings.push({
          rule: "color-bg-chroma-cap",
          path: at(name),
          message: `${name} chroma ${c.c} exceeds the ${profile} ${mode}-mode background cap ${bgCap}`,
        });
      }
    }

    // color-text-chroma-cap (0.18: calibrated — Radix text steps p95 0.173, see CALIBRATION.md A1)
    for (const name of TEXT_TOKENS) {
      const c = tokenColor(set, name);
      if (c && c.c > 0.18) {
        findings.push({
          rule: "color-text-chroma-cap",
          path: at(name),
          message: `${name} chroma ${c.c} exceeds the text cap 0.18`,
        });
      }
    }

    // color-border-chroma-cap (0.15: calibrated — Radix border steps p95 0.140, see CALIBRATION.md A2)
    for (const name of BORDER_TOKENS) {
      const c = tokenColor(set, name);
      if (c && c.c > 0.15) {
        findings.push({
          rule: "color-border-chroma-cap",
          path: at(name),
          message: `${name} chroma ${c.c} exceeds the border cap 0.15`,
        });
      }
    }

    // color-solid-chroma-band (floor + profile-scaled ceiling)
    const ceiling = profile === "enterprise" ? 0.19 : profile === "expressive" ? 0.26 : 0.24;
    for (const name of SOLID_TOKENS) {
      const c = tokenColor(set, name);
      if (c && (c.c < 0.08 || c.c > ceiling)) {
        findings.push({
          rule: "color-solid-chroma-band",
          path: at(name),
          message: `${name} chroma ${c.c} is outside the ${profile} solid band [0.08, ${ceiling}]`,
        });
      }
    }

    // color-chroma-taper (every token: extremes must be near-neutral)
    for (const [name, token] of Object.entries(set)) {
      if (!name.startsWith("--") || typeof token.$value !== "string" || !token.$value.startsWith("oklch(")) {
        continue;
      }
      const c = parseOklch(token.$value);
      if (c && (c.l >= 0.95 || c.l <= 0.08) && c.c > 0.03) {
        findings.push({
          rule: "color-chroma-taper",
          path: at(name),
          message: `${name} at lightness ${c.l} claims chroma ${c.c} above the taper cap 0.03`,
        });
      }
    }

    // color-neutral-tint (hue within ±15° of the primary token's hue,
    // unless the primary itself is neutral → monochrome selection)
    const primary = tokenColor(set, "--primary");
    if (primary && primary.c >= 0.03) {
      for (const name of NEUTRAL_TOKENS) {
        const c = tokenColor(set, name);
        if (c && c.c > 0.015 && hueDistance(c.h, primary.h) > 15) {
          findings.push({
            rule: "color-neutral-tint",
            path: at(name),
            message: `${name} hue ${c.h} sits ${Math.round(hueDistance(c.h, primary.h) * 10) / 10}° from the primary hue ${primary.h} (limit 15°)`,
          });
        }
      }
    }

    // color-enterprise-accent (enterprise: accent stays in the primary family)
    if (profile === "enterprise" && primary && primary.c >= 0.03) {
      const accent = tokenColor(set, "--accent");
      if (accent && accent.c > 0.015 && hueDistance(accent.h, primary.h) > 25) {
        findings.push({
          rule: "color-enterprise-accent",
          path: at("--accent"),
          message: `enterprise accent hue ${accent.h} sits ${Math.round(hueDistance(accent.h, primary.h) * 10) / 10}° from the primary hue ${primary.h} (limit 25°; accent family disallowed)`,
        });
      }
    }

    // color-chart-separation
    const charts = CHART_TOKENS.map((name) => ({ name, c: tokenColor(set, name) })).filter(
      (entry): entry is { name: string; c: Oklch } => entry.c !== null,
    );
    if (charts.length === CHART_TOKENS.length) {
      for (let i = 0; i < charts.length; i++) {
        for (let j = i + 1; j < charts.length; j++) {
          const a = charts[i]!;
          const b = charts[j]!;
          const pair = `${a.name}/${b.name}`;
          if (deltaE(a.c, b.c) < 0.08) {
            findings.push({
              rule: "color-chart-separation",
              path: at(pair),
              message: `charts ${pair} are ΔE ${Math.round(deltaE(a.c, b.c) * 1000) / 1000} apart (floor 0.08)`,
            });
          } else if (hueDistance(a.c.h, b.c.h) < 25 && Math.abs(a.c.l - b.c.l) < 0.25) {
            findings.push({
              rule: "color-chart-separation",
              path: at(pair),
              message: `charts ${pair} are ${Math.round(hueDistance(a.c.h, b.c.h) * 10) / 10}° apart in hue with ΔL ${Math.round(Math.abs(a.c.l - b.c.l) * 1000) / 1000} (need ≥25° or ΔL ≥ 0.25)`,
            });
          }
        }
      }
    }

    // motion-bounds
    for (const name of ["--motion-fast", "--motion-normal"] as const) {
      const raw = set[name]?.$value;
      const ms = durationMs(raw);
      if (ms !== null && (ms < 50 || ms > 400)) {
        findings.push({
          rule: "motion-bounds",
          path: at(name),
          message: `${name} duration ${ms}ms is outside the component-transition bounds [50, 400]ms`,
        });
      }
      const easing = typeof raw === "object" && raw !== null
        ? (raw as Record<string, unknown>).easing
        : undefined;
      if (typeof easing === "string" && !CLOSED_EASINGS.has(easing)) {
        findings.push({
          rule: "motion-bounds",
          path: at(name),
          message: `${name} easing '${easing}' is not in the closed motion set`,
        });
      }
    }
  }

  // radius-profile-bounds
  const radiusBound = profile === "enterprise" ? 0.5 : profile === "expressive" ? 1.5 : 1;
  for (const mode of modes) {
    const raw = (tokens[mode]?.["--radius"] as { $value?: unknown } | undefined)?.$value;
    if (typeof raw === "string") {
      const match = raw.match(/^([\d.]+)(rem|px)$/);
      if (match) {
        const rem = match[2] === "px" ? Number(match[1]) / 16 : Number(match[1]);
        if (rem > radiusBound) {
          findings.push({
            rule: "radius-profile-bounds",
            path: `${mode}.--radius`,
            message: `--radius ${raw} exceeds the ${profile} bound ${radiusBound}rem`,
          });
        }
      }
    }
  }

  // type-scale-only (closed registry; enterprise never takes editorial-1.5)
  const typeScale = (identity as { typeScale?: unknown }).typeScale;
  for (const issue of validateTypeScaleSelection(typeof typeScale === "string" ? typeScale : undefined)) {
    findings.push({ rule: "type-scale-only", path: issue.path, message: issue.message });
  }
  if (typeof typeScale === "string" && typeScale === "editorial-1.5" && profile === "enterprise") {
    findings.push({
      rule: "type-scale-only",
      path: "typeScale",
      message: `enterprise profile never selects 'editorial-1.5'`,
    });
  }

  // type-line-height-bands + type-display-cap (on the derived emission —
  // derivation is deterministic from payload fields, so this is payload-level)
  if (typeof typeScale === "string" && validateTypeScaleSelection(typeScale).length === 0) {
    const derived = deriveTypeScale(typeScale, profile);
    const bands: Record<string, [number, number]> = {
      display: [1.0, 1.15],
      heading: [1.15, 1.3],
      body: [1.45, 1.65],
      label: [1.2, 1.4],
    };
    for (const role of TYPE_ROLES) {
      const group = roleGroup(role);
      const [lo, hi] = bands[group]!;
      const lh = derived[role]!.lineHeight;
      if (lh < lo || lh > hi) {
        findings.push({
          rule: "type-line-height-bands",
          path: `typeScale.${typeScale}.${role}`,
          message: `${role} line-height ${lh} is outside the ${group} band [${lo}, ${hi}]`,
        });
      }
    }
    const cap = Math.min(
      DISPLAY_CAP_BY_PROFILE[profile] * 16,
      DISPLAY_CAP_ABSOLUTE_PX,
    );
    if (derived.display.sizePx > cap) {
      findings.push({
        rule: "type-display-cap",
        path: `typeScale.${typeScale}.display`,
        message: `display ${derived.display.sizePx}px exceeds the ${profile} cap ${cap}px`,
      });
    }
  }

  return findings;
}

/**
 * Strict gate for Shapeshift-generated payloads (generation + publish):
 * throws naming the rule on any remaining enforce-tier finding. Hand
 * authors never hit this — their findings stay lint.
 */
export function assertGeneratedCompliant(identity: ArcheIdentity): void {
  const findings = checkDesignRules(identity);
  if (findings.length > 0) {
    throw new Error(
      `generated payload violates design rules:\n${findings.map((f) => `- [${f.rule}] ${f.path}: ${f.message}`).join("\n")}`,
    );
  }
}
