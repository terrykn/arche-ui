import type { ArcheIdentity } from "./index.js";

/**
 * Presentation guidance (Brief Part 5.2): teaches consuming agents how to
 * *present* an identity, not just its values. Deterministic — pure function
 * of the payload (+ asset URL convention). Zero model calls.
 */
export interface PresentationMotion {
  feel: string;
  durationFast: string | null;
  durationNormal: string | null;
  guidance: string[];
}

export interface TasteSummary {
  directionId: string;
  directionName: string;
  directionReason: string;
  surpriseScore: number;
  surpriseBand: string;
  palette: Array<{ name: string; role: string }>;
}

export interface PresentationBlock {
  imagery: string;
  motion: PresentationMotion;
  /** Versioned render assets (null when the caller cannot address storage). */
  specimens: { sinkLight: string; sinkDark: string; og: string } | null;
  /** Anti-slop calibration: rule ids + one line each, scoped to the profile. */
  antiSlop: Array<{ rule: string; guidance: string }>;
  /** Taste record read off the payload (null for hand-authored payloads). */
  taste: TasteSummary | null;
  note: string;
}

const IMAGERY_BY_MATERIAL: Record<string, string> = {
  flat: "Flat color fields only — no photography treatments, no gradients, no texture overlays.",
  paper: "Paper grain allowed at low opacity over neutral surfaces; keep all text on flat areas.",
  glass: "Frosted-glass panels may sit over content backdrops; never place body text over busy imagery.",
  metal: "Brushed-metal accents on large surfaces only; keep functional surfaces matte for contrast.",
  marble: "Marble veining as hero/backdrop treatment only; content panels stay flat.",
  pixel: "Pixel-art accents with hard edges; no gradients and no soft shadows anywhere.",
  clay: "Soft clay shapes at low opacity, at most one per view; content panels stay flat.",
};

const MOTION_GUIDANCE_BY_FEEL: Record<string, string[]> = {
  snappy: ["Fast in/out transitions on the identity's own duration tokens.", "One orchestrated moment per view at most."],
  smooth: ["Ease between states on the identity's duration tokens; avoid abrupt cuts.", "One orchestrated moment per view at most."],
  bouncy: ["Playful overshoot reserved for decorative layers; content settles without bounce.", "One orchestrated moment per view at most."],
  stately: ["Slower, deliberate transitions; never rush content changes.", "One orchestrated moment per view at most."],
  glitchy: ["Glitch accents on decorative layers only — never on content, text, or focus states.", "One orchestrated moment per view at most."],
};

const ANTI_SLOP_BY_PROFILE: Record<string, Array<{ rule: string; guidance: string }>> = {
  enterprise: [
    { rule: "slop-color-tells", guidance: "No purple-blue glow accents, no gradient headline text." },
    { rule: "color-one-accent", guidance: "Saturated color spent in exactly one place per view." },
    { rule: "taste-accent-placement", guidance: "Accent on the primary CTA and the focal word only." },
    { rule: "type-weight-discipline", guidance: "Hierarchy from size and weight, never from color." },
  ],
  standard: [
    { rule: "slop-color-tells", guidance: "No purple-blue glow accents, no gradient headline text." },
    { rule: "color-one-accent", guidance: "Saturated color spent in exactly one place per view." },
    { rule: "taste-accent-placement", guidance: "Accent on the primary CTA and the focal word only." },
    { rule: "type-measure", guidance: "Prose measure 65–75ch; headlines under ~80 chars." },
  ],
  expressive: [
    { rule: "slop-color-tells", guidance: "Exuberance allowed in layout and motion, not in glow effects or gradient text." },
    { rule: "taste-accent-placement", guidance: "Accent on the primary CTA and the focal word only." },
    { rule: "color-chroma-taper", guidance: "Chroma tapers toward surfaces; text pairings stay AA." },
    { rule: "type-display-cap", guidance: "Display sizes capped per profile — check the type scale, not taste." },
  ],
};

function tokenPair(tokens: ArcheIdentity["tokens"], name: string): { duration: string; easing: string } | null {
  for (const mode of ["light", "dark"]) {
    const v = (tokens?.[mode] as Record<string, unknown> | undefined)?.[name] as
      | { $value?: unknown }
      | undefined;
    const inner = (v?.$value ?? v) as { duration?: unknown; easing?: unknown } | undefined;
    if (inner && typeof inner.duration === "string") {
      return {
        duration: inner.duration,
        easing: typeof inner.easing === "string" ? inner.easing : "ease",
      };
    }
  }
  return null;
}

export interface PresentationContext {
  /** Public storage base, e.g. https://xyz.supabase.co/storage/v1/object/public/identity-assets */
  assetBaseUrl?: string;
  /** Storage owner id (library uuid) scoping the versioned assets. */
  libraryId?: string;
  /** Version the guidance describes. */
  version?: number | null;
}

export function buildPresentation(payload: ArcheIdentity, ctx: PresentationContext = {}): PresentationBlock {
  const dna = (payload.dna ?? {}) as {
    profile?: string;
    axes?: { material?: string; motionFeel?: string };
  };
  const profile = dna.profile === "enterprise" || dna.profile === "expressive" ? dna.profile : "standard";
  // Material/feel live under dna.axes (the compiler stamps them there); the
  // top-level read is kept as a fallback for older payload shapes.
  const axes = dna.axes ?? {};
  const material =
    typeof axes.material === "string"
      ? axes.material
      : typeof (dna as { material?: unknown }).material === "string"
        ? (dna as { material?: string }).material!
        : "flat";
  const feel =
    typeof axes.motionFeel === "string"
      ? axes.motionFeel
      : typeof (dna as { motionFeel?: unknown }).motionFeel === "string"
        ? (dna as { motionFeel?: string }).motionFeel!
        : "smooth";

  const fast = tokenPair(payload.tokens, "--motion-fast");
  const normal = tokenPair(payload.tokens, "--motion-normal");

  const specimens =
    ctx.assetBaseUrl && ctx.libraryId && ctx.version != null
      ? {
          sinkLight: `${ctx.assetBaseUrl}/${ctx.libraryId}/v${ctx.version}/sink-light.png`,
          sinkDark: `${ctx.assetBaseUrl}/${ctx.libraryId}/v${ctx.version}/sink-dark.png`,
          og: `${ctx.assetBaseUrl}/${ctx.libraryId}/v${ctx.version}/og.png`,
        }
      : null;

  const tasteRaw = (payload.meta ?? {}) as Record<string, unknown>;
  const tasteRecord = tasteRaw.taste as
    | {
        artDirection?: { id?: unknown; name?: unknown; reason?: unknown };
        surprise?: { score?: unknown; band?: unknown };
        palette?: Array<{ name?: unknown; role?: unknown }>;
      }
    | undefined;
  const taste: TasteSummary | null =
    tasteRecord?.artDirection && typeof tasteRecord.artDirection.id === "string"
      ? {
          directionId: tasteRecord.artDirection.id,
          directionName:
            typeof tasteRecord.artDirection.name === "string" ? tasteRecord.artDirection.name : tasteRecord.artDirection.id,
          directionReason:
            typeof tasteRecord.artDirection.reason === "string" ? tasteRecord.artDirection.reason : "",
          surpriseScore:
            typeof tasteRecord.surprise?.score === "number" ? tasteRecord.surprise.score : NaN,
          surpriseBand: typeof tasteRecord.surprise?.band === "string" ? tasteRecord.surprise.band : "unknown",
          palette: Array.isArray(tasteRecord.palette)
            ? tasteRecord.palette.flatMap((entry) =>
                typeof entry?.name === "string" && typeof entry?.role === "string"
                  ? [{ name: entry.name, role: entry.role }]
                  : [],
              )
            : [],
        }
      : null;

  return {
    imagery: IMAGERY_BY_MATERIAL[material] ?? IMAGERY_BY_MATERIAL.flat!,
    motion: {
      feel,
      durationFast: fast ? `${fast.duration} ${fast.easing}` : null,
      durationNormal: normal ? `${normal.duration} ${normal.easing}` : null,
      guidance: [
        ...(MOTION_GUIDANCE_BY_FEEL[feel] ?? MOTION_GUIDANCE_BY_FEEL.smooth!),
        "Focus-ring behavior is fixed and never part of motion styling.",
        "Honor prefers-reduced-motion: disable swap transitions and scroll-linked effects.",
      ],
    },
    specimens,
    antiSlop: ANTI_SLOP_BY_PROFILE[profile]!,
    taste,
    note: payload.dna
      ? `Generated for the '${profile}' profile from payload values and design rules — no model call.`
      : "Hand-authored payload (no DNA) — profile guidance defaults to 'standard'.",
  };
}
