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
 * - deriveBrandOptions: up to five Material 3 brand USAGES for the palette
 *   row (as-dreamed, on primary, muted secondary, tertiary, ink) gated by a
 *   distinctness test — the row picks how the brand participates.
 * - deriveBrandColors: FIVE STATIC brand colors for the brand row, fixed and
 *   independent of any generation. Picking one rebuilds the palette row
 *   from that single hue via paletteFromBrand (a static calculation).
 * - paletteFromBrand: the static palette config calculated from one brand
 *   hue (primary/neutral/brand on the hue, accent a static +60° away).
 * - applyPickerDelta: fold chip + palette usage + brand color into DNA +
 *   anchors. A picked brand color re-bases the anchors on its static
 *   palette; the usage then applies within that palette.
 * - EXAMPLE_RECORDS: reference identities for the "which feels closest"
 *   step (palette + typefaces + stack per record).
 */
import type { DnaAxes, DnaPalette, GenerationProfile } from "@arche/foundation/dna";
import { nameColor } from "@arche/foundation/taste/names";

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
    name: "As Generated",
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

// ---------------------------------------------------------------------------
// Brand options (palette + brand picker brief): brand-only remixes
// ---------------------------------------------------------------------------

/**
 * One palette-row choice: HOW the brand is used in the system. The whole
 * system stays put; only the mark's voice (and its pinned hue) moves. The
 * reason string is stored on the draft (`picker.brandReason`) so a remix is
 * explainable after the fact.
 */
export interface BrandOption {
  id: "as-dreamed" | "brand-primary" | "brand-secondary" | "brand-tertiary" | "brand-ink";
  /** Usage label shown beside the evocative color name. */
  roleLabel: string;
  /** Evocative name from the compiler naming table (never a bare hex). */
  name: string;
  brandHue: number;
  /**
   * Voice multiplier applied to the system chroma when this option
   * compiles: 1 = full voice, 0.45 = Material 3 secondary muting,
   * 0 = neutral ink. The service passes it to the compiler; the picker
   * rows and the draft record the id + reason.
   */
  chromaScale: number;
  /** Recorded reason: as-dreamed | brand-equals-primary | secondary-muted |
   * tertiary-accentHue | tertiary-rotated-60 | tertiary-rotated-120 | ink. */
  reason: string;
}

export interface BrandOptionContext {
  profile?: GenerationProfile;
  /**
   * True when the brief (or the DNA) forces every chroma to zero: hue
   * rotations then emit the identical color, so the distinctness gate
   * collapses them and only "As Dreamed" ships. Brand never breaks
   * monochrome.
   */
  achromatic?: boolean;
}

/** Distinctness gate thresholds (hue degrees, CIEDE2000, lightness). */
const DISTINCT_HUE = 30;
const DISTINCT_LIGHTNESS = 0.15;
/** ΔE₀₀ floor for the OR-gate (15), with an epsilon so float noise cannot
 * flip a value that lands exactly on it. */
const DISTINCT_DELTA_E = 15 - 1e-9;

/**
 * Brand-solid stand-in used by the gate: the compiler emits the brand at
 * step-9 lightness with the system's full-voice chroma. The gate only needs
 * the option hues at one shared voice, so lightness/chroma are held fixed
 * and hue is the variable (chroma 0 under monochrome).
 */
const GATE_LIGHTNESS = 0.56;
const GATE_CHROMA = 0.16;

export interface GateColor {
  l: number;
  c: number;
  h: number;
}

function gateColor(hue: number, achromatic: boolean): GateColor {
  return { l: GATE_LIGHTNESS, c: achromatic ? 0 : GATE_CHROMA, h: normHue(hue) };
}

/** OKLCH → CIE Lab (D65) for the CIEDE2000 gate. */
function oklchToLab({ l, c, h }: GateColor): [number, number, number] {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const r = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  const g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  const bl = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_;
  const x = 0.4123907993 * r + 0.3575843394 * g + 0.1804807884 * bl;
  const y = 0.2126390059 * r + 0.7151686788 * g + 0.0721923154 * bl;
  const z = 0.0193308187 * r + 0.1191947798 * g + 0.9505321522 * bl;
  const f = (t: number): number => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  const fx = f(x / 0.95047);
  const fy = f(y);
  const fz = f(z / 1.08883);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** CIEDE2000 color difference (the brief's ΔE₀₀). */
function deltaE00(first: GateColor, second: GateColor): number {
  const [l1, a1, b1] = oklchToLab(first);
  const [l2, a2, b2] = oklchToLab(second);
  const rad = Math.PI / 180;
  const c1 = Math.hypot(a1, b1);
  const c2 = Math.hypot(a2, b2);
  const cBar = (c1 + c2) / 2;
  const g = 0.5 * (1 - Math.sqrt(cBar ** 7 / (cBar ** 7 + 25 ** 7)));
  const a1p = (1 + g) * a1;
  const a2p = (1 + g) * a2;
  const c1p = Math.hypot(a1p, b1);
  const c2p = Math.hypot(a2p, b2);
  const hueOf = (a: number, b: number): number => {
    if (a === 0 && b === 0) return 0;
    const deg = (Math.atan2(b, a) * 180) / Math.PI;
    return deg >= 0 ? deg : deg + 360;
  };
  const h1p = hueOf(a1p, b1);
  const h2p = hueOf(a2p, b2);
  const dLp = l2 - l1;
  const dCp = c2p - c1p;
  let dhp = 0;
  if (c1p * c2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(c1p * c2p) * Math.sin((dhp * rad) / 2);
  const lBarP = (l1 + l2) / 2;
  const cBarP = (c1p + c2p) / 2;
  let hBarP = h1p + h2p;
  if (c1p * c2p !== 0) {
    if (Math.abs(h1p - h2p) <= 180) hBarP = (h1p + h2p) / 2;
    else if (h1p + h2p < 360) hBarP = (h1p + h2p + 360) / 2;
    else hBarP = (h1p + h2p - 360) / 2;
  }
  const t =
    1 -
    0.17 * Math.cos((hBarP - 30) * rad) +
    0.24 * Math.cos(2 * hBarP * rad) +
    0.32 * Math.cos((3 * hBarP + 6) * rad) -
    0.2 * Math.cos((4 * hBarP - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hBarP - 275) / 25) ** 2));
  const rc = 2 * Math.sqrt(cBarP ** 7 / (cBarP ** 7 + 25 ** 7));
  const sl = 1 + (0.015 * (lBarP - 50) ** 2) / Math.sqrt(20 + (lBarP - 50) ** 2);
  const sc = 1 + 0.045 * cBarP;
  const sh = 1 + 0.015 * cBarP * t;
  const rt = -Math.sin(2 * dTheta * rad) * rc;
  return Math.sqrt(
    (dLp / sl) ** 2 + (dCp / sc) ** 2 + (dHp / sh) ** 2 + rt * (dCp / sc) * (dHp / sh),
  );
}

export interface Distinctness {
  hue: number;
  deltaE: number;
  lightness: number;
  distinct: boolean;
}

/**
 * ΔH ≥ 30° OR ΔE₀₀ ≥ 15 OR ΔL ≥ 0.15 makes two colors two choices; below
 * all three they collapse into one (deduplicated out of the picker).
 */
export function brandDistinctness(a: GateColor, b: GateColor): Distinctness {
  // Two achromatic colors are the same color whatever their hue numbers say
  // (monochrome: hue carries no signal), so ΔH contributes nothing.
  const hue = a.c === 0 || b.c === 0 ? 0 : hueDistance(a.h, b.h);
  const deltaE = deltaE00(a, b);
  const lightness = Math.abs(a.l - b.l);
  return {
    hue,
    deltaE, // computed for the record; only the boolean is contractual
    lightness,
    distinct: hue >= DISTINCT_HUE || deltaE >= DISTINCT_DELTA_E || lightness >= DISTINCT_LIGHTNESS,
  };
}

/** Material 3 secondary muting: same hue at 0.45× the voice chroma. */
const SECONDARY_SCALE = 0.45;
/** Chroma leg: the muted mark is its own choice once the muting gap ≥ 0.05. */
const SECONDARY_GAP = 0.05;

/**
 * Distinctness for brand-slot derivation: the shared gate, plus a chroma
 * leg for the muted secondary. A same-hue mark at half chroma or less is
 * its own choice once the muting is absolute enough to see; on an
 * already-muted identity it collapses onto primary instead — correct, not
 * a bug. Full-voice pairs never take the leg (ratio 1), so every other
 * slot follows the shared gate exactly.
 */
function slotDistinct(a: GateColor, b: GateColor): boolean {
  if (brandDistinctness(a, b).distinct) return true;
  if (hueDistance(a.h, b.h) >= DISTINCT_HUE) return false;
  const hi = Math.max(a.c, b.c);
  const lo = Math.min(a.c, b.c);
  return hi > 0 && lo / hi <= 0.5 && hi - lo >= SECONDARY_GAP;
}

/**
 * Brand-only options from the generation's own anchors, deterministic and
 * model-free (Material 3 brand slots, order fixed, dedup preserves order):
 *
 * 1. As Dreamed — the model's `brandHue`, untouched, full voice.
 * 2. Brand = Primary — `brandHue := primaryHue` (the unified T-Mobile
 *    pattern), full voice.
 * 3. Brand = Secondary — same hue as primary at 0.45× chroma (the muted
 *    mark: same family, quieter).
 * 4. Brand = Tertiary — `accentHue` when it clears the distinctness gate vs
 *    primary, else `primaryHue + 60°`, else `primaryHue + 120°`.
 * 5. Brand = Ink — C = 0 neutral ink (the mark-only black/gray pattern);
 *    its hue anchor rests on primary so hue-spread and hero-CTA affinity
 *    stay sane.
 *
 * Deduplication: an option that collapses onto one already kept (all three
 * of ΔH < 30°, ΔE₀₀ < 15, ΔL < 0.15) is hidden — two identical choices are
 * never shown. Under an achromatic brief every hue emits the same gray, so
 * only As Dreamed ships (brand never breaks monochrome).
 */
export function deriveBrandOptions(
  palette: DnaPalette,
  context: BrandOptionContext = {},
): BrandOption[] {
  const profile = context.profile ?? "standard";
  const achromatic = context.achromatic === true;
  const primaryHue = normHue(palette.primaryHue);
  const accentHue = normHue(palette.accentHue);
  const dreamedHue = normHue(palette.brandHue ?? palette.primaryHue);
  const colorOf = (hue: number, scale = 1): GateColor => ({
    l: GATE_LIGHTNESS,
    c: achromatic || scale === 0 ? 0 : GATE_CHROMA * scale,
    h: normHue(hue),
  });
  const option = (
    id: BrandOption["id"],
    roleLabel: string,
    brandHue: number,
    scale: number,
    reason: string,
  ): BrandOption => ({
    id,
    roleLabel,
    name: nameColor(
      achromatic || scale === 0
        ? `oklch(0.56 0 0)`
        : `oklch(0.56 ${GATE_CHROMA * scale} ${normHue(brandHue)})`,
    ),
    brandHue: normHue(brandHue),
    chromaScale: scale,
    reason,
  });
  const kept: BrandOption[] = [option("as-dreamed", "As Dreamed", dreamedHue, 1, "as-dreamed")];
  // Usage labels read as answers to "how is the brand used?" — the palette
  // row, not a color list.

  const gateOf = (entry: BrandOption): GateColor => colorOf(entry.brandHue, entry.chromaScale);
  const collapsesOntoKept = (candidate: GateColor): boolean =>
    kept.some((entry) => !slotDistinct(candidate, gateOf(entry)));
  const primaryGate = colorOf(primaryHue);
  // Brand = Primary: hidden when the dreamed brand already sits on primary.
  if (!collapsesOntoKept(primaryGate)) {
    kept.push(option("brand-primary", "On Primary", primaryHue, 1, "brand-equals-primary"));
  }
  // Brand = Secondary: hidden when the muting would be invisible (an
  // already-muted identity) or when it collapses onto a kept option.
  const secondaryGate = colorOf(primaryHue, SECONDARY_SCALE);
  if (!collapsesOntoKept(secondaryGate)) {
    kept.push(option("brand-secondary", "Muted", primaryHue, SECONDARY_SCALE, "secondary-muted"));
  }
  // Brand = Tertiary: the accent family when it clears the gate vs
  // primary, else the M3 +60°/+120° rotations. Enterprise has no accent
  // family, so it starts at the rotations (the brand stays exempt from
  // the accent-collapse rule; it is simply never the accent).
  const tertiaryCandidates: Array<[number, string]> = [];
  if (profile !== "enterprise") tertiaryCandidates.push([accentHue, "tertiary-accentHue"]);
  tertiaryCandidates.push(
    [primaryHue + 60, "tertiary-rotated-60"],
    [primaryHue + 120, "tertiary-rotated-120"],
  );
  for (const [hue, reason] of tertiaryCandidates) {
    const candidate = colorOf(hue);
    if (!slotDistinct(candidate, primaryGate)) continue;
    if (collapsesOntoKept(candidate)) continue;
    kept.push(option("brand-tertiary", "Tertiary", hue, 1, reason));
    break;
  }
  // Brand = Ink: hidden only when an earlier kept option is already gray.
  const inkGate = colorOf(primaryHue, 0);
  if (!collapsesOntoKept(inkGate)) {
    kept.push(option("brand-ink", "Ink", primaryHue, 0, "ink"));
  }
  return kept;
}

/**
 * One brand-row choice: a single STATIC color, independent of any
 * generation. The palette row decides how the mark is used (voice,
 * pinning) — but the row itself is rebuilt from whichever of these five
 * hues is picked, so the color drives the palettes, never the reverse.
 */
export interface BrandColorOption {
  id: "brand-crimson" | "brand-amber" | "brand-jade" | "brand-azure" | "brand-violet";
  /** Fixed evocative name (never a hex, never derived per generation). */
  name: string;
  brandHue: number;
}

/**
 * The brand row: exactly five fixed colors, in wheel order, identical for
 * every generation. Static by design — the brand is the independent input
 * and the palettes are calculated from it, so the row must never move with
 * the model's output.
 */
export function deriveBrandColors(): BrandColorOption[] {
  return [
    { id: "brand-crimson", name: "Crimson Signal", brandHue: 15 },
    { id: "brand-amber", name: "Golden Hour", brandHue: 55 },
    { id: "brand-jade", name: "Jade Current", brandHue: 160 },
    { id: "brand-azure", name: "Azure Drift", brandHue: 225 },
    { id: "brand-violet", name: "Violet Static", brandHue: 290 },
  ];
}

/** Validate a round-tripped brand id against the static row (never trust the client). */
export function resolveBrandColor(id: string | undefined | null): BrandColorOption | undefined {
  if (!id) return undefined;
  return deriveBrandColors().find((color) => color.id === id);
}

/** Static tertiary offset: the accent sits +60° off the brand hue (the M3 tertiary slot). */
const BRAND_ACCENT_OFFSET = 60;

/**
 * The static palette config calculated from a single brand hue — the
 * whole system derived from one color, independent of any generation:
 * primary, neutral ground, and mark all sit on the hue; the accent sits a
 * static +60° away so the tertiary usage always has somewhere to go.
 */
export function paletteFromBrand(brandHue: number): DnaPalette {
  const hue = normHue(brandHue);
  return {
    primaryHue: hue,
    accentHue: normHue(hue + BRAND_ACCENT_OFFSET),
    neutralHue: hue,
    brandHue: hue,
  };
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
  /** Palette-row usage; absent keeps the palette option's brand anchor. */
  brandId?: string;
  /** Brand-row color; when known it wins over the usage's pinned hue. */
  brandColorId?: string;
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
 * and unknown brand ids are ignored and reported, and an unknown palette id
 * falls back to the generation's own anchors. A picked brand color re-bases
 * the anchors on its static palette (independent of the generation); the
 * palette usage then applies within that palette. No color picked means the
 * generation's own anchors — the model's output reproduces exactly.
 */
export function applyPickerDelta(
  axes: DnaAxes,
  palette: DnaPalette,
  selections: PickerSelections,
  options: PaletteOption[] = derivePaletteOptions(palette),
  brandOptions: BrandOption[] = deriveBrandOptions(palette),
  brandColors: BrandColorOption[] = deriveBrandColors(),
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
  const color = selections.brandColorId
    ? brandColors.find((candidate) => candidate.id === selections.brandColorId)
    : undefined;
  // A picked brand color re-bases the whole system on its static palette —
  // the palettes are generated from the single brand color, independent of
  // the generation. Otherwise the palette option's own anchors stand.
  const option = options.find((candidate) => candidate.id === selections.paletteId);
  const anchors: DnaPalette = color
    ? { ...paletteFromBrand(color.brandHue) }
    : option
      ? { ...option.anchors }
      : { ...palette };
  // Usage last: it sets the mark's voice and pinned hue within the (possibly
  // brand-derived) system.
  const brand = selections.brandId
    ? brandOptions.find((candidate) => candidate.id === selections.brandId)
    : undefined;
  if (brand) {
    anchors.brandHue = brand.brandHue;
  }
  return { axes: next, anchors, unknownChips };
}
