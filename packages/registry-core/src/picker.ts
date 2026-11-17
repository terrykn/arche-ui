/**
 * Staged-picker options (Brief #7, Deliverable 4) — deterministic derivation
 * over ONE structured generation response.
 *
 * The model returns DNA only (Brief #8); plan names and profile are derived
 * by the compiler. Steps 1–3 of the picker present deterministic derivations
 * of that DNA (palette options, example records, word chips); every selection is a DNA
 * delta and recompilation is deterministic and free of model calls. Nothing
 * here calls a model, touches the network, or reads the disk, so the module
 * is safe to bundle client-side.
 *
 * - WORD_CHIPS: descriptive chips mapping directly onto the 8 DNA axes.
 * - derivePaletteOptions: three named palette-anchor options from the
 *   generation's final palette (as-dreamed, surprising, quiet-ground).
 * - EXAMPLE_RECORDS: reference identities for the "which feels closest"
 *   step (palette + typefaces + stack per record).
 * - applyPickerDelta: fold chip + palette selections into DNA + anchors.
 */
import type { DnaAxes, DnaPalette } from "@arche/foundation/dna";

export type DnaAxisKey = keyof DnaAxes;

export interface WordChip {
  id: string;
  label: string;
  /** Axis nudges applied while the chip is active (±, clamped to 0–1). */
  deltas: Partial<Record<DnaAxisKey, number>>;
}

/**
 * Chips ↔ DNA axes. Multiple chips compose by addition, then clamp — the
 * same chips in any order give the same DNA.
 */
export const WORD_CHIPS: WordChip[] = [
  { id: "calm", label: "Calm", deltas: { energy: -0.25, density: -0.15 } },
  { id: "bold", label: "Bold", deltas: { energy: 0.25, sharpness: 0.15 } },
  { id: "playful", label: "Playful", deltas: { playfulness: 0.3, ornament: 0.1 } },
  { id: "premium", label: "Premium", deltas: { formality: 0.25, ornament: 0.15, energy: -0.1 } },
  { id: "retro", label: "Retro", deltas: { playfulness: 0.2, ornament: 0.2 } },
  { id: "warm", label: "Warm", deltas: { warmth: 0.3 } },
  { id: "minimal", label: "Minimal", deltas: { ornament: -0.3, density: -0.2, sharpness: 0.1 } },
  { id: "dense", label: "Dense", deltas: { density: 0.3 } },
];

export interface PaletteOption {
  id: string;
  /** Evocative name shown in the picker (never a bare hex). */
  name: string;
  anchors: DnaPalette;
  reason: string;
}

function normHue(degrees: number): number {
  const wrapped = ((degrees % 360) + 360) % 360;
  return Math.round(wrapped * 10) / 10;
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(normHue(a) - normHue(b)) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Three palette options from the generation's final anchors. Deterministic:
 * same input → same options. Hues only — chroma budgets stay the compiler's
 * job (enforce tier), so options can never widen a registry.
 */
export function derivePaletteOptions(
  palette: DnaPalette,
  profile: "enterprise" | "standard" | "expressive" = "standard",
): [PaletteOption, PaletteOption, PaletteOption] {
  // Brand Token brief: every option carries the brand anchor (defaulted
  // to the primary hue) so the picker can never lose it between steps.
  const base: DnaPalette = {
    primaryHue: normHue(palette.primaryHue),
    accentHue: normHue(palette.accentHue),
    neutralHue: normHue(palette.neutralHue),
    brandHue: normHue(palette.brandHue ?? palette.primaryHue),
  };
  const asDreamed: PaletteOption = {
    id: "as-dreamed",
    name: "As Dreamed",
    anchors: base,
    reason: "The generation's own palette, untouched.",
  };
  if (profile === "enterprise") {
    return [
      asDreamed,
      {
        id: "boardroom-ink",
        name: "Boardroom Ink",
        anchors: { ...base, accentHue: base.primaryHue },
        reason: "Signal red reserved for the wordmark and key numbers — no second family (enterprise profile).",
      },
      {
        id: "quiet-ground",
        name: "Quiet Ground",
        anchors: { ...base, neutralHue: base.primaryHue },
        reason: "Neutrals tinted to the brand hue for a calmer surface.",
      },
    ];
  }
  const surprisingAccent = normHue(base.accentHue + 120);
  const surprising: PaletteOption = {
    id: "surprising",
    name: hueDistance(surprisingAccent, base.primaryHue) >= 90 ? "Loud Signal" : "Near Signal",
    anchors: { ...base, accentHue: surprisingAccent },
    reason: "Accent rotated for contrast against the base pair — the surprise step, scored by the compiler.",
  };
  const quiet: PaletteOption = {
    id: "quiet-ground",
    name: "Quiet Ground",
    anchors: { ...base, neutralHue: base.primaryHue },
    reason: "Neutrals tinted to the brand hue (±15°); the loud pair stays on the CTA and the focal word.",
  };
  return [asDreamed, surprising, quiet];
}

export interface ExampleRecord {
  id: string;
  title: string;
  genre: "landing" | "product" | "auth" | "dashboard";
  palette: DnaPalette;
  typefaces: [string, string];
  stack: string[];
  blurb: string;
}

/**
 * Example-picker corpus model (Brief #7 §7): structured records — palette +
 * typefaces + stack per site. Seed records; the gallery replaces them with
 * real Arche identities without changing the shape.
 */
export const EXAMPLE_RECORDS: ExampleRecord[] = [
  {
    id: "harbor-dental",
    title: "Harbor Dental — booking",
    genre: "landing",
    palette: { primaryHue: 170, accentHue: 20, neutralHue: 170, brandHue: 170 },
    typefaces: ["Sentient", "Satoshi"],
    stack: ["Next.js", "shadcn", "Tailwind"],
    blurb: "Soft-spa booking page: warm neutrals, mist sections, pill CTA.",
  },
  {
    id: "line2-packing",
    title: "Line 2 Packing — product",
    genre: "product",
    palette: { primaryHue: 35, accentHue: 210, neutralHue: 35, brandHue: 35 },
    typefaces: ["Archivo", "Public Sans"],
    stack: ["Next.js", "shadcn", "Tailwind"],
    blurb: "Boardroom product page: signal red CTA, tabular numbers, dense table.",
  },
  {
    id: "cabinet-arcade",
    title: "Cabinet Arcade — auth",
    genre: "auth",
    palette: { primaryHue: 300, accentHue: 140, neutralHue: 300, brandHue: 300 },
    typefaces: ["Space Grotesk", "Work Sans"],
    stack: ["Next.js", "shadcn", "Tailwind"],
    blurb: "CRT sign-in: scanlines, chunky borders, single centered form.",
  },
];

export interface PickerSelections {
  chipIds: string[];
  paletteId: string;
  exampleId?: string;
}

export interface PickerApplied {
  axes: DnaAxes;
  anchors: DnaPalette;
  /** Chips that had no registry entry (ignored, recorded for the draft log). */
  unknownChips: string[];
}

/**
 * Fold picker selections into DNA + anchors. Pure + deterministic: chip
 * order never matters (deltas commute; clamp is idempotent), unknown chips
 * are ignored and reported, and an unknown palette id falls back to the
 * generation's own anchors.
 */
export function applyPickerDelta(
  axes: DnaAxes,
  palette: DnaPalette,
  selections: PickerSelections,
  options: PaletteOption[] = derivePaletteOptions(palette),
): PickerApplied {
  const chipsById = new Map(WORD_CHIPS.map((chip) => [chip.id, chip]));
  const unknownChips: string[] = [];
  const next: DnaAxes = { ...axes };
  const seen = new Set<string>();
  for (const id of selections.chipIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const chip = chipsById.get(id);
    if (!chip) {
      unknownChips.push(id);
      continue;
    }
    for (const [axis, delta] of Object.entries(chip.deltas) as Array<[DnaAxisKey, number]>) {
      next[axis] = Math.min(1, Math.max(0, Math.round((next[axis] + delta) * 1000) / 1000));
    }
  }
  const option = options.find((candidate) => candidate.id === selections.paletteId);
  return { axes: next, anchors: option ? { ...option.anchors } : { ...palette }, unknownChips };
}
