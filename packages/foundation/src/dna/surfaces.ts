/**
 * Surfaces / materials / imagery layer (Composition + Surfaces DNA layer).
 *
 * Art directions and surfaces apply per-slot, never globally. Slots that
 * accept a surface: hero background, card surface, auth panel,
 * empty-state visual, avatar/illustration spot. (Sections and CTA bands
 * stay unpainted so the page treatment beneath shows through.)
 *
 * All procedural surfaces compile from the identity's own palette — zero
 * external assets, zero license risk, always on-brand. Photos/illustrations
 * are fetched at runtime by the end user's app (API), never bundled into
 * Arche's registry.
 *
 * License rules (researched 2026-11-23, for Arche's redistribution model):
 * - Procedural first: gradients, grain, patterns, shapes, duotone — generated
 *   by the compiler from palette tokens. No licenses, no attribution.
 * - CC0/MIT only when bundling: Open Peeps / Humaaans (CC0), Pattern
 *   Monster (MIT). These are the only illustration/pattern sources safe to
 *   ship inside generated libraries.
 * - Photos via API at runtime: Unsplash first choice; the end user's app
 *   fetches, Arche never redistributes photo files.
 * - Never bundle: unDraw / ManyPixels / Storyset / Hero Patterns / Haikei
 *   output — redistribution / competing-service / attribution terms clash
 *   with generated libraries. Treat Haikei/fffuel/BGJar as technique
 *   references only; Arche's generators are Arche's own code in
 *   registry-core, deterministic (seeded) and token-colored.
 */

/** Closed surface vocabulary — one value per slot. */
export const SURFACE_OPTIONS = [
  "flat",
  "gradient-linear",
  "gradient-mesh",
  "grainy-gradient",
  "pattern",
  "photo",
  "photo-duotone",
  "photo-tinted",
  "illustration",
  "glass",
  "texture",
  "shapes",
  "none",
] as const;

/**
 * Per-block background choices (Block backgrounds brief). Every block
 * preview header offers these; the global page token is gone. Photo
 * options render the shared --surface-photo image; cards reuse the same
 * list minus the photo options. Kept here (not in the contract) because
 * the choice is stored per block, not as a global token.
 */
export const BLOCK_BACKGROUND_OPTIONS = [
  "flat",
  "gradient-linear",
  "gradient-mesh",
  "grainy-gradient",
  "pattern",
  "photo",
  "photo-duotone",
  "photo-tinted",
  "glass",
  "texture",
  "none",
] as const;

export type BlockBackground = (typeof BLOCK_BACKGROUND_OPTIONS)[number];

export type SurfaceId = (typeof SURFACE_OPTIONS)[number];

/** Slots that accept a surface value. */
export const SURFACE_SLOTS = [
  "hero-background",
  "card-surface",
  "auth-panel",
  "empty-state-visual",
  "illustration-spot",
] as const;

export type SurfaceSlot = (typeof SURFACE_SLOTS)[number];

/** Per-slot surface defaults for one art direction. */
export type SurfaceDefaults = Record<SurfaceSlot, SurfaceId>;

/** The default surface: a solid token color. Always legal. */
export const DEFAULT_SURFACE: SurfaceId = "flat";

/** Fallback defaults when an art direction names no surface for a slot. */
export const DEFAULT_SURFACE_DEFAULTS: SurfaceDefaults = {
  "hero-background": "flat",
  "card-surface": "flat",
  "auth-panel": "flat",
  "empty-state-visual": "none",
  "illustration-spot": "none",
};

const SURFACE_SET = new Set<string>(SURFACE_OPTIONS);
const SLOT_SET = new Set<string>(SURFACE_SLOTS);

/** True when the value is a member of the closed surface vocabulary. */
export function isSurfaceId(value: unknown): value is SurfaceId {
  return typeof value === "string" && SURFACE_SET.has(value);
}

/** True when the slot accepts a surface value. */
export function isSurfaceSlot(value: unknown): value is SurfaceSlot {
  return typeof value === "string" && SLOT_SET.has(value);
}

/**
 * Resolve per-slot surfaces: direction defaults win, missing slots fall
 * back to flat/none, unknown values fall back to the slot default.
 * Deterministic; never throws.
 */
export function resolveSurfaceDefaults(
  partial?: Partial<Record<SurfaceSlot, SurfaceId>>,
): SurfaceDefaults {
  const out = { ...DEFAULT_SURFACE_DEFAULTS };
  if (!partial) return out;
  for (const slot of SURFACE_SLOTS) {
    const value = partial[slot];
    if (isSurfaceId(value)) out[slot] = value;
  }
  return out;
}

/**
 * Procedural surfaces are compiler-generated from palette tokens and need
 * no external assets. Photo / illustration surfaces resolve at runtime.
 */
export function isProceduralSurface(surface: SurfaceId): boolean {
  return (
    surface === "gradient-linear" ||
    surface === "gradient-mesh" ||
    surface === "grainy-gradient" ||
    surface === "pattern" ||
    surface === "photo-duotone" ||
    surface === "glass" ||
    surface === "texture" ||
    surface === "shapes"
  );
}

/** Surfaces that require a runtime photo fetch (never bundled). */
export function isRuntimePhotoSurface(surface: SurfaceId): boolean {
  return surface === "photo" || surface === "photo-duotone" || surface === "photo-tinted";
}

/** Surfaces that require a runtime/CC0 illustration (never bundled packs). */
export function isRuntimeIllustrationSurface(surface: SurfaceId): boolean {
  return surface === "illustration";
}
