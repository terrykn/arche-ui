/**
 * Composition affinity tagging vocabulary (Part 1).
 *
 * Tag each block variant with ONE primary composition (optionally one
 * secondary). These are the values the variant selector scores against DNA.
 *
 * Tagging guidance: tag what the variant *is*, not what it could become.
 * A hero with centered headline + centered CTA = `centered` even if it has
 * a background image (that is surface, Part 2). When two compositions
 * genuinely fit, the primary is the one that survives removing the imagery.
 */

/** Closed composition vocabulary (primary / secondary tag values). */
export const COMPOSITION_OPTIONS = [
  "centered",
  "split",
  "editorial",
  "bento",
  "grid-strict",
  "immersive",
  "stacked",
  "sidebar-led",
  "card-grid",
  "minimal-text",
] as const;

export type CompositionId = (typeof COMPOSITION_OPTIONS)[number];

/** Closed imagery vocabulary (DNA-level imagery direction). */
export const IMAGERY_OPTIONS = ["none", "photo", "duotone", "illustration", "texture-led"] as const;

export type ImageryId = (typeof IMAGERY_OPTIONS)[number];

const COMPOSITION_SET = new Set<string>(COMPOSITION_OPTIONS);
const IMAGERY_SET = new Set<string>(IMAGERY_OPTIONS);

/** True when the value is a member of the closed composition vocabulary. */
export function isCompositionId(value: unknown): value is CompositionId {
  return typeof value === "string" && COMPOSITION_SET.has(value);
}

/** True when the value is a member of the closed imagery vocabulary. */
export function isImageryId(value: unknown): value is ImageryId {
  return typeof value === "string" && IMAGERY_SET.has(value);
}

/**
 * Deterministic composition default derived from DNA axes (code decides,
 * never the model). Formal/dense voices collapse to grid-strict; loud and
 * playful voices to editorial; airy minimal voices to centered.
 */
export function defaultCompositionFor(axes: {
  formality: number;
  density: number;
  energy: number;
  playfulness: number;
  ornament: number;
}): CompositionId {
  if (axes.formality >= 0.7 && axes.density >= 0.3) return "grid-strict";
  if (axes.energy >= 0.7 || axes.playfulness >= 0.7) return "editorial";
  if (axes.ornament <= 0.25 && axes.energy <= 0.4) return "centered";
  if (axes.density >= 0.65) return "card-grid";
  return "stacked";
}

/**
 * Deterministic imagery default derived from DNA (code decides).
 * Texture-led when the texture enum carries the voice; duotone when chroma
 * is high enough to remap a photo; photo only when energy is high and no
 * texture voice exists; otherwise none (type/color carry it).
 */
export function defaultImageryFor(axes: { chroma: number; energy: number; texture: string }): ImageryId {
  if (axes.texture !== "none") return "texture-led";
  if (axes.chroma >= 0.55 && axes.energy >= 0.4) return "duotone";
  if (axes.energy >= 0.65) return "photo";
  return "none";
}
