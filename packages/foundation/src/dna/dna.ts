import { z } from "zod";

/**
 * Design DNA (Brief #6, Addendum A1.3) — the AI's entire output surface.
 * Eight 0-1 axes + three closed enums + palette anchors. The model may
 * produce DNA and palette anchors — never tokens, classes, or knob values.
 * The style compiler (registry-core) owns every mapping from DNA to payload.
 */

const axis = z.number().min(0).max(1);

export const dnaAxesSchema = z.object({
  /** cold/clinical → warm/organic */
  warmth: axis,
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
  /** contemporary → era-styled */
  retroFuturism: axis,
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

/** Palette anchors in degrees (0-360): measured or model-chosen hues. */
export const dnaPaletteSchema = z.object({
  primaryHue: z.number().min(0).max(360),
  accentHue: z.number().min(0).max(360),
  neutralHue: z.number().min(0).max(360),
});

export type DnaPalette = z.infer<typeof dnaPaletteSchema>;

/**
 * Generation profile (design-rules envelope preset). The model classifies
 * the request alongside the DNA; the user never picks it manually in v1.
 * Recorded on the compiled payload; never relaxes WCAG AA or the taper rule.
 */
export const generationProfileSchema = z.enum(["enterprise", "standard", "expressive"]);

export type GenerationProfile = z.infer<typeof generationProfileSchema>;

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
  /** Envelope preset the compiler mapped under; recorded per Deliverable 1. */
  profile: generationProfileSchema,
  /** Bump when compiler mappings change; goldens regenerate deliberately. */
  compilerVersion: z.number().int().min(1),
});

export type DnaSection = z.infer<typeof dnaSectionSchema>;

const optionalAxis = axis.optional();

/**
 * Plan section of the single-call response (Deliverable 3): 4-6 named
 * colors with intended roles, already revised per the self-check.
 */
export const planColorSchema = z.object({
  name: z.string().min(1).max(40),
  role: z.enum(["background", "surface", "primary", "accent", "neutral", "text", "semantic-fixed"]),
  /** Free-form value note (e.g. an oklch guess); the compiler owns real values. */
  note: z.string().max(120).optional(),
});

export const planSchema = z.object({
  colors: z.array(planColorSchema).min(4).max(6),
});

export type Plan = z.infer<typeof planSchema>;

/** Self-check section: the plan checked against the taught calibration list. */
export const selfCheckSchema = z.object({
  verdict: z.enum(["pass", "revised"]),
  notes: z.string().min(1).max(500),
});

export type SelfCheck = z.infer<typeof selfCheckSchema>;

/**
 * The generation service's single model response (Deliverable 3): plan +
 * self-check + final inputs (DNA + palette anchors + profile). The checkable
 * half of the taught rules is enforced on the compiled payload, so the
 * revision happens inside this one completion — no second model call.
 */
export const modelOutputSchema = z.object({
  plan: planSchema,
  selfCheck: selfCheckSchema,
  axes: dnaObjectSchema,
  palette: dnaPaletteSchema,
  profile: generationProfileSchema,
});

export type ModelOutput = z.infer<typeof modelOutputSchema>;

/**
 * Prompt-edit single-call response: same shape (plan + self-check), with the
 * revised inputs expressed as a delta plus an optional profile change.
 */
export const modelDeltaOutputSchema = z.object({
  plan: planSchema,
  selfCheck: selfCheckSchema,
  delta: z.object({
    axes: z
      .object({
        warmth: optionalAxis,
        energy: optionalAxis,
        playfulness: optionalAxis,
        sharpness: optionalAxis,
        density: optionalAxis,
        ornament: optionalAxis,
        retroFuturism: optionalAxis,
        formality: optionalAxis,
        material: dnaEnumsSchema.shape.material.optional(),
        motionFeel: dnaEnumsSchema.shape.motionFeel.optional(),
        texture: dnaEnumsSchema.shape.texture.optional(),
      })
      .optional(),
    palette: dnaPaletteSchema.partial().optional(),
  }),
  profile: generationProfileSchema.optional(),
});

export type ModelDeltaOutput = z.infer<typeof modelDeltaOutputSchema>;

/**
 * Prompt-edit delta (Brief #6 §7): only the axes/enums the prompt implicates,
 * with new values. Applied onto the stored DNA, then recompiled — unrelated
 * payload fields stay byte-identical.
 */
export const dnaDeltaSchema = z.object({
  axes: z
    .object({
      warmth: optionalAxis,
      energy: optionalAxis,
      playfulness: optionalAxis,
      sharpness: optionalAxis,
      density: optionalAxis,
      ornament: optionalAxis,
      retroFuturism: optionalAxis,
      formality: optionalAxis,
      material: dnaEnumsSchema.shape.material.optional(),
      motionFeel: dnaEnumsSchema.shape.motionFeel.optional(),
      texture: dnaEnumsSchema.shape.texture.optional(),
    })
    .optional(),
  palette: dnaPaletteSchema.partial().optional(),
});

export type DnaDelta = z.infer<typeof dnaDeltaSchema>;

/** Current compiler version stamped on newly compiled DNA sections. */
export const DNA_COMPILER_VERSION = 2;
