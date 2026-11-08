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
  DNA_COMPILER_VERSION,
  type DnaObject,
  type DnaPalette,
  type DnaSource,
} from "@arche/foundation/dna";
import { expectedFontStack, fontEntriesById } from "@arche/foundation/fonts";
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
  /** Complete payload the mappings build on (Arche aurora in practice). */
  base: ArcheIdentity;
}

export interface Adjustment {
  mode: string;
  token: string;
  compiledValue: string;
  adjustedValue: string;
  pair: string;
  ratioBefore: number;
  ratioAfter: number;
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
}

function voiceOf(axes: DnaObject, palette: DnaPalette): Voice {
  const chroma = Math.min(
    0.28,
    Math.max(0.02, 0.03 + axes.energy * 0.09 + axes.playfulness * 0.07 - axes.formality * 0.05),
  );
  const neutralChroma = 0.004 + axes.warmth * 0.012;
  const neutralHue = palette.neutralHue * (1 - axes.warmth * 0.5) + 70 * (axes.warmth * 0.5);
  return { chroma, neutralChroma, neutralHue };
}

// ---------------------------------------------------------------------------
// Mapping tables (this is Arche's design IP — explicit, versioned, readable)
// ---------------------------------------------------------------------------

/** sharpness 0 → fully rounded scale head, 1 → no radius. */
function radiusFor(sharpness: number): string {
  const rem = Math.round((1 - clamp01(sharpness)) * 1000) / 1000;
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
        fast: { duration: "300ms", easing: "ease-in-out" },
        normal: { duration: "450ms", easing: "ease-in-out" },
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

/** Deterministic registry picks. Priority: pixel > era-playful > formal > warm > neutral. */
function typeFor(axes: DnaObject): TypePick {
  if (axes.material === "pixel") {
    return { sans: "space-grotesk", display: "press-start-2p", mono: "space-mono" };
  }
  if (axes.retroFuturism >= 0.6 && axes.playfulness >= 0.5) {
    return { sans: "space-grotesk", display: "bungee", mono: "space-mono" };
  }
  if (axes.formality >= 0.65) {
    return { sans: "inter", display: "source-serif-4", mono: "ibm-plex-mono" };
  }
  if (axes.warmth >= 0.65) {
    return { sans: "nunito-sans", display: "fraunces", mono: "dm-mono" };
  }
  return { sans: "inter", display: "inter", mono: "geist-mono" };
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

/** White or black text, whichever already passes AA on bg (else white; the AA pass finishes it). */
function autoText(bg: string): string {
  const white = "oklch(0.99 0 0)";
  const black = "oklch(0.2 0.01 250)";
  return contrastRatio(white, bg) >= 4.5 ? white : black;
}

function buildModeTokens(
  mode: "light" | "dark",
  axes: DnaObject,
  palette: DnaPalette,
  voice: Voice,
): TokenRecord {
  const dark = mode === "dark";
  const P = palette.primaryHue;
  const A = palette.accentHue;
  const N = voice.neutralHue;
  const C = voice.chroma;
  const NC = voice.neutralChroma;
  // Surface/text anchors: near-white↔near-black ends of the neutral scale.
  const bg = scaleColor(N, NC, dark ? 11 : 0);
  const surface = scaleColor(N, NC, dark ? 10 : 1);
  const ink = scaleColor(N, NC * 2, dark ? 0 : 11);
  const primary = scaleColor(P, C, dark ? 8 : 5);
  const primaryInk = autoText(primary);
  const secondary = scaleColor(P, C * 0.45, dark ? 9 : 2);
  const secondaryInk = scaleColor(P, C, dark ? 1 : 10);
  const accent = scaleColor(A, C * 0.8, dark ? 9 : 2);
  const accentInk = scaleColor(A, C, dark ? 1 : 10);
  const muted = scaleColor(N, NC * 1.5, dark ? 9 : 2);
  const mutedInk = scaleColor(N, NC * 2, dark ? 2 : 9);
  const destructive = formatOklch({ l: dark ? 0.6 : 0.55, c: 0.22, h: 25 });
  const destructiveInk = autoText(destructive);
  const chartHues = [P, A, P + 50, A + 130, P + 200];
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
    "--muted": color(muted),
    "--muted-foreground": color(mutedInk),
    "--border": color(scaleColor(N, NC, dark ? 8 : 3)),
    "--input": color(scaleColor(N, NC, dark ? 8 : 3)),
    "--ring": color(scaleColor(P, C, dark ? 7 : 6)),
    "--radius": { $type: "dimension", $value: radiusFor(axes.sharpness) },
  };
  chartHues.forEach((hue, i) => {
    tokens[`--chart-${i + 1}`] = color(scaleColor(hue, Math.min(0.18, C), dark ? 7 : 5));
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
  const voice = voiceOf(axes, palette);
  const compiled: ArcheIdentity = JSON.parse(JSON.stringify(base)) as ArcheIdentity;

  compiled.meta = {
    ...compiled.meta,
    name,
    contractVersion: tokenContract.contractVersion,
  };

  const tokens: Record<string, TokenRecord> = {
    light: buildModeTokens("light", axes, palette, voice),
    dark: buildModeTokens("dark", axes, palette, voice),
  };

  // Font stacks must mirror the selected registry families exactly.
  const byId = fontEntriesById();
  const pick = typeFor(axes);
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

  compiled.icons = iconsFor(axes);
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

  const treatment = materialTreatment(axes.material, axes.ornament, voice.neutralHue);
  applyKnobs(compiled.components, axes, treatment.shadowTarget);

  // AA pass per mode, pairs in contract order (deterministic).
  const adjustments: Adjustment[] = [];
  for (const mode of ["light", "dark"] as const) {
    for (const pair of tokenContract.contrastPairs) {
      adjustPair(tokens[mode]!, mode, pair.fg, pair.bg, pair.minRatio, adjustments);
    }
  }
  compiled.meta.adjustments = adjustments;

  compiled.dna = {
    source: { ...source },
    axes: { ...axes },
    palette: { ...palette },
    compilerVersion: COMPILER_VERSION,
  };

  return compiled;
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
