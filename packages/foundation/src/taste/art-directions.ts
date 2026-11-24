import { fontEntriesById } from "../fonts/fonts.js";
import type { DnaObject, GenerationProfile } from "../dna/dna.js";
import type { CompositionId, ImageryId } from "../dna/composition.js";
import type { SurfaceDefaults } from "../dna/surfaces.js";

/**
 * Art directions (Brief #7 Deliverable 1). A direction = base + treatment =
 * named style. Directions are DATA, not code: adding one is a registry
 * entry, never a code change. Each maps to DNA ranges so the compiler can
 * land on one deterministically; the model never names a direction.
 */

export interface ArtDirectionFontPair {
  /** Display face id (must allow the display slot). */
  display: string;
  /** Body face id (must allow the body slot). */
  body: string;
}

export interface ArtDirection {
  /** Permanent id, stored on the identity. */
  id: string;
  /** Evocative name shown in Studio — never a bare id in the UI. */
  name: string;
  statement: string;
  palettePhilosophy: string;
  fonts: ArtDirectionFontPair;
  imageryTreatment: string;
  /** DNA motionFeel the direction expects. */
  motionFeel: DnaObject["motionFeel"];
  layoutGrammar: string;
  /** Closed material hints (subset of the DNA material enum). */
  materials: Array<DnaObject["material"]>;
  /**
   * Composition affinity layer (Part 1): the primary composition this
   * direction prefers. Scored by the variant selector; ties break by
   * registry order so older tests without a composition stay stable.
   */
  composition: CompositionId;
  /** DNA-level imagery direction this direction prefers. */
  imagery: ImageryId;
  /** Per-slot surface defaults (Part 2). Missing slots resolve to flat/none. */
  surfaces: SurfaceDefaults;
  /** Per-axis inclusive ranges; absent axes are unconstrained. */
  dnaRanges: Partial<Record<keyof DnaObject, readonly [number, number]>>;
  /** Profiles this direction may serve (absent = any). */
  profiles?: GenerationProfile[];
}

function r(lo: number, hi: number): readonly [number, number] {
  return [lo, hi] as const;
}

export const ART_DIRECTIONS: ArtDirection[] = [
  {
    id: "glassmorphism",
    name: "Glass Study",
    statement:
      "Material: glass. Translucency, soft borders, layered depth — frosted surfaces floating over a tinted backdrop.",
    palettePhilosophy:
      "Tinted neutrals carry the hue; solids stay quiet so the blur reads as the accent. One accent family at most.",
    fonts: { display: "cabinet-grotesk", body: "satoshi" },
    imageryTreatment: "Frosted-glass panels may sit over content backdrops; never place body text over busy imagery.",
    motionFeel: "smooth",
    layoutGrammar: "Layered depth: backdrop wash, floating panels with blur, generous air between layers.",
    materials: ["glass"],
    composition: "immersive",
    imagery: "texture-led",
    surfaces: {
      "hero-background": "gradient-mesh",
      "card-surface": "glass",
      "auth-panel": "glass",
      "empty-state-visual": "none",
      "illustration-spot": "none",
    },
    dnaRanges: { energy: r(0.3, 0.7), ornament: r(0.3, 0.8) },
  },
  {
    id: "swiss-poster",
    name: "Swiss Poster",
    statement:
      "Sharpness and formality high. Grid layout, grotesque type, hard rules — the poster wall school.",
    palettePhilosophy:
      "Near-neutral field with one confident solid. Hierarchy from scale and weight, never from extra hues.",
    fonts: { display: "archivo", body: "public-sans" },
    imageryTreatment: "Flat color fields and hard-cropped imagery on the grid; no texture overlays.",
    motionFeel: "snappy",
    layoutGrammar: "Strict column grid, strong left edges, oversized numerals and rules as ornament.",
    materials: ["flat", "paper"],
    composition: "grid-strict",
    imagery: "none",
    surfaces: {
      "hero-background": "flat",
      "card-surface": "flat",
      "auth-panel": "flat",
      "empty-state-visual": "none",
      "illustration-spot": "none",
    },
    dnaRanges: { sharpness: r(0.7, 1), formality: r(0.7, 1), density: r(0.3, 0.7) },
  },
  {
    id: "typographic-maximalism",
    name: "Maximal Type",
    statement:
      "Display type scale at max, oversized wordmarks, sharpness high. The type IS the imagery.",
    palettePhilosophy:
      "Loud solid on a quiet field; accent reserved for the single focal word. Chroma is spent on letterforms.",
    fonts: { display: "clash-display", body: "general-sans" },
    imageryTreatment: "No photography where type can do the job; duotone treatments only when imagery is required.",
    motionFeel: "snappy",
    layoutGrammar: "Full-bleed headlines, tight leading, overlapping scale contrasts; one idea per view.",
    materials: ["flat"],
    composition: "editorial",
    imagery: "duotone",
    surfaces: {
      "hero-background": "flat",
      "card-surface": "flat",
      "auth-panel": "flat",
      "empty-state-visual": "none",
      "illustration-spot": "none",
    },
    dnaRanges: { energy: r(0.7, 1), sharpness: r(0.6, 1) },
    profiles: ["expressive", "standard"],
  },
  {
    id: "tactilism",
    name: "Tactile Grain",
    statement:
      "Texture-forward: grain, scanlines, halftone. Surfaces you can almost feel; content panels stay flat.",
    palettePhilosophy:
      "Warm-tinted neutrals; texture carries the personality so color can stay restrained.",
    fonts: { display: "sentient", body: "cabinet-grotesk" },
    imageryTreatment:
      "Grain overlay 0.04-0.08 opacity via SVG feTurbulence over neutral surfaces — never a baked grain image.",
    motionFeel: "smooth",
    layoutGrammar: "Soft stacked surfaces, tactile dividers, texture as the section break.",
    materials: ["paper", "clay", "flat"],
    composition: "stacked",
    imagery: "texture-led",
    surfaces: {
      "hero-background": "grainy-gradient",
      "card-surface": "flat",
      "auth-panel": "flat",
      "empty-state-visual": "none",
      "illustration-spot": "none",
    },
    dnaRanges: { ornament: r(0.5, 1) },
  },
  {
    id: "y2k-futurism",
    name: "Chrome Memory",
    statement:
      "2000s futurism: playfulness high, chrome and glitch motion. Nostalgic hardware, optimistic chrome.",
    palettePhilosophy:
      "Cool metallics with one hot accent; the accent surprises against the chrome base.",
    fonts: { display: "melodrama", body: "general-sans" },
    imageryTreatment: "Chrome/gloss treatments on display surfaces; glitch accents on decorative layers only.",
    motionFeel: "glitchy",
    layoutGrammar: "Glossy pills and bevels, beveled panels, playful asymmetry inside a tight grid.",
    materials: ["metal", "glass"],
    composition: "split",
    imagery: "photo",
    surfaces: {
      "hero-background": "gradient-mesh",
      "card-surface": "glass",
      "auth-panel": "glass",
      "empty-state-visual": "none",
      "illustration-spot": "shapes",
    },
    dnaRanges: { playfulness: r(0.5, 1), ornament: r(0.3, 1) },
  },
  {
    id: "soft-spa",
    name: "Soft Spa",
    statement:
      "Warmth high, mist backgrounds, pill radius. The dental-clinic direction: calm, clean, safe.",
    palettePhilosophy:
      "Warm mist tints; solids soft and desaturated; nothing visually loud except the single CTA.",
    fonts: { display: "bespoke-serif", body: "satoshi" },
    imageryTreatment: "Mist washes and soft-focus imagery; no hard edges on backdrops.",
    motionFeel: "smooth",
    layoutGrammar: "Pill shapes, airy rhythm, single centered column with soft dividers.",
    materials: ["clay", "paper", "flat"],
    composition: "centered",
    imagery: "duotone",
    surfaces: {
      "hero-background": "grainy-gradient",
      "card-surface": "flat",
      "auth-panel": "flat",
      "empty-state-visual": "photo-duotone",
      "illustration-spot": "photo-duotone",
    },
    dnaRanges: { warmth: r(0.65, 1), sharpness: r(0, 0.4) },
  },
  {
    id: "crt-hardware",
    name: "CRT Hardware",
    statement:
      "Pixel material, scanlines, chunky borders. The retro game shop direction: hardware you can hear.",
    palettePhilosophy:
      "Dark phosphor field with hot solids; accent is the brightest thing on screen, spent sparingly.",
    fonts: { display: "space-grotesk", body: "work-sans" },
    imageryTreatment: "Scanlines and pixel accents with hard edges; no gradients and no soft shadows anywhere.",
    motionFeel: "glitchy",
    layoutGrammar: "Chunky bordered panels, terminal grids, pixel rules as ornament.",
    materials: ["pixel"],
    composition: "grid-strict",
    imagery: "texture-led",
    surfaces: {
      "hero-background": "flat",
      "card-surface": "flat",
      "auth-panel": "flat",
      "empty-state-visual": "none",
      "illustration-spot": "none",
    },
    dnaRanges: {},
  },
  {
    id: "boardroom-red",
    name: "Boardroom",
    statement:
      "Formality high. Signal red reserved for the wordmark, the key numbers, and the CTA — the enterprise direction.",
    palettePhilosophy:
      "Monochrome-tinted neutrals with exactly one signal hue; enterprise profile carries no accent family.",
    fonts: { display: "zodiak", body: "switzer" },
    imageryTreatment: "Restrained editorial imagery, duotone toward the neutral tint; no decorative texture.",
    motionFeel: "stately",
    layoutGrammar: "Conservative grid, generous margins, tabular numerals for key figures.",
    materials: ["flat", "paper"],
    composition: "centered",
    imagery: "none",
    surfaces: {
      "hero-background": "flat",
      "card-surface": "flat",
      "auth-panel": "flat",
      "empty-state-visual": "none",
      "illustration-spot": "none",
    },
    dnaRanges: { formality: r(0.75, 1) },
    profiles: ["enterprise", "standard"],
  },
];

export interface DirectionSelection {
  id: string;
  /** Human-readable why, recorded on the draft. */
  reason: string;
}

/**
 * Deterministic direction selection: score = matching ranges + material
 * match + motion match + profile affinity. Ties break by registry order.
 */
export function selectArtDirection(axes: DnaObject, profile: GenerationProfile): DirectionSelection {
  let best: ArtDirection = ART_DIRECTIONS[0]!;
  let bestScore = -Infinity;
  let bestHits: string[] = [];

  for (const direction of ART_DIRECTIONS) {
    let score = 0;
    const hits: string[] = [];
    for (const [axis, range] of Object.entries(direction.dnaRanges) as Array<
      [keyof DnaObject, readonly [number, number]]
    >) {
      const value = axes[axis];
      if (typeof value === "number" && value >= range[0] && value <= range[1]) {
        score += 2;
        hits.push(`${String(axis)} in [${range[0]}, ${range[1]}]`);
      } else {
        score -= 1;
      }
    }
    if (direction.materials.includes(axes.material)) {
      score += 3;
      hits.push(`material ${axes.material}`);
    }
    if (direction.motionFeel === axes.motionFeel) {
      score += 1;
      hits.push(`motion ${axes.motionFeel}`);
    }
    if (!direction.profiles || direction.profiles.includes(profile)) {
      score += 1;
    } else {
      score -= 3;
    }
    if (score > bestScore) {
      bestScore = score;
      best = direction;
      bestHits = hits;
    }
  }

  return {
    id: best.id,
    reason:
      bestHits.length > 0
        ? `${best.name}: ${bestHits.slice(0, 3).join("; ")}`
        : `${best.name}: fallback (registry order)`,
  };
}

/** Registry self-validation: font pairs resolve and allow their slots. */
export function validateArtDirectionFonts(): string[] {
  const problems: string[] = [];
  const byId = fontEntriesById();
  for (const direction of ART_DIRECTIONS) {
    const display = byId.get(direction.fonts.display);
    const body = byId.get(direction.fonts.body);
    if (!display) problems.push(`${direction.id}: unknown display font '${direction.fonts.display}'`);
    else if (!display.slots.includes("display")) {
      problems.push(`${direction.id}: display font '${display.id}' disallows the display slot`);
    }
    if (!body) problems.push(`${direction.id}: unknown body font '${direction.fonts.body}'`);
    else if (!body.slots.includes("body")) {
      problems.push(`${direction.id}: body font '${body.id}' disallows the body slot`);
    }
  }
  return problems;
}
