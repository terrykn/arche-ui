import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type GenerationProfile = "enterprise" | "standard" | "expressive";

export interface TypeScaleEntry {
  id: string;
  ratio: number;
  basePx: number;
  displayCapMultiple: number;
  lineHeights: { display: number; heading: number; body: number; label: number };
  letterSpacing: { display: string; heading: string; label: string };
}

export interface TypeScaleRegistry {
  registryVersion: number;
  scales: TypeScaleEntry[];
}

export interface RegistryIssue {
  path: string;
  message: string;
}

const REGISTRY_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "typography",
  "type-scale-registry.json",
);

let cached: TypeScaleRegistry | null = null;

/** Loads the closed type-scale registry (parsed + typed). */
export function loadTypeScaleRegistry(): TypeScaleRegistry {
  if (!cached) {
    cached = JSON.parse(readFileSync(REGISTRY_FILE, "utf8")) as TypeScaleRegistry;
  }
  return cached;
}

/** Scales by id. */
export function typeScaleEntriesById(): Map<string, TypeScaleEntry> {
  return new Map(loadTypeScaleRegistry().scales.map((scale) => [scale.id, scale]));
}

/** Roles in scale order: caption/label below body, h6..h1 then display above. */
export const TYPE_ROLES = [
  "caption",
  "label",
  "body",
  "h6",
  "h5",
  "h4",
  "h3",
  "h2",
  "h1",
  "display",
] as const;

export type TypeRole = (typeof TYPE_ROLES)[number];

/** Scale-degree exponent per role (body = 0). */
const ROLE_EXPONENT: Record<TypeRole, number> = {
  caption: -2,
  label: -1,
  body: 0,
  h6: 1,
  h5: 2,
  h4: 3,
  h3: 4,
  h2: 5,
  h1: 6,
  display: 7,
};

export type TypeRoleGroup = "display" | "heading" | "body" | "label";

export function roleGroup(role: TypeRole): TypeRoleGroup {
  if (role === "display") return "display";
  if (role === "body") return "body";
  if (role === "label" || role === "caption") return "label";
  return "heading";
}

export interface DerivedTypeStep {
  /** px size, rounded to the nearest 0.5px. */
  sizePx: number;
  lineHeight: number;
  letterSpacing: string;
}

/** Profile display-cap multiples (type-display-cap rule). */
export const DISPLAY_CAP_BY_PROFILE: Record<GenerationProfile, number> = {
  enterprise: 3,
  standard: 4,
  expressive: 5,
};

export const DISPLAY_CAP_ABSOLUTE_PX = 96;

/**
 * Derives every --text-* step for a scale id: base * ratio^n per role,
 * rounded to the nearest 0.5px. Display is clamped to the tighter of the
 * entry multiple, the profile multiple, and 96px absolute. Deterministic.
 */
export function deriveTypeScale(
  scaleId: string,
  profile: GenerationProfile = "standard",
): Record<TypeRole, DerivedTypeStep> {
  const entry = typeScaleEntriesById().get(scaleId);
  if (!entry) {
    throw new Error(`unknown type scale id '${scaleId}' — not in the closed type-scale registry`);
  }
  const capMultiple = Math.min(entry.displayCapMultiple, DISPLAY_CAP_BY_PROFILE[profile]);
  const out = {} as Record<TypeRole, DerivedTypeStep>;
  for (const role of TYPE_ROLES) {
    const group = roleGroup(role);
    // The registry tracks spacing for display/heading/label only; body copy
    // takes the heading spacing (near-zero in every entry).
    const spacingGroup = group === "body" ? "heading" : group;
    const raw = entry.basePx * Math.pow(entry.ratio, ROLE_EXPONENT[role]);
    let sizePx = Math.round(raw * 2) / 2;
    if (role === "display") {
      sizePx = Math.min(sizePx, capMultiple * entry.basePx, DISPLAY_CAP_ABSOLUTE_PX);
    }
    out[role] = {
      sizePx,
      lineHeight: entry.lineHeights[group],
      letterSpacing: entry.letterSpacing[spacingGroup],
    };
  }
  return out;
}

/**
 * Validates an identity's typeScale selection: exactly one known registry id.
 * Missing or unknown ids are reported (lint for hand-authored payloads,
 * blocking for generated ones — decided by the caller).
 */
export function validateTypeScaleSelection(typeScale: string | undefined): RegistryIssue[] {
  if (typeof typeScale !== "string" || typeScale.length === 0) {
    return [
      {
        path: "typeScale",
        message: "identity declares no type scale; exactly one closed-registry scale id is required",
      },
    ];
  }
  if (!typeScaleEntriesById().has(typeScale)) {
    return [
      {
        path: "typeScale",
        message: `type scale '${typeScale}' is not in the closed type-scale registry`,
      },
    ];
  }
  return [];
}
