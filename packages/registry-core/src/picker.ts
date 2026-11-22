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
 * - deriveBrandStrategies: the three palette-row STRATEGIES (unified,
 *   mark-only, accent) from any brand hue — the row picks how the brand
 *   participates, and each strategy is the whole system derived from
 *   that hue.
 * - deriveBrandColors: FIVE STATIC brand colors for the brand row, fixed and
 *   independent of any generation. Picking one rebuilds the palette row
 *   from that single hue via paletteFromBrand (a static calculation).
 * - paletteFromBrand: the static palette config calculated from one brand
 *   hue (primary/neutral/brand on the hue, accent a static +60° away) —
 *   legacy helper, superseded by strategy derivation.
 * - applyPickerDelta: fold chip + palette usage + brand strategy into DNA
 *   + anchors. A picked strategy replaces the anchors wholesale.
 * - EXAMPLE_RECORDS: reference identities for the "which feels closest"
 *   step (palette + typefaces + stack per record).
 */
import type { DnaAxes, DnaObject, DnaPalette, GenerationProfile } from "@arche/foundation/dna";
import { dnaEnums } from "@arche/foundation/dna";
import { nameColor } from "@arche/foundation/taste/names";
import type { BrandStrategyId, WordsBorderWidth } from "./compiler.js";

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

/**
 * Words-step chips (creation flow). Color and type are already picked by
 * then, so these nudge ONLY sharpness (corners, border weight) and density
 * (spacing/size) — neither axis feeds the color voice, the chroma budget,
 * or the typeface pick, so the words step can never redo those choices.
 * Shadows stay as generated (material-driven) and remain tunable after
 * creation.
 */
export const STRUCTURE_CHIPS: WordChip[] = [
  { id: "rounded", label: "Rounded", deltas: { sharpness: -0.3 } },
  { id: "angular", label: "Angular", deltas: { sharpness: 0.3 } },
  { id: "airy", label: "Airy", deltas: { density: -0.3 } },
  { id: "compact", label: "Compact", deltas: { density: 0.3 } },
];

/**
 * The four working-state traits the describe-in-words step owns. Color and
 * type are already picked by then, so no word writes the color voice
 * (warmth/chroma/energy/playfulness/formality) — only shape and surface.
 */
export type WordProperty = "shadow" | "borders" | "roundedness" | "spacing";

export interface DescribeWord {
  id: string;
  label: string;
  /** The traits this word writes into the working state (the rest it leaves alone). */
  properties: Partial<Record<WordProperty, string>>;
}

/**
 * Describe-in-words vocabulary (creation flow). Each word writes its own
 * traits into a shared working state; NOTHING is averaged. When two picked
 * words write the same trait, the later pick overwrites the earlier one —
 * Soft + Sharp never yields medium corners, whichever was picked last owns
 * the radius. A word that loses every trait to later picks deselects
 * itself; removing the winner restores the earlier word's values.
 */
export const DESCRIBE_WORDS: DescribeWord[] = [
  { id: "calm", label: "Calm", properties: { shadow: "subtle", spacing: "spacious" } },
  { id: "bold", label: "Bold", properties: { borders: "thick", roundedness: "sharp" } },
  { id: "playful", label: "Playful", properties: { roundedness: "bubbly", shadow: "lifted" } },
  { id: "minimal", label: "Minimal", properties: { shadow: "flat", borders: "invisible" } },
  { id: "soft", label: "Soft", properties: { roundedness: "pillowy", shadow: "gentle" } },
  { id: "sharp", label: "Sharp", properties: { roundedness: "square", borders: "defined" } },
  { id: "spacious", label: "Spacious", properties: { spacing: "roomy", borders: "hairline" } },
  { id: "compact", label: "Compact", properties: { spacing: "dense", shadow: "flat" } },
  { id: "flat", label: "Flat", properties: { shadow: "none", borders: "hairline" } },
];

/** roundedness → sharpness axis (absolute: later pick replaces, never averages). */
const ROUNDNESS_TO_SHARPNESS: Record<string, number> = {
  pillowy: 0.1,
  bubbly: 0.3,
  sharp: 0.8,
  square: 1,
};

/** spacing → density axis (absolute). */
const SPACING_TO_DENSITY: Record<string, number> = {
  spacious: 0.15,
  roomy: 0.3,
  dense: 0.85,
};

/**
 * shadow → material (+ ornament for the flat family, which keys its shadow
 * target off ornament). Subtle and gentle share the soft paper shadow —
 * the words differ in their companion traits. Every material here is
 * type-neutral (pixel is never written: it would flip the typeface pick).
 * Ornament is only ever lowered, never raised past the type/icon gates.
 */
const SHADOW_TO_SURFACE: Record<string, { material: DnaObject["material"]; ornament?: number }> = {
  none: { material: "flat", ornament: 0 },
  flat: { material: "flat", ornament: 0.25 },
  subtle: { material: "paper" },
  gentle: { material: "paper" },
  lifted: { material: "clay" },
};

export interface ResolvedWords {
  /** Winning value + owner per trait (null when no picked word writes it). */
  slots: Record<WordProperty, { wordId: string; value: string } | null>;
  /** Picked words that still own at least one trait, in pick order. */
  activeIds: string[];
  /** Absolute axis writes from the winning slot values (material included). */
  axes: { sharpness?: number; density?: number; material?: DnaObject["material"]; ornament?: number };
  /** Winning borders voice (resolved per profile at emission). */
  borderWidth?: WordsBorderWidth;
  /** Word ids with no vocabulary entry (ignored, recorded for the draft log). */
  unknownWords: string[];
}

/**
 * Replay a pick history (oldest → newest) into the working state. Pure +
 * deterministic: the same order always yields the same slots. Later picks
 * overwrite earlier ones per trait; nothing composes, nothing averages.
 */
export function resolveDescribeWords(wordOrder: string[]): ResolvedWords {
  const byId = new Map(DESCRIBE_WORDS.map((word) => [word.id, word]));
  const slots: ResolvedWords["slots"] = { shadow: null, borders: null, roundedness: null, spacing: null };
  const unknownWords: string[] = [];
  const seen = new Set<string>();
  const order: string[] = [];
  for (const id of wordOrder) {
    if (seen.has(id)) continue;
    seen.add(id);
    const word = byId.get(id);
    if (!word) {
      unknownWords.push(id);
      continue;
    }
    order.push(id);
    for (const [trait, value] of Object.entries(word.properties) as Array<[WordProperty, string]>) {
      slots[trait] = { wordId: id, value };
    }
  }
  const owned = new Set<string>();
  for (const slot of Object.values(slots)) {
    if (slot) owned.add(slot.wordId);
  }
  const activeIds = order.filter((id) => owned.has(id));
  const axes: ResolvedWords["axes"] = {};
  const roundedness = slots.roundedness?.value;
  if (roundedness !== undefined && roundedness in ROUNDNESS_TO_SHARPNESS) {
    axes.sharpness = ROUNDNESS_TO_SHARPNESS[roundedness]!;
  }
  const spacing = slots.spacing?.value;
  if (spacing !== undefined && spacing in SPACING_TO_DENSITY) {
    axes.density = SPACING_TO_DENSITY[spacing]!;
  }
  const shadow = slots.shadow?.value;
  if (shadow !== undefined && shadow in SHADOW_TO_SURFACE) {
    const surface = SHADOW_TO_SURFACE[shadow]!;
    axes.material = surface.material;
    if (surface.ornament !== undefined) axes.ornament = surface.ornament;
  }
  let borderWidth: WordsBorderWidth | undefined;
  const borders = slots.borders?.value;
  if (borders === "invisible" || borders === "hairline" || borders === "defined" || borders === "thick") {
    borderWidth = borders;
  }
  return { slots, activeIds, axes, borderWidth, unknownWords };
}

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
export interface BrandStrategy {
  id: BrandStrategyId;
  /** Usage label: Unified | Mark only | Accent. */
  roleLabel: string;
  /** Evocative name of the emitted brand solid (never a bare hex). */
  name: string;
  /** Final mark hue (post-rotation for the accent strategy). */
  brandHue: number;
  /**
   * Compiler flag: HOW the brand participates. The service passes it as
   * `brandStrategy`; the compiler rebuilds the structural roles around
   * the mark (unified = brand IS primary, mark-only = achromatic
   * structure, accent = dark desaturated structure + vivid mark).
   */
  strategy: BrandStrategyId;
  /** Full system anchors for this strategy, derived from the brand hue. */
  anchors: DnaPalette;
  /** Recorded reason: unified-brand-equals-primary |
   * mark-only-ink-primary | accent-direct | accent-rotated-60 |
   * accent-rotated-120. */
  reason: string;
}

export interface BrandStrategyContext {
  profile?: GenerationProfile;
  /**
   * True when the brief (or the DNA) forces every chroma to zero: every
   * strategy emits the same gray, so only Unified ships. Brand never
   * breaks monochrome.
   */
  achromatic?: boolean;
  /**
   * Explicit structural hue override (tests only): the accent structure
   * builds from this instead of the brand hue, so the rotation cascade
   * can be exercised. Production always omits it — structure derives
   * from the winning brand hue, so switching brand rebuilds all three.
   */
  structuralHue?: number;
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

/**
 * The three palette-row strategies from ANY brand hue — deterministic and
 * model-free, order fixed (unified, mark-only, accent):
 *
 * 1. Unified (T-Mobile) — brand IS primary. One calculation:
 *    `brandHue := primaryHue`. A single scale feeds both: --brand and
 *    --primary emit the same solid, secondary rides the same hue at
 *    0.45× chroma. The distinctness check is skipped on purpose — they
 *    are the same color by design.  * 2. Mark-only (Verizon) — the mark is scarce signal. Primary/secondary
  *    compile achromatic (near-black buttons in light mode, near-white in
  *    dark) while the brand stays full voice on its hue; accent is the
  *    brand lifted one ladder step (same hue, slightly lighter signal
  *    highlights), never derived from the ink primary.
 *    Neutrals keep the voice's warmth tint (40–60° by warmth).
 * 3. Accent (Stripe) — the brand is the highlight. The structure is the
 *    dark desaturated sibling of the mark hue (same family, near-navy of
 *    H at ~0.45× chroma and a darker/lighter step per mode) while
 *    brand/accent carry the full-voice hue. The gate compares the actual
 *    emitted pair (vivid mark at step 8 vs dusty structure at step 10
 *    light / step 4 dark), so same-family structure is distinct by
 *    lightness; only a true collapse rotates the mark +60° (Material 3
 *    tertiary rule), then +120°, first distinct hue wins.
 *
 * Under an achromatic brief every strategy emits the same gray, so only
 * Unified ships (brand never breaks monochrome).
 */
export function deriveBrandStrategies(
  brandHue: number,
  context: BrandStrategyContext = {},
): BrandStrategy[] {
  const H = normHue(brandHue);
  const achromatic = context.achromatic === true;
  const structural = normHue(context.structuralHue ?? H);
  const markName = (hue: number): string =>
    nameColor(achromatic ? `oklch(0.56 0 0)` : `oklch(0.56 ${GATE_CHROMA} ${normHue(hue)})`);
  if (achromatic) {
    const anchors: DnaPalette = { primaryHue: H, accentHue: H, neutralHue: H, brandHue: H };
    return [
      {
        id: "unified",
        roleLabel: "Unified",
        name: markName(H),
        brandHue: H,
        strategy: "unified",
        anchors,
        reason: "unified-brand-equals-primary",
      },
    ];
  }
  const unified: BrandStrategy = {
    id: "unified",
    roleLabel: "Unified",
    name: markName(H),
    brandHue: H,
    strategy: "unified",
    anchors: { primaryHue: H, accentHue: H, neutralHue: H, brandHue: H },
    reason: "unified-brand-equals-primary",
  };
  const markOnly: BrandStrategy = {
    id: "mark-only",
    roleLabel: "Mark only",
    name: markName(H),
    brandHue: H,
    strategy: "mark-only",
    anchors: { primaryHue: H, accentHue: H, neutralHue: H, brandHue: H },
    reason: "mark-only-ink-primary",
  };
  // Accent: same-family structure (dark dusty H) vs vivid mark (step 8).
  // The gate compares the actual emitted pair — light mode shown (dark
  // mode separates further) — so same-hue structure is distinct by
  // lightness and ships direct; only a true collapse rotates the mark.
  const primaryGateLight: GateColor = { l: 0.38, c: GATE_CHROMA * 0.45, h: structural };
  const accentCandidates: Array<[number, string]> = [
    [H, "accent-direct"],
    [H + 60, "accent-rotated-60"],
    [H + 120, "accent-rotated-120"],
  ];
  let accentHue = H;
  let accentReason = "accent-direct";
  for (const [hue, reason] of accentCandidates) {
    if (brandDistinctness({ l: GATE_LIGHTNESS, c: GATE_CHROMA, h: normHue(hue) }, primaryGateLight).distinct) {
      accentHue = normHue(hue);
      accentReason = reason;
      break;
    }
  }
  // Production omits structuralHue so structure derives from the winning
  // brand hue (structHue = H): every brand switch rebuilds this strategy.
  // An explicit structuralHue (tests only) pins the structure instead, so
  // the rotation cascade can be exercised.
  const accent: BrandStrategy = {
    id: "accent",
    roleLabel: "Accent",
    name: markName(accentHue),
    brandHue: accentHue,
    strategy: "accent",
    anchors: { primaryHue: structural, accentHue, neutralHue: structural, brandHue: accentHue },
    reason: accentReason,
  };
  return [unified, markOnly, accent];
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

/**
 * Minimum hue separation between two brand-row tiles. Matches the
 * distinctness gate (ΔH ≥ 30°): anything closer reads as the same color
 * on small swatches.
 */
const BRAND_ROW_MIN_HUE = 30;

/**
 * The brand row for one preview: the five static colors curated against
 * the dreamed hue. A static color sitting within 30° of the dreamed mark
 * would render as a near-duplicate tile, so it is replaced — same slot id,
 * replacement hue from the offset cascade (complement first), verified
 * ≥30° from the dreamed hue and every other tile. Deterministic: same
 * dreamed hue → same row, and a dreamed hue clear of the wheel returns
 * the static row untouched. The Generated tile (the dreamed hue itself,
 * always default-selected) is never moved — curation only moves the
 * alternatives around it.
 */
export function curateBrandColors(dreamedHue: number): BrandColorOption[] {
  const H = normHue(dreamedHue);
  const base = deriveBrandColors();
  const placed: number[] = [];
  return base.map((color) => {
    if (hueDistance(color.brandHue, H) >= BRAND_ROW_MIN_HUE) {
      placed.push(color.brandHue);
      return color;
    }
    const others = base.filter((entry) => entry.id !== color.id).map((entry) => entry.brandHue);
    for (const offset of [180, 150, 210, 120, 240, 90, 270]) {
      const candidate = normHue(color.brandHue + offset);
      if (hueDistance(candidate, H) < BRAND_ROW_MIN_HUE) continue;
      if ([...others, ...placed].some((hue) => hueDistance(candidate, hue) < BRAND_ROW_MIN_HUE)) continue;
      placed.push(candidate);
      return { ...color, brandHue: candidate };
    }
    placed.push(color.brandHue);
    return color;
  });
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
  /**
   * Describe-in-words pick history (oldest → newest). Resolved by
   * last-pick-wins per trait AFTER the legacy chip deltas, so words
   * overwrite — creation flow only; the staged Studio flow never sends it
   * and keeps pure legacy behavior.
   */
  wordOrder?: string[];
  paletteId: string;
  /** Palette-row strategy; absent keeps the palette option's anchors. */
  brandId?: string;
  /**
   * Brand-row color id. Resolved by the caller (service) into strategy
   * derivation — the strategies already carry the winning hue, so the
   * fold itself ignores this field.
   */
  brandColorId?: string;
  /**
   * Custom brand hue (degrees, from the color-picker tile). Same contract
   * as brandColorId: the caller derives strategies from it; ignored here.
   */
  customBrandHue?: number;
  exampleId?: string;
}

export interface PickerApplied {
  axes: DnaAxes & { material?: DnaObject["material"] };
  anchors: DnaPalette;
  /** Chips that had no registry entry (ignored, recorded for the draft log). */
  unknownChips: string[];
  /** Winning borders voice from the word history (absent when no word writes borders). */
  borderWidth?: WordsBorderWidth;
}

/**
 * Fold picker selections into DNA + anchors. Pure + deterministic: chip
 * order never matters (deltas commute; clamp is idempotent), unknown chips
 * and unknown brand ids are ignored and reported, and an unknown palette id
 * falls back to the generation's own anchors. A picked palette-row strategy
 * replaces the anchors wholesale — each strategy IS the whole system derived
 * from the brand hue (the caller derives the strategies from the winning
 * hue: custom picker hex, else fixed brand row, else the dreamed brand).
 * No strategy picked means the palette option's own anchors — the model's
 * output reproduces exactly.
 */
export function applyPickerDelta(
  axes: DnaAxes & { material?: DnaObject["material"] },
  palette: DnaPalette,
  selections: PickerSelections,
  options: PaletteOption[] = derivePaletteOptions(palette),
  brandOptions: BrandStrategy[] = deriveBrandStrategies(
    normHue(palette.brandHue ?? palette.primaryHue),
    { structuralHue: normHue(palette.primaryHue) },
  ),
): PickerApplied {
  const chipsById = new Map([...WORD_CHIPS, ...STRUCTURE_CHIPS].map((chip) => [chip.id, chip]));
  const unknownChips: string[] = [];
  const next: DnaAxes & { material?: DnaObject["material"] } = { ...axes };
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
  // Describe-in-words history: absolute overwrites per trait, replayed in
  // pick order after the legacy deltas. Same history → same DNA.
  let borderWidth: WordsBorderWidth | undefined;
  if (selections.wordOrder !== undefined) {
    const resolved = resolveDescribeWords(selections.wordOrder);
    unknownChips.push(...resolved.unknownWords);
    for (const [axis, value] of Object.entries(resolved.axes)) {
      if (axis === "material") {
        if ((dnaEnums.material as readonly string[]).includes(value as string)) {
          next.material = value as DnaObject["material"];
        }
        continue;
      }
      next[axis as DnaAxisKey] = Math.min(1, Math.max(0, Math.round((value as number) * 1000) / 1000));
    }
    borderWidth = resolved.borderWidth ?? borderWidth;
  }
  // Strategy first: it replaces the anchors wholesale. Otherwise the
  // palette option's own anchors stand.
  const brand = selections.brandId
    ? brandOptions.find((candidate) => candidate.id === selections.brandId)
    : undefined;
  const option = options.find((candidate) => candidate.id === selections.paletteId);
  const anchors: DnaPalette = brand
    ? { ...brand.anchors }
    : option
      ? { ...option.anchors }
      : { ...palette };
  return { axes: next, anchors, unknownChips, borderWidth };
}
