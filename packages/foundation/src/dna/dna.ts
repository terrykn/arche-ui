import { z } from "zod";

/**
 * Design DNA v2 (Brief #8, Deliverable 1) — the AI's entire output surface.
 *
 * Frozen by Brief #8: 8 scores + 3 hues + 3 closed enums. The model returns
 * DNA and nothing else — no plan, no self-check, no profile. Plan names and
 * profile are derived deterministically by the compiler. The model never
 * touches a token, a class, or a knob value.
 */

const axis = z.number().min(0).max(1);

export const dnaAxesSchema = z.object({
  /** cold/clinical → warm/organic */
  warmth: axis,
  /** muted → vivid: how much color, not which color. 0 = grayscale (C = 0
   * exactly), 1 = full ladder. Vivid signal on quiet ground. */
  chroma: axis,
  /** calm → loud */
  energy: axis,
  /** serious → playful */
  playfulness: axis,
  /** soft/round → sharp/angular */
  sharpness: axis,
  /** airy → compact */
  density: axis,
  /** minimal → ornate */
  ornament: axis,
  /** casual → formal/institutional */
  formality: axis,
});

export type DnaAxes = z.infer<typeof dnaAxesSchema>;

export const dnaEnums = {
  material: ["flat", "paper", "glass", "metal", "marble", "pixel", "clay"],
  motionFeel: ["snappy", "smooth", "bouncy", "stately", "glitchy"],
  texture: ["none", "grain", "scanlines", "grid", "marble-vein", "halftone"],
} as const;

export const dnaEnumsSchema = z.object({
  material: z.enum(dnaEnums.material),
  motionFeel: z.enum(dnaEnums.motionFeel),
  texture: z.enum(dnaEnums.texture),
});

export type DnaEnums = z.infer<typeof dnaEnumsSchema>;

/** Full DNA object: axes + enums + fixed guardrails. */
export const dnaObjectSchema = dnaAxesSchema.and(dnaEnumsSchema).and(
  z.object({
    /**
     * Restart-spec reconciliation: the addendum's AA/AAA choice collapses to
     * AA here — the AA gate (library spec §5.4) is absolute. Fixed value.
     */
    minContrast: z.literal("AA"),
    /** Fixed: motion reduction is not user-disableable. */
    respectReducedMotion: z.literal(true),
  }),
);

export type DnaObject = z.infer<typeof dnaObjectSchema>;

/**
 * Palette anchors in degrees (0-360): measured or model-chosen hues.
 *
 * `brandHue` (Brand Token brief) is the recognizable brand color — the
 * company/logo hue from the prompt. Optional on input (missing defaults to
 * `primaryHue` — resolved by the compiler, never by the model); always
 * present on the compiled payload's DNA section.
 */
export const dnaPaletteSchema = z.object({
  primaryHue: z.number().min(0).max(360),
  accentHue: z.number().min(0).max(360),
  neutralHue: z.number().min(0).max(360),
  brandHue: z.number().min(0).max(360).optional(),
});

export type DnaPalette = z.infer<typeof dnaPaletteSchema>;

/**
 * Resolve the effective brand hue: the model's brand choice when present,
 * otherwise the primary hue (existing identities keep `--brand` ==
 * `--primary` until regenerated). Deterministic; code decides.
 */
export function resolveBrandHue(palette: DnaPalette): number {
  return typeof palette.brandHue === "number" ? palette.brandHue : palette.primaryHue;
}

/**
 * Fill a missing brandHue with the primary hue, reporting whether the
 * default applied (the generation log records it — acceptance criterion 1).
 */
export function withBrandDefault(palette: DnaPalette): { palette: DnaPalette; defaulted: boolean } {
  if (typeof palette.brandHue === "number") return { palette, defaulted: false };
  return { palette: { ...palette, brandHue: palette.primaryHue }, defaulted: true };
}

/**
 * Derived generation profile (design-rules envelope preset). Derived by the
 * compiler from DNA — never model-chosen (Brief #8 §5):
 * enterprise when formality ≥ 0.6 and chroma ≤ 0.4;
 * expressive when chroma ≥ 0.7 or playfulness ≥ 0.7; standard otherwise.
 * Recorded on the compiled payload; never relaxes WCAG AA or the taper rule.
 */
export const generationProfileSchema = z.enum(["enterprise", "standard", "expressive"]);

export type GenerationProfile = z.infer<typeof generationProfileSchema>;

/** Derive the profile envelope from DNA axes (Brief #8 §5). */
export function deriveProfile(axes: { formality: number; chroma: number; playfulness: number }): GenerationProfile {
  if (axes.formality >= 0.6 && axes.chroma <= 0.4) return "enterprise";
  if (axes.chroma >= 0.7 || axes.playfulness >= 0.7) return "expressive";
  return "standard";
}

export const dnaSourceSchema = z.object({
  type: z.enum(["phrase", "image", "fixture", "remix", "manual"]),
  /** present when type = phrase */
  promptText: z.string().min(1).max(120).optional(),
  /** storage key, when type = image */
  sourceRef: z.string().min(1).optional(),
});

export type DnaSource = z.infer<typeof dnaSourceSchema>;

/** Payload-level DNA section (§4). Optional on the payload: older payloads
 * without it remain valid; required for generated identities. */
export const dnaSectionSchema = z.object({
  source: dnaSourceSchema,
  axes: dnaObjectSchema,
  palette: dnaPaletteSchema,
  /** Envelope preset derived by the compiler; recorded per Deliverable 1. */
  profile: generationProfileSchema,
  /** Bump when compiler mappings change; goldens regenerate deliberately. */
  compilerVersion: z.number().int().min(1),
});

export type DnaSection = z.infer<typeof dnaSectionSchema>;

const optionalAxis = axis.optional();

/**
 * One palette direction proposed by the model for the picker's palette
 * step: hue anchors + an evocative name. Chroma budgets stay the
 * compiler's job, so variants can never widen a registry.
 */
export const paletteVariantSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().min(1).max(60),
  anchors: dnaPaletteSchema,
  reason: z.string().min(1).max(200),
});

export type PaletteVariant = z.infer<typeof paletteVariantSchema>;

/**
 * One typography direction proposed by the model for the picker's
 * typography step: header + body picks as closed-registry font ids
 * (validated against the registry + pairing rules downstream; the mono
 * slot stays derived by the compiler).
 */
export const typefaceVariantSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().min(1).max(60),
  display: z.string().min(1).max(60),
  body: z.string().min(1).max(60),
  reason: z.string().min(1).max(200),
});

export type TypefaceVariant = z.infer<typeof typefaceVariantSchema>;

/**
 * The generation service's single model response (Brief #8, Deliverable 4,
 * extended with picker variants): DNA v2 — scores + hues + enums — plus
 * exactly 3 palette variants for step 1 and exactly 3 typography variants
 * for the typography step, all derived from the same prompt in one call.
 * Strict: a response containing plan, selfCheck, or profile fails
 * validation.
 */
export const modelOutputSchema = z
  .object({
    axes: dnaObjectSchema,
    palette: dnaPaletteSchema,
    palettes: z.array(paletteVariantSchema).length(3),
    typefaces: z.array(typefaceVariantSchema).length(3),
  })
  .strict();

export type ModelOutput = z.infer<typeof modelOutputSchema>;

/**
 * Prompt-edit single-call response: the revised inputs as a diff-scoped
 * delta only. Strict: no plan, no self-check, no profile.
 */
export const modelDeltaOutputSchema = z
  .object({
    delta: z
      .object({
        axes: z
          .object({
            warmth: optionalAxis,
            chroma: optionalAxis,
            energy: optionalAxis,
            playfulness: optionalAxis,
            sharpness: optionalAxis,
            density: optionalAxis,
            ornament: optionalAxis,
            formality: optionalAxis,
            material: dnaEnumsSchema.shape.material.optional(),
            motionFeel: dnaEnumsSchema.shape.motionFeel.optional(),
            texture: dnaEnumsSchema.shape.texture.optional(),
          })
          .optional(),
        palette: dnaPaletteSchema.partial().optional(),
      })
      .optional(),
  })
  .strict();

export type ModelDeltaOutput = z.infer<typeof modelDeltaOutputSchema>;

/**
 * Prompt-edit delta: only the axes/enums the prompt implicates, with new
 * values. Applied onto the stored DNA, then recompiled — unrelated payload
 * fields stay byte-identical.
 */
export const dnaDeltaSchema = z.object({
  axes: z
    .object({
      warmth: optionalAxis,
      chroma: optionalAxis,
      energy: optionalAxis,
      playfulness: optionalAxis,
      sharpness: optionalAxis,
      density: optionalAxis,
      ornament: optionalAxis,
      formality: optionalAxis,
      material: dnaEnumsSchema.shape.material.optional(),
      motionFeel: dnaEnumsSchema.shape.motionFeel.optional(),
      texture: dnaEnumsSchema.shape.texture.optional(),
    })
    .optional(),
  palette: dnaPaletteSchema.partial().optional(),
});

export type DnaDelta = z.infer<typeof dnaDeltaSchema>;

/**
 * Migrate stored v1/v6 DNA onto the v2 shape: drop the removed
 * `retroFuturism` axis when present, default a missing `chroma` from
 * `energy` (0.5) and report whether a migration happened (logged, never
 * silently re-published).
 */
export function migrateDnaAxes(axes: Record<string, unknown>): { axes: Record<string, unknown>; migrated: boolean } {
  const next: Record<string, unknown> = { ...axes };
  let migrated = false;
  if ("retroFuturism" in next) {
    delete next.retroFuturism;
    migrated = true;
  }
  if (typeof next.chroma !== "number") {
    const energy = typeof next.energy === "number" ? (next.energy as number) : 0.5;
    next.chroma = Math.min(1, Math.max(0, Math.round(energy * 1000) / 1000));
    migrated = true;
  }
  return { axes: next, migrated };
}

/**
 * Current compiler version stamped on newly compiled DNA sections.
 * Bumped 6 → 7 for DNA v2 (true-zero chroma ladder, monochrome-by-construction,
 * derived profile/plan names, retroFuturism removed; goldens regenerate
 * deliberately, fixtures backfilled descriptively).
 */
export const DNA_COMPILER_VERSION = 7;
