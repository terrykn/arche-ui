/**
 * @arche/registry-core compiler — deterministic Design DNA → payload.
 *
 * The model is the only nondeterministic step and its output (DNA + palette
 * anchors) is stored. Everything below is pure Arche code: same DNA +
 * palette + compilerVersion → byte-identical payload, forever re-compilable
 * without calling a model again.
 *
 * The compiler never invents values outside closed registries: knob picks
 * come only from each manifest's declared values, fonts/icons only from the
 * foundation registries, and the finished payload passes the same validator
 * as a hand-made one (a compiler that emits an invalid payload is a bug,
 * and the error names the offending mapping).
 */
import {
  contrastRatio,
  contract as tokenContract,
} from "@arche/foundation/contract/validate-tokens";
import {
  deriveProfile,
  DNA_COMPILER_VERSION,
  migrateDnaAxes,
  resolveBrandHue,
  type DnaObject,
  type DnaPalette,
  type DnaSource,
  type GenerationProfile,
} from "@arche/foundation/dna";
import { expectedFontStack, fontEntriesById } from "@arche/foundation/fonts";
import {
  deriveTypeScale,
  DISPLAY_CAP_ABSOLUTE_PX,
  DISPLAY_CAP_BY_PROFILE,
} from "@arche/foundation/typography";
import {
  ACCENT_PLACEMENT,
  nameColor,
  NAMED_ROLES,
  runTasteSelfCheck,
  scoreSurprise,
  selectArtDirection,
  type NamedColor,
} from "@arche/foundation/taste";
import { assertTypefaceOverride } from "./variants.js";
import { assertGeneratedCompliant, CLOSED_EASINGS } from "./design-rules.js";
import { enforceConstraints, type PromptConstraints } from "./prompt-adherence.js";
import type { ArcheIdentity } from "./index.js";
import { getManifests, type Manifest } from "./manifests.js";

/** Compiler version stamped on every compiled DNA section. */
export const COMPILER_VERSION = DNA_COMPILER_VERSION;

export interface CompileInput {
  /** Display name for meta.name (naming is the caller's job). */
  name: string;
  /** Provenance: phrase text, image ref, fixture, or manual. */
  source: DnaSource;
  axes: DnaObject;
  palette: DnaPalette;
  /** Envelope preset the mappings build under (default standard). */
  profile?: GenerationProfile;
  /** Complete payload the mappings build on (Arche aurora in practice). */
  base: ArcheIdentity;
  /** Prompt-adherence constraints (Brief: words → numbers). Code wins over DNA. */
  constraints?: PromptConstraints;
  /**
   * Picker typography selection: closed-registry header/body ids chosen in
   * the typography step. Validated (registry + slots + pairing); the mono
   * slot stays derived by the compiler. Absent → the DNA-derived pick.
   */
  typeface?: { display: string; sans: string };
  /**
   * Picker brand voice: 1 = full voice (default), 0.45 = Material 3
   * secondary muting, 0 = neutral ink. Only the brand scale moves; the
   * system compiles exactly as dreamed otherwise. Legacy voice path —
   * the strategy picker supersedes it (strategies always compile at
   * full mark voice; the strategy, not a scale, differentiates them).
   */
  brandChromaScale?: number;
  /**
   * Words-step borders voice (describe-in-words history): an absolute
   * width that wins over the sharpness-derived mapping. Absent = legacy
   * behavior (sharpness/material decide), so default compiles are
   * byte-identical with or without this field.
   */
  borderWidth?: WordsBorderWidth;
  /**
   * Palette-row brand strategy: HOW the brand participates in the system.
   * Absent = legacy behavior (the system compiles as dreamed; only the
   * brand scale moves). One of three strategies, each derived from the
   * brand hue:
   * - unified: brand IS primary — the mark solid feeds both --brand and
   *   --primary (same color by design; the distinctness check is skipped).
   * - mark-only: the mark is scarce signal — primary/secondary compile
   *   achromatic near-black (light) / near-white (dark) while the brand
   *   stays full voice on its hue; accent is the brand lifted one ladder
   *   step (same hue, slightly lighter).
   * - accent: the brand is the highlight — primary is structural (dark,
   *   desaturated) while brand/accent carry the full-voice hue.
   */
  brandStrategy?: BrandStrategyId;
  /**
   * Picker-alternative compile: the palette's brand hue is an explicit user
   * pick (brand tile, custom hex), not the dreamed answer. The prompt's hue
   * family governed the dreamed choice; the pick IS the new family, so the
   * family snap is skipped and alternatives render truthfully instead of
   * collapsing back onto the dreamed color. Dreamed compiles omit this.
   */
  preservePickedHues?: boolean;
  /**
   * Exact picker color ("#rrggbb") for the mark. The user's own selection is
   * the brand solid, not just its hue: the pinned color keeps its own
   * lightness, saturation and hue, and the design-repair band still clamps
   * its chroma, so a custom pick can never widen a registry. Ignored under a
   * grayscale voice or a mute-to-ink brand scale — the brand never breaks
   * monochrome.
   */
  brandSolid?: string;
}

/** Palette-row brand strategies (one system per brand hue). */
export type BrandStrategyId = "unified" | "mark-only" | "accent";

/**
 * Describe-in-words borders voice: an absolute border width from the
 * winning borders slot. Resolved per profile at emission (the design rule
 * border-width-profile-bounds caps enterprise at 1px, so the mapping
 * clamps there instead of emitting a violation).
 */
export type WordsBorderWidth = "invisible" | "hairline" | "defined" | "thick";

export interface Adjustment {
  mode: string;
  token: string;
  compiledValue: string;
  adjustedValue: string;
  /** Design-rule id for design-repair entries; undefined for AA-pass entries. */
  ruleId?: string;
  pair?: string;
  ratioBefore?: number;
  ratioAfter?: number;
}

// ---------------------------------------------------------------------------
// OKLCH helpers (strings only — hue/chroma families are never touched by the
// AA pass, only lightness moves)
// ---------------------------------------------------------------------------

interface Oklch {
  l: number;
  c: number;
  h: number;
  alpha?: string;
}

function parseOklch(value: string): Oklch {
  const match = value.match(
    /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)$/,
  );
  if (!match) throw new Error(`compiler: cannot parse oklch '${value}'`);
  return { l: Number(match[1]), c: Number(match[2]), h: Number(match[3]), alpha: match[4] };
}

function fmt(n: number): string {
  return String(Math.round(n * 1000) / 1000);
}

function formatOklch({ l, c, h, alpha }: Oklch): string {
  const body = `${fmt(l)} ${fmt(c)} ${fmt(h)}`;
  return alpha === undefined ? `oklch(${body})` : `oklch(${body} / ${alpha})`;
}

function withLightness(value: string, l: number): string {
  const parsed = parseOklch(value);
  parsed.l = Math.min(1, Math.max(0, Math.round(l * 1000) / 1000));
  return formatOklch(parsed);
}

/**
 * A picker color is one solid on both modes' backgrounds, so its lightness
 * is held inside a range that stays visible on a near-white canvas and on a
 * near-black one. Hue and chroma are untouched; only an extreme pick (near
 * black or near white) is lifted or deepened enough to be seen.
 */
const PINNED_LIGHTNESS_MIN = 0.42;
const PINNED_LIGHTNESS_MAX = 0.82;

function pinnedSolid(color: Oklch): Oklch {
  return { ...color, l: Math.min(PINNED_LIGHTNESS_MAX, Math.max(PINNED_LIGHTNESS_MIN, color.l)) };
}

/**
 * sRGB hex ("#rrggbb") → OKLCH. Carries the picker color's own lightness,
 * chroma and hue; only the design-repair band may still clamp the chroma.
 */
function hexToOklch(hex: string): Oklch {
  const match = hex.trim().match(/^#([0-9a-f]{6})$/i);
  if (!match) throw new Error(`compiler: cannot read brand color '${hex}'`);
  const n = Number.parseInt(match[1]!, 16);
  const channel = (u: number): number => {
    const v = u / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const r = channel((n >> 16) & 255);
  const g = channel((n >> 8) & 255);
  const b = channel(n & 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const chroma = Math.hypot(a, bAxis);
  const hue = chroma < 1e-4 ? 0 : ((Math.atan2(bAxis, a) * 180) / Math.PI + 360) % 360;
  return { l: lightness, c: chroma, h: hue };
}

// ---------------------------------------------------------------------------
// Palette → scales (Radix-style: lightness ladder × bell-shaped chroma)
// ---------------------------------------------------------------------------

/** Lightness ladder for a 12-step scale, light → dark. */
const LADDER = [0.985, 0.96, 0.925, 0.885, 0.84, 0.785, 0.72, 0.645, 0.56, 0.475, 0.38, 0.27];

/** Chroma shape: muted at the extremes, full voice in the mid-steps. */
function chromaAt(peak: number, step: number): number {
  const bell = Math.sin((Math.PI * (step + 1)) / 14);
  return Math.round(peak * bell * 1000) / 1000;
}

function scaleColor(hue: number, peak: number, step: number): string {
  return formatOklch({ l: LADDER[step]!, c: chromaAt(peak, step), h: ((hue % 360) + 360) % 360 });
}

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

interface Voice {
  /** 0-1 loudness of the primary/accent scales. */
  chroma: number;
  /** neutral scale chroma (warmth pulls the neutrals warm). */
  neutralChroma: number;
  /** neutral hue blended toward warm (70°) by warmth. */
  neutralHue: number;
  /** chroma-axis target factor (0.02 at chroma 0 … 1 at chroma 1). The
   * solid-band floor scales with this — intent, not accident, sets it. */
  target: number;
}

function voiceOf(axes: DnaObject, palette: DnaPalette): Voice {
  // Brief #8 §5 — true zero: chroma 0 compiles to exactly C = 0 on every
  // scale step (pure grays, no tint). No floor anywhere in this function.
  const chromaAxis = typeof axes.chroma === "number" ? axes.chroma : 1;
  const target = Math.min(1, Math.max(0, chromaAxis));
  const chroma =
    Math.min(0.28, 0.03 + axes.energy * 0.09 + axes.playfulness * 0.07 - axes.formality * 0.05) * target;
  const warmHue = 40 + axes.warmth * 20;
  const coolHue = 220 + (1 - axes.warmth) * 40;
  const neutralHue = axes.warmth >= 0.5 ? warmHue : coolHue;
  // At chroma 0 the neutrals are pure gray; otherwise they lean warm/cool
  // gray by warmth at very low chroma.
  const neutralChroma = target === 0 ? 0 : 0.004 + axes.warmth * 0.012;
  return { chroma: Math.max(0, chroma), neutralChroma, neutralHue, target };
}

/**
 * Max circular hue spread across the four anchors (degrees 0-180). Brand
 * counts: a loud brand on a quiet trio is not monochrome.
 */
function maxHueSpread(palette: DnaPalette): number {
  const hues = [palette.primaryHue, palette.accentHue, palette.neutralHue, resolveBrandHue(palette)];
  let spread = 0;
  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      const d = Math.abs(((hues[i]! - hues[j]!) % 360 + 360) % 360);
      spread = Math.max(spread, Math.min(d, 360 - d));
    }
  }
  return spread;
}

/** Monochrome by construction (Brief #8 §5): hues within 10° and chroma ≤
 * 0.1 force achromatic scales on every role, including the accent. */
export function isMonochromeDna(axes: { chroma: number }, palette: DnaPalette): boolean {
  return maxHueSpread(palette) <= 10 && axes.chroma <= 0.1;
}

// ---------------------------------------------------------------------------
// Mapping tables (this is Arche's design IP — explicit, versioned, readable)
// ---------------------------------------------------------------------------

/**
 * Border-width mapping (border-width-profile-bounds). Default 1px; maps
 * upward only on strong sharpness/pixel signals; formality forces 1px and
 * enterprise caps at 1px regardless of axes.
 */
function borderWidthFor(axes: DnaObject, profile: GenerationProfile, override?: WordsBorderWidth): string {
  // Words-step voice: absolute, profile-clamped (enterprise never exceeds
  // its 1px bound). Invisible is a real 0px — the token contract lists it.
  if (override === "invisible") return "0px";
  if (override === "hairline") return "1px";
  if (override === "defined") return profile === "enterprise" ? "1px" : "2px";
  if (override === "thick") {
    if (profile === "enterprise") return "1px";
    return profile === "expressive" ? "3px" : "2px";
  }
  if (axes.formality >= 0.8 || profile === "enterprise") return "1px";
  const strong =
    axes.sharpness >= 0.8 ||
    (axes.playfulness >= 0.5 && axes.ornament >= 0.6) ||
    axes.material === "pixel";
  if (!strong) return "1px";
  return profile === "expressive" ? "3px" : "2px";
}

/**
 * sharpness 0 → profile bound, 1 → no radius. The bound is the profile's
 * (radius-profile-bounds): enterprise 0.5rem, standard 1rem, expressive 1.5rem.
 */
function radiusFor(sharpness: number, profile: GenerationProfile): string {
  const bound = profile === "enterprise" ? 0.5 : profile === "expressive" ? 1.5 : 1;
  const rem = Math.round((1 - clamp01(sharpness)) * bound * 1000) / 1000;
  return `${rem}rem`;
}

/** sharpness → radiusFrom preference (first declared value wins). */
function radiusKnobFor(sharpness: number): string[] {
  if (sharpness < 0.25) return ["xl", "lg", "md", "sm"];
  if (sharpness < 0.5) return ["lg", "xl", "md", "sm"];
  if (sharpness < 0.75) return ["md", "lg", "sm", "xl"];
  return ["sm", "md", "lg", "xl"];
}

/** density → size-knob preference (never "icon": icons are not sizes). */
function sizeKnobFor(density: number): string[] {
  if (density < 0.34) return ["sm", "default", "lg"];
  if (density < 0.67) return ["default", "sm", "lg"];
  return ["lg", "default", "sm"];
}

const SHADOW_ORDER = ["none", "sm", "md", "lg", "xl"] as const;

interface MaterialTreatment {
  /** default shadow-knob target; ornament nudges it one step up. */
  shadowTarget: number;
  /** shadow token scale (sm/md/lg/xl box-shadow strings). */
  shadows: [string, string, string, string];
}

/**
 * Preview honesty helper: the shadow-knob step (0–4 into
 * none/sm/md/lg/xl) the compiler's own knob pass derives from a material +
 * ornament pair. Same formula as applyKnobs so the preview shows the
 * shadow the components actually take.
 */
export function shadowStepFor(material: DnaObject["material"], ornament: number): number {
  const treatment = materialTreatment(material, ornament, 0);
  return Math.min(4, Math.max(0, treatment.shadowTarget + (ornament >= 0.7 ? 1 : 0)));
}

function shadowSet(shadowHue: number, kind: "soft" | "crisp" | "solid" | "billow"): [string, string, string, string] {
  const ink = (alpha: string): string => `oklch(0.2 0.01 ${fmt(shadowHue)} / ${alpha})`;
  switch (kind) {
    case "solid":
      return [
        `2px 2px 0 0 ${ink("0.9")}`,
        `4px 4px 0 0 ${ink("0.9")}`,
        `6px 6px 0 0 ${ink("0.9")}`,
        `8px 8px 0 0 ${ink("0.9")}`,
      ];
    case "crisp":
      return [
        `0 1px 1px 0 ${ink("0.12")}`,
        `0 2px 3px 0 ${ink("0.14")}`,
        `0 4px 8px -1px ${ink("0.16")}`,
        `0 8px 16px -2px ${ink("0.18")}`,
      ];
    case "billow":
      return [
        `0 2px 8px 0 ${ink("0.08")}`,
        `0 8px 20px 0 ${ink("0.1")}`,
        `0 16px 36px -4px ${ink("0.12")}`,
        `0 28px 56px -8px ${ink("0.14")}`,
      ];
    case "soft":
    default:
      return [
        `0 1px 2px 0 ${ink("0.05")}`,
        `0 4px 6px -1px ${ink("0.07")}`,
        `0 10px 15px -3px ${ink("0.08")}`,
        `0 20px 25px -5px ${ink("0.1")}`,
      ];
  }
}

function materialTreatment(material: DnaObject["material"], ornament: number, hue: number): MaterialTreatment {
  switch (material) {
    case "pixel":
      return { shadowTarget: ornament > 0.5 ? 2 : 1, shadows: shadowSet(hue, "solid") };
    case "glass":
      return { shadowTarget: 3, shadows: shadowSet(hue, "billow") };
    case "metal":
      return { shadowTarget: 2, shadows: shadowSet(hue, "crisp") };
    case "marble":
      return { shadowTarget: 2, shadows: shadowSet(hue, "soft") };
    case "clay":
      return { shadowTarget: 3, shadows: shadowSet(hue, "billow") };
    case "paper":
      return { shadowTarget: 1, shadows: shadowSet(hue, "soft") };
    case "flat":
    default:
      return { shadowTarget: ornament >= 0.4 ? 1 : 0, shadows: shadowSet(hue, "soft") };
  }
}

interface MotionPair {
  fast: { duration: string; easing: string };
  normal: { duration: string; easing: string };
}

function motionFor(feel: DnaObject["motionFeel"]): MotionPair {
  switch (feel) {
    case "snappy":
      return {
        fast: { duration: "100ms", easing: "cubic-bezier(0.3, 0, 0, 1)" },
        normal: { duration: "150ms", easing: "cubic-bezier(0.3, 0, 0, 1)" },
      };
    case "bouncy":
      return {
        fast: { duration: "250ms", easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
        normal: { duration: "400ms", easing: "cubic-bezier(0.34, 1.4, 0.64, 1)" },
      };
    case "stately":
      return {
        // motion-bounds caps component transitions at 400ms.
        fast: { duration: "300ms", easing: "ease-in-out" },
        normal: { duration: "400ms", easing: "ease-in-out" },
      };
    case "glitchy":
      return {
        fast: { duration: "80ms", easing: "cubic-bezier(0.9, 0, 0.1, 1)" },
        normal: { duration: "120ms", easing: "cubic-bezier(0.9, 0, 0.1, 1)" },
      };
    case "smooth":
    default:
      return {
        fast: { duration: "150ms", easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
        normal: { duration: "250ms", easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
      };
  }
}

interface TypePick {
  sans: string;
  display: string;
  mono: string;
}

/**
 * Deterministic registry pair picks. The display face is selected first from
 * DNA; the body face is its registered compatible partner (or the same
 * expressive family when the profile calls for a single-family treatment).
 * Mono is always the registry default, Geist Mono, unless a formal or warm
 * identity calls for JetBrains Mono's technical texture. Priority: pixel >
 * era-playful > formal > warm > enterprise > expressive > neutral.
 */
function typeFor(axes: DnaObject, profile: GenerationProfile): TypePick {
  if (axes.material === "pixel") {
    return { sans: "general-sans", display: "clash-display", mono: "geist-mono" };
  }
  if (axes.playfulness >= 0.5 && axes.ornament >= 0.5) {
    return { sans: "general-sans", display: "melodrama", mono: "geist-mono" };
  }
  if (axes.formality >= 0.65) {
    return { sans: "switzer", display: "zodiak", mono: "jetbrains-mono" };
  }
  if (axes.warmth >= 0.65) {
    return { sans: "cabinet-grotesk", display: "sentient", mono: "jetbrains-mono" };
  }
  if (profile === "enterprise") {
    return { sans: "public-sans", display: "archivo", mono: "geist-mono" };
  }
  if (profile === "expressive") {
    return { sans: "clash-grotesk", display: "clash-grotesk", mono: "geist-mono" };
  }
  return { sans: "satoshi", display: "satoshi", mono: "geist-mono" };
}

/**
 * The compiler's own header/body/mono pick for DNA (used as the "As Dreamed"
 * typography fallback and to resolve specimens). Deterministic.
 */
export function deriveTypePick(
  axes: DnaObject,
  profile: GenerationProfile,
): { sans: string; display: string; mono: string } {
  return { ...typeFor(axes, profile) };
}

/** Icon library: lucide unless the table says otherwise (ornate ↔ phosphor weights). */
function iconsFor(axes: DnaObject): string {
  if (axes.material === "marble" || axes.ornament >= 0.7) return "phosphor";
  return "lucide";
}

// ---------------------------------------------------------------------------
// Token assembly
// ---------------------------------------------------------------------------

type TokenRecord = Record<string, { $type: string; $value: unknown }>;

function color(value: string): { $type: string; $value: string } {
  return { $type: "color", $value: value };
}

const WHITE_POLE = "oklch(0.99 0 0)";
const BLACK_POLE = "oklch(0.2 0.01 250)";

/** White or black text, whichever already passes AA on bg (else white; the AA pass finishes it). */
function autoText(bg: string): string {
  // Pick whichever pole contrasts more — white wins ties. A fixed 4.5
  // cutoff on white alone stuck dark text on mid-dark solids (white at
  // 4.0 vs black at 1.5 picked black); max-ratio swaps to light at the
  // true midpoint. The AA pass below still guarantees ≥4.5 either way.
  return contrastRatio(WHITE_POLE, bg) >= contrastRatio(BLACK_POLE, bg) ? WHITE_POLE : BLACK_POLE;
}

/** Chroma at/above which a solid counts as saturated: prefer white text. */
const WHITE_PREF_MIN_CHROMA = 0.08;
/** Lightness at/above which even a saturated solid takes near-black text. */
const WHITE_PREF_MAX_LIGHTNESS = 0.7;
/** Max background darkening white may demand (10 AA steps of 0.01). */
const WHITE_PREF_MAX_BG_STEPS = 10;

/**
 * Real-brand rule for the chromatic solids (brand, primary): saturated
 * backgrounds default to white text — near-black is reserved for light or
 * low-chroma backgrounds. When white fails AA, the BACKGROUND is repaired
 * (darkened in lightness only, hue and chroma untouched) until white hits
 * 4.5:1; the shift is capped at ΔL 0.1 — past that the color is no longer
 * the brand, so black text on the true color wins instead (the generic AA
 * pass below finishes it from there). Light, low-chroma and neutral-dark
 * solids keep the max-ratio choice untouched.
 */
function preferWhiteForeground(
  tokens: TokenRecord,
  mode: string,
  bgName: string,
  fgName: string,
  adjustments: Adjustment[],
): void {
  const bg = tokens[bgName];
  const fg = tokens[fgName];
  if (!bg || !fg || typeof bg.$value !== "string" || typeof fg.$value !== "string") return;
  let parsed: Oklch;
  try {
    parsed = parseOklch(bg.$value);
  } catch {
    return;
  }
  if (parsed.l >= WHITE_PREF_MAX_LIGHTNESS || parsed.c < WHITE_PREF_MIN_CHROMA) return;
  const compiledBg = bg.$value;
  const compiledFg = fg.$value;
  const ratioBefore = contrastRatio(WHITE_POLE, compiledBg);
  if (Number.isNaN(ratioBefore)) return;
  fg.$value = WHITE_POLE;
  let ratio = ratioBefore;
  for (let i = 0; i < WHITE_PREF_MAX_BG_STEPS && ratio < 4.5; i++) {
    const cur = parseOklch(bg.$value as string).l;
    const next = Math.round((cur - AA_STEP) * 1000) / 1000;
    if (next < 0.02) break;
    bg.$value = withLightness(bg.$value as string, next);
    ratio = contrastRatio(fg.$value as string, bg.$value as string);
  }
  if (ratio < 4.5) {
    // Too far: restore the true color and take black text instead.
    bg.$value = compiledBg;
    fg.$value = BLACK_POLE;
    return;
  }
  ratio = contrastRatio(fg.$value as string, bg.$value as string);
  if (fg.$value !== compiledFg) {
    adjustments.push({
      mode,
      token: fgName,
      compiledValue: compiledFg,
      adjustedValue: fg.$value as string,
      pair: `${fgName} on ${bgName}`,
      ratioBefore,
      ratioAfter: ratio,
    });
  }
  if (bg.$value !== compiledBg) {
    adjustments.push({
      mode,
      token: bgName,
      compiledValue: compiledBg,
      adjustedValue: bg.$value as string,
      pair: `${fgName} on ${bgName}`,
      ratioBefore,
      ratioAfter: ratio,
    });
  }
}

function buildModeTokens(
  mode: "light" | "dark",
  axes: DnaObject,
  palette: DnaPalette,
  voice: Voice,
  profile: GenerationProfile,
  monochrome: boolean,
  brandScale: number,
  strategy: BrandStrategyId | null = null,
  borderWidth?: WordsBorderWidth,
  brandSolid?: string,
): TokenRecord {
  const dark = mode === "dark";
  const P = palette.primaryHue;
  const A = palette.accentHue;
  const N = voice.neutralHue;
  const NC = monochrome ? 0 : voice.neutralChroma;
  // Solids render at full chroma within the design-rules band so a hue
  // change is visible in the first screen (Brief #8 §5). The chroma axis —
  // not energy — drives saturation (Brief #8 §4: chroma scales accent
  // saturation); energy drives accent usage and motion instead. Grayscale
  // (target 0) and monochrome force zero.
  const solidCeiling = profile === "enterprise" ? 0.19 : profile === "expressive" ? 0.26 : 0.24;
  const solidFloor = Math.round(0.08 * voice.target * 1000) / 1000;
  const fullVoice = Math.round(Math.min(solidCeiling, 0.28 * voice.target) * 1000) / 1000;
  const C = monochrome || voice.target === 0 ? 0 : Math.min(solidCeiling, Math.max(fullVoice, solidFloor));
  // Surface/text anchors: near-white↔near-black ends of the neutral scale.
  // Dark-mode background sits below step 11 (0.27 reads washed-out
  // against near-white ink); the card (0.32) keeps its separation above.
  const bg = dark ? withLightness(scaleColor(N, NC, 11), 0.22) : scaleColor(N, NC, 0);
  // Dark-mode card sits below step 10: step 10 reads washed-out against
  // near-white ink, while step 11 would merge into the background.
  const surface = dark ? withLightness(scaleColor(N, NC, 10), 0.32) : scaleColor(N, NC, 1);
  const ink = scaleColor(N, NC * 2, dark ? 0 : 11);
  let primary = scaleColor(P, C, dark ? 8 : 5);
  // Grayscale (Brief #8 §5): every role is exactly C = 0 — including the
  // auto-text inks, whose near-black fallback otherwise carries C = 0.01.
  const grayscale = monochrome || voice.target === 0;
  const dechroma = (value: string): string => {
    if (!grayscale) return value;
    const parsed = parseOklch(value);
    parsed.c = 0;
    return formatOklch(parsed);
  };
  let primaryInk = dechroma(autoText(primary));
  let secondary = scaleColor(P, C * 0.45, dark ? 9 : 2);
  let secondaryInk = dechroma(scaleColor(P, C, dark ? 1 : 10));
  // Enterprise disallows the accent family: accent derives from the primary
  // hue (primary + semantics only). Other profiles use the accent anchor.
  // Brand is exempt from the enterprise rule: the brand button is the
  // enterprise brand-highlight moment, and the brand hue is used exactly
  // as generated.
  const AH = profile === "enterprise" ? P : A;
  let accent = scaleColor(AH, C, dark ? 9 : 2);
  let accentInk = dechroma(scaleColor(AH, C, dark ? 1 : 10));
  // Brand scale (Brand Token brief): the recognizable hue at full voice.
  // Solid = step 9 (index 8) in both modes — the loud brand moment, never
  // tamed into a button. Text on the solid is derived per mode from the
  // actual emitted value (autoText: white when it passes, else dark).
  const B = resolveBrandHue(palette);
  // Picker brand voice: the muted secondary and neutral ink marks scale
  // only the brand chroma (monochrome still forces zero everywhere).
  const BC = monochrome || voice.target === 0 || brandScale === 0 ? 0 : C * brandScale;
  // A picker color pins the mark to the user's own selection: its exact
  // lightness, chroma and hue land in --brand (and, under Unified, in
  // --primary with it). The design-repair pass below still clamps the chroma
  // into the profile band, so the pin can never widen a registry.
  const pinnedBrand =
    brandSolid && !grayscale && brandScale > 0 ? formatOklch(pinnedSolid(hexToOklch(brandSolid))) : null;
  const brand = pinnedBrand ?? scaleColor(B, BC, 8);
  const brandFg = autoText(brand);
  const brandInk = (() => {
    if (grayscale || brandScale === 0) {
      const parsed = parseOklch(brandFg);
      parsed.c = 0;
      return formatOklch(parsed);
    }
    return brandFg;
  })();
  // Palette-row brand strategies: the strategy rebuilds the structural
  // roles around the mark. Absent (legacy) leaves the dreamed system
  // alone — only the brand scale moves.
  if (strategy === "unified") {
    // Brand IS primary: one solid feeds both roles (same color by design;
    // the distinctness check is skipped on purpose).
    primary = brand;
    primaryInk = brandInk;
  } else if (strategy === "mark-only") {
    // Mark-only signal: primary/secondary go achromatic near-black (light)
    // / near-white (dark) while the brand stays full voice on its hue.
    // Accent is the brand lifted one ladder step (same hue, slightly
    // lighter — signal highlights, links, focal words), with its own
    // AA text — never derived from the ink primary.
    primary = formatOklch({ l: dark ? LADDER[0]! : LADDER[11]!, c: 0, h: P });
    primaryInk = autoText(primary);
    secondary = formatOklch({ l: dark ? LADDER[9]! : LADDER[2]!, c: 0, h: N });
    secondaryInk = autoText(secondary);
    accent = scaleColor(B, BC, 7);
    accentInk = autoText(accent);
  } else if (strategy === "accent") {
    // Brand as highlight (Stripe): the structure is the dark desaturated
    // sibling of the mark hue — same family (near-navy of H), dusty at
    // 0.45x chroma and a darker step in light mode / lighter step in dark
    // mode so it stays distinct from the vivid mark via lightness alone.
    // P is the mark hue here (strategy anchors all sit on H).
    primary = scaleColor(P, C * 0.45, dark ? 4 : 10);
    primaryInk = dechroma(autoText(primary));
    secondary = scaleColor(P, C * 0.45, dark ? 9 : 2);
    secondaryInk = dechroma(scaleColor(P, C, dark ? 1 : 10));
  }
  const muted = scaleColor(N, monochrome ? 0 : NC * 1.5, dark ? 9 : 2);
  const mutedInk = dechroma(scaleColor(N, monochrome ? 0 : NC * 2, dark ? 2 : 9));
  const destructive = formatOklch({ l: dark ? 0.6 : 0.55, c: grayscale ? 0 : 0.22, h: 25 });
  const destructiveInk = dechroma(autoText(destructive));
  // Charts reference the brand hues; enterprise uses a primary-anchored
  // pentagon (no accent family). Chroma floor keeps chart separation alive
  // at low voice (the repair pass spreads lightness where hues collide).
  const chartHues = profile === "enterprise"
    ? [P, P + 72, P + 144, P + 216, P + 288]
    : [P, A, P + 50, A + 130, P + 200];
  const chartChroma = grayscale ? 0 : Math.min(0.18, Math.max(C, voice.chroma));
  const tokens: TokenRecord = {
    "--background": color(bg),
    "--card": color(surface),
    "--popover": color(surface),
    "--foreground": color(ink),
    "--card-foreground": color(ink),
    "--popover-foreground": color(ink),
    "--primary": color(primary),
    "--primary-foreground": color(primaryInk),
    "--secondary": color(secondary),
    "--secondary-foreground": color(secondaryInk),
    "--accent": color(accent),
    "--accent-foreground": color(accentInk),
    "--destructive": color(destructive),
    "--destructive-foreground": color(destructiveInk),
    "--brand": color(brand),
    "--brand-foreground": color(brandInk),
    "--muted": color(muted),
    "--muted-foreground": color(mutedInk),
    "--border": color(scaleColor(N, NC, dark ? 8 : 3)),
    "--input": color(scaleColor(N, NC, dark ? 8 : 3)),
    "--ring": color(scaleColor(P, C, dark ? 7 : 6)),
    "--radius": { $type: "dimension", $value: radiusFor(axes.sharpness, profile) },
    "--border-width": { $type: "dimension", $value: borderWidthFor(axes, profile, borderWidth) },
  };
  chartHues.forEach((hue, i) => {
    tokens[`--chart-${i + 1}`] = color(scaleColor(hue, chartChroma, dark ? 7 : 5));
  });
  const motion = motionFor(axes.motionFeel);
  tokens["--motion-fast"] = { $type: "motion", $value: { ...motion.fast } };
  tokens["--motion-normal"] = { $type: "motion", $value: { ...motion.normal } };
  const treatment = materialTreatment(axes.material, axes.ornament, N);
  (["--shadow-sm", "--shadow-md", "--shadow-lg", "--shadow-xl"] as const).forEach((name, i) => {
    tokens[name] = { $type: "shadow", $value: treatment.shadows[i] };
  });
  return tokens;
}

// ---------------------------------------------------------------------------
// Knob assembly (declared values only — preference lists, first hit wins)
// ---------------------------------------------------------------------------

function pickDeclared(values: unknown, preference: string[]): string | null {
  if (!Array.isArray(values)) return null;
  for (const want of preference) {
    if ((values as unknown[]).includes(want)) return want;
  }
  return null;
}

function declaredKnob(manifest: Manifest, knobNames: string[]): { knob: string; values: unknown } | null {
  for (const surface of Object.values(manifest.styleSurface)) {
    for (const knob of knobNames) {
      // Token-type knobs (e.g. radiusFrom) declare `scale`; enum knobs declare `values`.
      const spec = surface[knob] as { values?: unknown; scale?: unknown } | undefined;
      const values = spec?.values ?? spec?.scale;
      if (values !== undefined) return { knob, values };
    }
  }
  return null;
}

function applyKnobs(
  components: Record<string, Record<string, unknown>>,
  axes: DnaObject,
  materialShadowTarget: number,
): void {
  for (const manifest of getManifests()) {
    const selections = components[manifest.name];
    if (!selections) continue;
    // "size" and "defaultSize" stamp the same cva axis (KNOB_TO_AXIS), so
    // they must agree: choose the first preference present in EVERY knob's
    // declared values, and set them together. No consensus → leave the base.
    const sizeKnobs = ["defaultSize", "size"]
      .map((knob) => {
        const axisValues = manifest.axes[knob]?.values;
        if (axisValues) return { knob, values: axisValues };
        return declaredKnob(manifest, [knob]);
      })
      .filter((entry) => entry !== null);
    if (sizeKnobs.length > 0) {
      const choice = sizeKnobFor(axes.density).find((want) =>
        sizeKnobs.every((entry) => (entry.values as unknown[]).includes(want)),
      );
      if (choice) {
        for (const entry of sizeKnobs) selections[entry.knob] = choice;
      }
    }
    const radius = declaredKnob(manifest, ["radiusFrom"]);
    if (radius) {
      const choice = pickDeclared(radius.values, radiusKnobFor(axes.sharpness));
      if (choice) selections[radius.knob] = choice;
    }
    const shadow = declaredKnob(manifest, ["shadow"]);
    if (shadow && Array.isArray(shadow.values)) {
      const declared = (shadow.values as unknown[]).map(String);
      const target = Math.min(
        SHADOW_ORDER.length - 1,
        Math.max(0, materialShadowTarget + (axes.ornament >= 0.7 ? 1 : 0)),
      );
      // Nearest declared step to the target (ties → the subtler one).
      let best: string | null = null;
      let bestDist = Infinity;
      for (const name of declared) {
        const idx = (SHADOW_ORDER as readonly string[]).indexOf(name);
        if (idx === -1) continue;
        const dist = Math.abs(idx - target);
        if (dist < bestDist) {
          bestDist = dist;
          best = name;
        }
      }
      if (best) selections[shadow.knob] = best;
    }
  }
}

/**
 * Type-scale mapping (Deliverable 5, deterministic table). High formality or
 * the enterprise profile → compact/standard; high energy/playfulness under
 * expressive → expressive/editorial; default standard. Enterprise never
 * takes editorial-1.5 (the validator enforces this too).
 */
function typeScaleFor(axes: DnaObject, profile: GenerationProfile): string {
  if (axes.formality >= 0.7 || profile === "enterprise") return "compact-1.2";
  if (profile === "expressive" && (axes.energy >= 0.65 || axes.playfulness >= 0.65)) {
    return axes.energy >= 0.85 && axes.playfulness >= 0.7 ? "editorial-1.5" : "expressive-1.333";
  }
  return "standard-1.25";
}

// ---------------------------------------------------------------------------
// AA adjustment pass (Rule 3: lightness-only, every change recorded)
// ---------------------------------------------------------------------------

const AA_STEP = 0.01;
const AA_MAX_STEPS = 80;

function adjustPair(
  tokens: TokenRecord,
  mode: string,
  fgName: string,
  bgName: string,
  minRatio: number,
  adjustments: Adjustment[],
): void {
  const fg = tokens[fgName];
  const bg = tokens[bgName];
  if (!fg || !bg || typeof fg.$value !== "string" || typeof bg.$value !== "string") return;
  let ratio = contrastRatio(fg.$value as string, bg.$value as string);
  if (Number.isNaN(ratio) || ratio >= minRatio) return;
  const ratioBefore = ratio;
  const compiledFg = fg.$value as string;
  const compiledBg = bg.$value as string;
  const fgL = parseOklch(compiledFg).l;
  const bgL = parseOklch(compiledBg).l;
  // Move the text away from the surface first; the surface moves only if the
  // text hits its lightness bound.
  const fgUp = fgL >= bgL;
  for (let i = 0; i < AA_MAX_STEPS; i++) {
    const cur = parseOklch(fg.$value as string).l;
    const next = fgUp ? cur + AA_STEP : cur - AA_STEP;
    if (next > 0.995 || next < 0.02) break;
    fg.$value = withLightness(fg.$value as string, next);
    ratio = contrastRatio(fg.$value as string, bg.$value as string);
    if (ratio >= minRatio) break;
  }
  if (ratio < minRatio) {
    const bgUp = !fgUp;
    for (let i = 0; i < AA_MAX_STEPS; i++) {
      const cur = parseOklch(bg.$value as string).l;
      const next = bgUp ? cur + AA_STEP : cur - AA_STEP;
      if (next > 0.995 || next < 0.02) break;
      bg.$value = withLightness(bg.$value as string, next);
      ratio = contrastRatio(fg.$value as string, bg.$value as string);
      if (ratio >= minRatio) break;
    }
  }
  ratio = contrastRatio(fg.$value as string, bg.$value as string);
  if (fg.$value !== compiledFg) {
    adjustments.push({
      mode,
      token: fgName,
      compiledValue: compiledFg,
      adjustedValue: fg.$value as string,
      pair: `${fgName} on ${bgName}`,
      ratioBefore,
      ratioAfter: ratio,
    });
  }
  if (bg.$value !== compiledBg) {
    adjustments.push({
      mode,
      token: bgName,
      compiledValue: compiledBg,
      adjustedValue: bg.$value as string,
      pair: `${fgName} on ${bgName}`,
      ratioBefore,
      ratioAfter: ratio,
    });
  }
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

/**
 * Compiles DNA + palette anchors into a complete identity payload on top of
 * the base payload. Deterministic: no clocks, no randomness, fixed
 * iteration orders. Throws (naming the mapping) if the result is invalid.
 */
export function compileIdentity(input: CompileInput): ArcheIdentity {
  const { name, source, axes, palette, base } = input;
  // Brief #8 §5: profile is derived from DNA, never model-chosen. An
  // explicit input.profile (old callers, back-compat) still wins.
  const migrated = migrateDnaAxes(axes as unknown as Record<string, unknown>);
  const effectiveAxes = (migrated.migrated ? { ...(axes as object), ...migrated.axes } : axes) as DnaObject;
  const profile = input.profile ?? deriveProfile(effectiveAxes);
  const monochrome = isMonochromeDna(effectiveAxes, palette);
  const voice = voiceOf(effectiveAxes, palette);
  const compiled: ArcheIdentity = JSON.parse(JSON.stringify(base)) as ArcheIdentity;

  compiled.meta = {
    ...compiled.meta,
    name,
    contractVersion: tokenContract.contractVersion,
  };
  // Type scale is selected, never derived free-form (Deliverable 5).
  compiled.typeScale = typeScaleFor(effectiveAxes, profile);

  const brandScale =
    typeof input.brandChromaScale === "number"
      ? Math.min(1, Math.max(0, input.brandChromaScale))
      : 1;
  const brandStrategy: BrandStrategyId | null = input.brandStrategy ?? null;
  const tokens: Record<string, TokenRecord> = {
    light: buildModeTokens("light", effectiveAxes, palette, voice, profile, monochrome, brandScale, brandStrategy, input.borderWidth, input.brandSolid),
    dark: buildModeTokens("dark", effectiveAxes, palette, voice, profile, monochrome, brandScale, brandStrategy, input.borderWidth, input.brandSolid),
  };

  // Font stacks must mirror the selected registry families exactly.
  const byId = fontEntriesById();
  const pick = typeFor(effectiveAxes, profile);
  if (input.typeface) {
    assertTypefaceOverride(input.typeface);
    pick.display = input.typeface.display;
    pick.sans = input.typeface.sans;
  }
  const sans = byId.get(pick.sans)!;
  const display = byId.get(pick.display)!;
  const mono = byId.get(pick.mono)!;
  if (!sans || !display || !mono) {
    throw new Error(`compiler type table produced unknown font id: ${pick.sans}/${pick.display}/${pick.mono}`);
  }
  compiled.fonts = { sans: sans.id, display: display.id, mono: mono.id };
  const light = tokens.light!;
  const darkTokens = tokens.dark!;
  light["--font-sans"] = { $type: "fontFamily", $value: expectedFontStack(sans, "sans") };
  light["--font-display"] = { $type: "fontFamily", $value: expectedFontStack(display, "display") };
  light["--font-mono"] = { $type: "fontFamily", $value: expectedFontStack(mono, "mono") };
  darkTokens["--font-sans"] = { $type: "fontFamily", $value: expectedFontStack(sans, "sans") };
  darkTokens["--font-display"] = { $type: "fontFamily", $value: expectedFontStack(display, "display") };
  darkTokens["--font-mono"] = { $type: "fontFamily", $value: expectedFontStack(mono, "mono") };

  compiled.icons = iconsFor(effectiveAxes);
  // Rule 6: hand-recorded overrides survive recompilation — the override
  // wins over the newly compiled value. (The AA pass below still rules:
  // overrides are validated on save, so they can never break the gate.)
  const overrides = (base.meta as Record<string, unknown>).overrides as
    | Record<string, TokenRecord[string]>
    | undefined;
  if (overrides && typeof overrides === "object") {
    for (const [path, value] of Object.entries(overrides)) {
      const dot = path.indexOf(".");
      const mode = path.slice(0, dot);
      const token = path.slice(dot + 1);
      if ((mode === "light" || mode === "dark") && value && typeof value === "object" && tokens[mode]?.[token]) {
        tokens[mode]![token] = value;
      }
    }
  }
  compiled.tokens = tokens as ArcheIdentity["tokens"];

  const treatment = materialTreatment(effectiveAxes.material, effectiveAxes.ornament, voice.neutralHue);
  applyKnobs(compiled.components, effectiveAxes, treatment.shadowTarget);

  // Design-repair pass (after emission, before AA): envelope violations are
  // clamped into the envelope with hue/lightness preserved where the rule
  // allows it; every repair is recorded with its design-rule id.
  const adjustments: Adjustment[] = [];
  repairDesign(tokens, profile, adjustments, voice.target, monochrome, brandScale, brandStrategy, Boolean(input.brandSolid));

  // Prompt-adherence enforcement (Brief: words → numbers → code). Runs
  // AFTER design repair (so the true-zero monochrome rule runs after any
  // neutral-tint repair and can never be re-tinted) and BEFORE the AA pass
  // (AA moves lightness only, so caps survive it). Every action is logged
  // with a prompt-* rule id; conflicts resolve in favor of the constraint.
  if (input.constraints && Object.keys(input.constraints).length > 0) {
    enforceConstraints(
      tokens as unknown as Record<string, Record<string, { $type: string; $value: unknown }>>,
      input.constraints,
      profile,
      adjustments as unknown as Array<{ mode: string; token: string; compiledValue: string; adjustedValue: string; ruleId: string }>,
      { brandStrategy: input.brandStrategy, preservePickedHues: input.preservePickedHues },
    );
    // Hue snaps can collide charts — re-spread by lightness only (never
    // re-tints a forced-zero palette).
    for (const mode of ["light", "dark"] as const) {
      repairCharts(tokens[mode]!, mode, adjustments);
    }
  }

  // White-text preference on the chromatic solids first: white is fixed as
  // the foreground and the background yields (capped) — the generic pass
  // below then sees an already-passing pair and leaves it alone.
  for (const mode of ["light", "dark"] as const) {
    preferWhiteForeground(tokens[mode]!, mode, "--brand", "--brand-foreground", adjustments);
    preferWhiteForeground(tokens[mode]!, mode, "--primary", "--primary-foreground", adjustments);
  }
  // AA pass per mode, pairs in contract order (deterministic).
  for (const mode of ["light", "dark"] as const) {
    for (const pair of tokenContract.contrastPairs) {
      adjustPair(tokens[mode]!, mode, pair.fg, pair.bg, pair.minRatio, adjustments);
    }
  }
  compiled.meta.adjustments = adjustments;
  // Stamp the prompt constraints on the payload BEFORE the final gate so
  // the design-rule validator can apply the prompt-monochrome floor (code
  // decides: a monochrome brief means floor 0 even when the model's own
  // chroma axis is high).
  if (input.constraints && Object.keys(input.constraints).length > 0) {
    (compiled.meta as Record<string, unknown>).promptConstraints = { ...input.constraints };
  }

  // The compiled DNA always carries the brand anchor (defaulted to the
  // primary hue when the input omitted it — existing identities keep
  // --brand == --primary until regenerated).
  const brandHue = resolveBrandHue(palette);
  const compiledPalette: DnaPalette = { ...palette, brandHue };
  compiled.dna = {
    source: { ...source },
    axes: { ...effectiveAxes },
    palette: compiledPalette,
    profile,
    compilerVersion: COMPILER_VERSION,
  };
  // Brand record (Brand Token brief): the resolved hue, the per-mode
  // foreground choice off the actual emitted solid, and the hero CTA
  // affinity — brand when brand and primary differ by more than 30°,
  // otherwise primary. Recorded like any other variant selection.
  const hueSep = ((a: number, b: number): number => {
    const d = Math.abs(((a - b) % 360 + 360) % 360);
    return Math.min(d, 360 - d);
  })(brandHue, palette.primaryHue);
  // Picker ink voice: stamped for the design-rule validator (a neutral
  // mark is intent, not an accident). Recorded only when muted so default
  // payloads — and goldens — never change shape.
  const brandRecord: Record<string, unknown> = {
    hue: Math.round(brandHue * 1000) / 1000,
    foreground: {
      light: String(tokens.light!["--brand-foreground"]!.$value),
      dark: String(tokens.dark!["--brand-foreground"]!.$value),
    },
    heroCta: hueSep > 30 ? "brand" : "primary",
  };
  if (brandScale !== 1) brandRecord.scale = Math.round(brandScale * 1000) / 1000;
  if (brandStrategy) brandRecord.strategy = brandStrategy;
  // The pin is intent: the validator lets a picked color sit below the solid
  // floor (the ceiling still binds). Stamped only for pins.
  if (input.brandSolid) brandRecord.pinned = true;
  (compiled.meta as Record<string, unknown>).brand = brandRecord;
  if (migrated.migrated) {
    (compiled.meta as Record<string, unknown>).dnaMigration = "v1→v2: retroFuturism dropped, chroma defaulted";
  }

  // Taste system (Brief #7 D1): descriptive only — direction, surprise,
  // evocative names, and the fix-ordered self-check. Nothing here moves a
  // token, so the AA gate below still rules on the repaired values.
  const direction = selectArtDirection(effectiveAxes, profile);
  const surprise = scoreSurprise(palette, profile);
  const tastePalette: NamedColor[] = NAMED_ROLES.map(({ role, token }) => {
    const value = light[token]?.$value;
    const str = typeof value === "string" ? value : "unknown";
    return { name: nameColor(str), role, token, value: str };
  });
  (compiled.meta as Record<string, unknown>).taste = {
    artDirection: direction,
    surprise,
    accentPlacement: [...ACCENT_PLACEMENT],
    palette: tastePalette,
  };
  const tasteCheck = runTasteSelfCheck({
    tokens,
    axes: effectiveAxes,
    profile,
    primaryHue: palette.primaryHue,
    accentHue: palette.accentHue,
    typeScale: compiled.typeScale,
  });
  (compiled.meta as Record<string, unknown>).selfCheck = {
    verdict: tasteCheck.verdict,
    notes: tasteCheck.notes,
  };

  // Final gate: AA re-verified (repair must not break it) and no enforce-tier
  // finding may survive. Anything left fails loudly — never ship a
  // violating generated payload.
  for (const mode of ["light", "dark"] as const) {
    for (const pair of tokenContract.contrastPairs) {
      const ratio = contrastRatio(
        String(tokens[mode]![pair.fg]!.$value),
        String(tokens[mode]![pair.bg]!.$value),
      );
      if (!Number.isNaN(ratio) && ratio < pair.minRatio) {
        throw new Error(
          `compiler design repair broke the AA gate: ${mode}.${pair.fg} on ${pair.bg} ratio ${ratio} < ${pair.minRatio}`,
        );
      }
    }
  }
  assertGeneratedCompliant(compiled);

  return compiled;
}

// ---------------------------------------------------------------------------
// Design repair pass (Deliverable 2: clamp into the envelope, record all)
// ---------------------------------------------------------------------------

function setChroma(token: TokenRecord[string], c: number): void {
  const parsed = parseOklch(String(token.$value));
  // Floor to 3 decimals: a ceiling repair must never round back above the cap.
  parsed.c = Math.floor(Math.min(Math.max(c, 0), 0.4) * 1000) / 1000;
  token.$value = formatOklch(parsed);
}

function repairTokenChroma(
  tokens: Record<string, TokenRecord>,
  mode: "light" | "dark",
  token: string,
  c: number,
  ruleId: string,
  adjustments: Adjustment[],
): void {
  const entry = tokens[mode]![token];
  if (!entry || typeof entry.$value !== "string") return;
  const before = entry.$value;
  setChroma(entry, c);
  if (entry.$value !== before) {
    adjustments.push({ mode, token, compiledValue: before, adjustedValue: entry.$value as string, ruleId });
  }
}

/** Circularly nearest hue to target within maxDelta of reference. */
function nearestHueInBand(hue: number, reference: number, maxDelta: number): number {
  const rel = ((hue - reference) % 360 + 360) % 360;
  if (rel <= maxDelta || rel >= 360 - maxDelta) return hue;
  return rel < 180
    ? ((reference + maxDelta) % 360 + 360) % 360
    : ((reference - maxDelta) % 360 + 360) % 360;
}

function repairTokenHue(
  tokens: Record<string, TokenRecord>,
  mode: "light" | "dark",
  token: string,
  hue: number,
  ruleId: string,
  adjustments: Adjustment[],
): void {
  const entry = tokens[mode]![token];
  if (!entry || typeof entry.$value !== "string") return;
  const parsed = parseOklch(String(entry.$value));
  if (Math.abs(parsed.h - hue) < 1e-9) return;
  const before = entry.$value;
  parsed.h = Math.round(hue * 1000) / 1000;
  entry.$value = formatOklch(parsed);
  adjustments.push({ mode, token, compiledValue: before, adjustedValue: entry.$value as string, ruleId });
}

const SOLID_FLOOR = 0.08;
const CHART_STEP_POOL = [2, 3, 4, 5, 6, 7, 8, 9, 10];

function repairDesign(
  tokens: Record<string, TokenRecord>,
  profile: GenerationProfile,
  adjustments: Adjustment[],
  chromaTarget: number,
  monochrome = false,
  brandScale = 1,
  strategy: BrandStrategyId | null = null,
  brandPinned = false,
): void {
  const bgCap = (mode: "light" | "dark"): number =>
    Math.round(
      (mode === "light" ? 0.025 : 0.035) *
        (profile === "enterprise" ? 0.6 : profile === "expressive" ? 1.5 : 1) *
        10000,
    ) / 10000;
  const solidCeiling = profile === "enterprise" ? 0.19 : profile === "expressive" ? 0.26 : 0.24;

  for (const mode of ["light", "dark"] as const) {
    const set = tokens[mode]!;
    const chromaOf = (token: string): number | null => {
      const entry = set[token];
      if (!entry || typeof entry.$value !== "string") return null;
      try {
        return parseOklch(entry.$value).c;
      } catch {
        return null;
      }
    };
    // color-bg-chroma-cap
    for (const token of ["--background", "--card", "--popover", "--muted", "--secondary"]) {
      const c = chromaOf(token);
      if (c !== null && c > bgCap(mode)) {
        repairTokenChroma(tokens, mode, token, bgCap(mode), "color-bg-chroma-cap", adjustments);
      }
    }
    // color-text-chroma-cap (calibrated 0.18) / color-border-chroma-cap (calibrated 0.15)
    for (const token of [
      "--foreground", "--card-foreground", "--popover-foreground", "--primary-foreground",
      "--secondary-foreground", "--accent-foreground", "--destructive-foreground", "--muted-foreground",
      "--brand-foreground",
    ]) {
      const c = chromaOf(token);
      if (c !== null && c > 0.18) {
        repairTokenChroma(tokens, mode, token, 0.18, "color-text-chroma-cap", adjustments);
      }
    }
    for (const token of ["--border", "--input"]) {
      const c = chromaOf(token);
      if (c !== null && c > 0.15) {
        repairTokenChroma(tokens, mode, token, 0.15, "color-border-chroma-cap", adjustments);
      }
    }
    // color-solid-chroma-band (chroma-scaled floor + profile-scaled ceiling:
    // ceilings bind runaway saturation; the floor yields to low-chroma intent)
    // Rounded to 3 decimals: the token quantization below means a floor
    // must be exactly representable or repair can never satisfy it.
    const solidFloor = monochrome ? 0 : Math.round(SOLID_FLOOR * chromaTarget * 1000) / 1000;
    // Brand Token brief: the brand solid lives in the same chroma band —
    // ceilings bind runaway saturation; the floor yields to low-chroma
    // intent exactly like the other solids. The picker ink voice is intent
    // too: a neutral mark never gets floored back into color. An exact
    // picker color is intent as well — a gray pick stays gray; the ceiling
    // still binds, so the pin can never widen a registry.
    const brandFloor = monochrome || brandScale === 0 || brandPinned ? 0 : solidFloor;
    for (const token of ["--primary", "--accent", "--destructive", "--brand"]) {
      // Mark-only intent: the ink structure (and the brand-lifted accent,
      // which carries the mark voice rather than the solid band) is the
      // strategy, not an accident — the floor yields to it like monochrome.
      const floor =
        token === "--brand"
          ? brandFloor
          : (brandPinned && strategy === "unified" && token === "--primary") ||
              (strategy === "mark-only" && (token === "--primary" || token === "--accent"))
            ? 0
            : solidFloor;
      const c = chromaOf(token);
      if (c !== null && c < floor) {
        repairTokenChroma(tokens, mode, token, floor, "color-solid-chroma-band", adjustments);
      } else if (c !== null && c > solidCeiling) {
        repairTokenChroma(tokens, mode, token, solidCeiling, "color-solid-chroma-band", adjustments);
      }
    }
    // color-chroma-taper
    for (const [token, entry] of Object.entries(set)) {
      if (typeof entry.$value !== "string" || !entry.$value.startsWith("oklch(")) continue;
      try {
        const parsed = parseOklch(entry.$value);
        if ((parsed.l >= 0.95 || parsed.l <= 0.08) && parsed.c > 0.03) {
          repairTokenChroma(tokens, mode, token, 0.03, "color-chroma-taper", adjustments);
        }
      } catch {
        continue;
      }
    }
    // color-neutral-tint + color-enterprise-accent (hue repairs toward band)
    const primaryHue = (() => {
      const entry = set["--primary"];
      if (!entry || typeof entry.$value !== "string") return null;
      try {
        const parsed = parseOklch(entry.$value);
        return parsed.c >= 0.03 ? parsed.h : null;
      } catch {
        return null;
      }
    })();
    if (primaryHue !== null) {
      for (const token of [
        "--background", "--card", "--popover", "--muted", "--secondary", "--border", "--input",
      ]) {
        const entry = set[token];
        if (!entry || typeof entry.$value !== "string") continue;
        try {
          const parsed = parseOklch(entry.$value);
          const rel = ((parsed.h - primaryHue) % 360 + 360) % 360;
          const dist = Math.min(rel, 360 - rel);
          if (parsed.c > 0.015 && dist > 15) {
            repairTokenHue(tokens, mode, token, nearestHueInBand(parsed.h, primaryHue, 15), "color-neutral-tint", adjustments);
          }
        } catch {
          continue;
        }
      }
      if (profile === "enterprise") {
        const entry = set["--accent"];
        if (entry && typeof entry.$value === "string") {
          try {
            const parsed = parseOklch(entry.$value);
            const rel = ((parsed.h - primaryHue) % 360 + 360) % 360;
            const dist = Math.min(rel, 360 - rel);
            if (parsed.c > 0.015 && dist > 25) {
              repairTokenHue(tokens, mode, "--accent", primaryHue, "color-enterprise-accent", adjustments);
            }
          } catch {
            // leave for the contract validator
          }
        }
      }
    }
    // border-width-profile-bounds (clamp to the profile max; enterprise never exceeds 1px)
    const borderBound = profile === "enterprise" ? 1 : profile === "expressive" ? 3 : 2;
    const borderWidth = set["--border-width"];
    if (borderWidth && typeof borderWidth.$value === "string") {
      const match = borderWidth.$value.match(/^(\d+(?:\.\d+)?)px$/);
      if (match && Number(match[1]) > borderBound) {
        const before = borderWidth.$value;
        borderWidth.$value = `${borderBound}px`;
        adjustments.push({ mode, token: "--border-width", compiledValue: before, adjustedValue: `${borderBound}px`, ruleId: "border-width-profile-bounds" });
      }
    }
    // radius-profile-bounds
    const bound = profile === "enterprise" ? 0.5 : profile === "expressive" ? 1.5 : 1;
    const radius = set["--radius"];
    if (radius && typeof radius.$value === "string") {
      const match = radius.$value.match(/^([\d.]+)(rem|px)$/);
      if (match) {
        const rem = match[2] === "px" ? Number(match[1]) / 16 : Number(match[1]);
        if (rem > bound) {
          const before = radius.$value;
          const after = `${Math.round(bound * 1000) / 1000}rem`;
          radius.$value = after;
          if (after !== before) {
            adjustments.push({ mode, token: "--radius", compiledValue: before, adjustedValue: after, ruleId: "radius-profile-bounds" });
          }
        }
      }
    }
    // motion-bounds (duration clamp; unknown easings fall back to the set)
    for (const token of ["--motion-fast", "--motion-normal"] as const) {
      const entry = set[token];
      if (!entry || typeof entry.$value !== "object" || entry.$value === null) continue;
      const record = entry.$value as Record<string, unknown>;
      const before = JSON.stringify(record);
      const match = typeof record.duration === "string" ? record.duration.match(/^(\d+(?:\.\d+)?)(ms|s)$/) : null;
      if (match) {
        const ms = match[2] === "s" ? Number(match[1]) * 1000 : Number(match[1]);
        if (ms < 50 || ms > 400) {
          record.duration = `${Math.min(400, Math.max(50, Math.round(ms)))}ms`;
        }
      }
      if (typeof record.easing === "string" && !CLOSED_EASINGS.has(record.easing)) {
        record.easing = "cubic-bezier(0.4, 0, 0.2, 1)";
      }
      const after = JSON.stringify(record);
      if (after !== before) {
        adjustments.push({
          mode,
          token,
          compiledValue: before,
          adjustedValue: after,
          ruleId: "motion-bounds",
        });
      }
    }
    repairCharts(set, mode, adjustments);
  }
}

/**
 * Chart separation repair: colliding charts move to the free scale step with
 * the most lightness separation (charts carry no contrast pairs, so L moves
 * are safe). Deterministic iteration order; throws naming the rule when the
 * pool cannot separate a pair.
 */
function repairCharts(
  set: TokenRecord,
  mode: "light" | "dark",
  adjustments: Adjustment[],
): void {
  const names = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"];
  const read = (token: string): { l: number; c: number; h: number } | null => {
    const entry = set[token];
    if (!entry || typeof entry.$value !== "string") return null;
    try {
      return parseOklch(entry.$value);
    } catch {
      return null;
    }
  };
  const labOf = (v: { l: number; c: number; h: number }): [number, number, number] => {
    const rad = (v.h * Math.PI) / 180;
    return [v.l, v.c * Math.cos(rad), v.c * Math.sin(rad)];
  };
  const dist = (a: [number, number, number], b: [number, number, number]): number =>
    Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
  const hueDist = (a: number, b: number): number => {
    const d = Math.abs(((a - b) % 360 + 360) % 360);
    return Math.min(d, 360 - d);
  };
  const violates = (a: { l: number; c: number; h: number }, b: { l: number; c: number; h: number }): boolean => {
    if (dist(labOf(a), labOf(b)) < 0.08) return true;
    return hueDist(a.h, b.h) < 25 && Math.abs(a.l - b.l) < 0.25;
  };
  const moveResolves = (self: string, candidate: { l: number; c: number; h: number }): boolean => {
    for (const other of names) {
      if (other === self) continue;
      const o = read(other);
      if (o && violates(candidate, o)) return false;
    }
    return true;
  };
  const move = (name: string): boolean => {
    const current = read(name);
    if (!current) return false;
    // First pool step (fixed order → deterministic) that resolves every
    // pair the moved chart participates in.
    for (const step of CHART_STEP_POOL) {
      const candidate = { ...current, l: LADDER[step]! };
      if (!moveResolves(name, candidate)) continue;
      const entry = set[name]!;
      const before = String(entry.$value);
      const parsed = parseOklch(before);
      parsed.l = LADDER[step]!;
      entry.$value = formatOklch(parsed);
      if (String(entry.$value) !== before) {
        adjustments.push({
          mode,
          token: name,
          compiledValue: before,
          adjustedValue: String(entry.$value),
          ruleId: "color-chart-separation",
        });
      }
      return true;
    }
    return false;
  };
  for (let iter = 0; iter < 12; iter++) {
    let moved = false;
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const a = read(names[i]!);
        const b = read(names[j]!);
        if (!a || !b || !violates(a, b)) continue;
        // Try the higher-index chart first, then the lower one; neither
        // movable means the pool cannot separate this pair → loud failure.
        if (move(names[j]!)) {
          moved = true;
          continue;
        }
        if (move(names[i]!)) {
          moved = true;
          continue;
        }
        throw new Error(`compiler design repair failed [color-chart-separation]: no scale step separates ${mode}.${names[i]}/${names[j]}`);
      }
    }
    if (!moved) return;
  }
  const leftover = (() => {
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const a = read(names[i]!);
        const b = read(names[j]!);
        if (a && b && violates(a, b)) return `${names[i]}/${names[j]}`;
      }
    }
    return null;
  })();
  if (leftover) {
    throw new Error(`compiler design repair failed [color-chart-separation]: ${mode}.${leftover} still collides after lightness spread`);
  }
}

/**
 * Compiles and runs the full payload validator. A failure here is a compiler
 * bug: the error names the mapping output that broke the contract.
 */
export async function compileValidIdentity(
  input: CompileInput,
  validate: (identity: ArcheIdentity) => { ok: boolean; issues: Array<{ path: string; message: string }> },
): Promise<ArcheIdentity> {
  const compiled = compileIdentity(input);
  const result = validate(compiled);
  if (!result.ok) {
    throw new Error(
      `compiler mapping produced an invalid payload:\n${result.issues.map((i) => `- ${i.path}: ${i.message}`).join("\n")}`,
    );
  }
  return compiled;
}
