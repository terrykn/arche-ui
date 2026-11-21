import {
  compileValidIdentity,
  deriveTypePick,
  isMonochromeDna,
} from "@arche/registry-core/compiler";
import {
  applyPickerDelta,
  constraintSlots,
  deriveBrandColors,
  deriveBrandOptions,
  derivePaletteOptions,
  paletteFromBrand,
  resolveBrandColor,
  deriveProfile,
  designRulesVersion,
  EXAMPLE_RECORDS,
  loadCorpus,
  nameColor,
  normalizePaletteVariants,
  normalizeTypefaceVariants,
  parseConstraints,
  retrieveExemplars,
  typefaceSpec,
  validateIdentity,
  verifyAdherence,
  withBrandDefault,
  WORD_CHIPS,
  type ArcheIdentity,
  type BrandOption,
  type CorpusEntry,
  type DnaDelta,
  type DnaObject,
  type DnaPalette,
  type GenerationProfile,
  type PaletteVariant,
  type PickerSelections,
  type PromptConstraints,
  type TypefaceOptionSpec,
  type TypefaceVariant,
} from "@arche/registry-core";
import {
  dnaObjectSchema,
  dnaPaletteSchema,
  generationProfileSchema,
  paletteVariantSchema,
  typefaceVariantSchema,
} from "@arche/foundation/dna";
import { contrastRatio } from "@arche/foundation/contract/validate-tokens";
import { createServiceClient } from "@/lib/supabase/service";
import { fixturesDir, slugify } from "@/lib/starter";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { generateDna, generateDnaDelta } from "./provider";
import { GENERATION_PROMPT_MAX_LENGTH } from "@/lib/hero-prompt";

/**
 * Generation service (Brief #6 §6). ONE implementation behind the dashboard
 * door (§7) and the MCP tool (§8): text door + prompt edits (text-only).
 * Creations land as drafts; publishing stays the separate explicit action.
 * Every attempt writes a generation_logs row — including failures (Rule 7) —
 * and changes nothing on failure (Rule 5, FR-GEN-6).
 */

export interface GenerationOutcome {
  libraryId: string;
  slug: string;
  name: string;
  adjustments: number;
}

function capLimit(): number {
  const raw = Number(process.env.GENERATIONS_PER_PERIOD ?? "100");
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 100;
}

async function checkCap(userId: string): Promise<void> {
  const service = createServiceClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await service
    .from("generation_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .neq("status", "capped")
    .gte("created_at", since);
  if (error) {
    throw new Error(`metering check failed: ${error.message}`);
  }
  if ((count ?? 0) >= capLimit()) {
    await service.from("generation_logs").insert({
      user_id: userId,
      kind: "generate",
      model: process.env.LLM_MODEL ?? "unconfigured",
      status: "capped",
      error: `generation allowance reached (${capLimit()} per 24h) — try again later`,
    });
    throw new Error(
      `Generation allowance reached (${capLimit()} per 24 hours). Try again later — drafts and published versions are untouched.`,
    );
  }
}

interface LogRow {
  user_id: string;
  library_id?: string | null;
  kind: "generate" | "edit";
  prompt?: string | null;
  source_ref?: string | null;
  dna?: unknown;
  dna_delta?: unknown;
  payload_diff?: unknown;
  adjustments?: unknown;
  model: string;
  tokens_in?: number | null;
  tokens_out?: number | null;
  status: "ok" | "failed";
  error?: string | null;
}

/**
 * Stored `dna` shape for generations (Brief #8): the model's DNA-only
 * single-call response — axes + palette — plus the compiler-derived
 * profile and rules version. `dna_delta` holds the diff-scoped delta.
 * No table migration: the existing jsonb columns carry the sections.
 */
async function logAttempt(row: LogRow): Promise<string | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("generation_logs")
    .insert({
      user_id: row.user_id,
      library_id: row.library_id ?? null,
      kind: row.kind,
      prompt: row.prompt ?? null,
      source_ref: row.source_ref ?? null,
      dna: (row.dna ?? null) as never,
      dna_delta: (row.dna_delta ?? null) as never,
      payload_diff: (row.payload_diff ?? null) as never,
      adjustments: (row.adjustments ?? null) as never,
      model: row.model,
      tokens_in: row.tokens_in ?? null,
      tokens_out: row.tokens_out ?? null,
      status: row.status,
      error: row.error ?? null,
    })
    .select("id")
    .single();
  return (data as unknown as { id: string } | null)?.id ?? null;
}

/** Recursive payload diff, capped (inspectable in generation_logs, Rule 6 proof). */
export function diffPayloads(before: unknown, after: unknown, limit = 200): Array<{ path: string; before: unknown; after: unknown }> {
  const out: Array<{ path: string; before: unknown; after: unknown }> = [];
  const walk = (a: unknown, b: unknown, path: string): void => {
    if (out.length >= limit || JSON.stringify(a) === JSON.stringify(b)) return;
    if (
      a !== null && b !== null &&
      typeof a === "object" && typeof b === "object" &&
      !Array.isArray(a) && !Array.isArray(b)
    ) {
      const keys = new Set([...Object.keys(a as object), ...Object.keys(b as object)]);
      for (const key of [...keys].sort()) {
        walk(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key],
          path ? `${path}.${key}` : key,
        );
        if (out.length >= limit) return;
      }
      return;
    }
    out.push({ path, before: a ?? null, after: b ?? null });
  };
  walk(before, after, "");
  return out;
}

function auroraBase(): ArcheIdentity {
  return JSON.parse(
    readFileSync(join(fixturesDir(), "identity.default.json"), "utf8"),
  ) as ArcheIdentity;
}

/** Deterministic working title from the prompt (editable in the Studio — §7). */
function titleFromPrompt(prompt: string, fallback: string): string {
  const words = prompt.trim().split(/\s+/).filter(Boolean).slice(0, 6);
  const title = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return (title || fallback).slice(0, 80);
}

async function uniqueSlug(service: ReturnType<typeof createServiceClient>, owner: string, name: string): Promise<string> {
  const base = slugify(name);
  for (let n = 0; ; n++) {
    const candidate = n === 0 ? base : `${base}-${n + 1}`;
    const { data } = await service
      .from("libraries")
      .select("id")
      .eq("owner", owner)
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
}

/**
 * Prompt-adherence helpers (Brief: words → numbers → code). Deterministic:
 * same prompt → same constraints → same exemplars. The model is the only
 * nondeterministic step; constraints are stored on the draft and in logs.
 */
export function constraintsFor(prompt: string): PromptConstraints {
  return parseConstraints(prompt);
}

/** Nearest 1–3 corpus entries for the parsed constraints (empty when below threshold). */
export function exemplarsFor(constraints: PromptConstraints): CorpusEntry[] {
  try {
    return retrieveExemplars(constraints, loadCorpus());
  } catch {
    return [];
  }
}

/** Verifier failure rendered as the single targeted repair prompt (exact numbers). */
export function adherenceRepairFeedback(failures: string[]): string {
  return `Prompt-adherence check failed on the compiled tokens (code-measured, not taste): ${failures.join("; ")}. Regenerate DNA that satisfies these numbers (e.g. lower chroma, tighter hue spread) while keeping the same character.`;
}

/**
 * Text door (FR-SHIFT-1): phrase → validated draft. Invalid model output
 * (after the provider's retry), provider errors, and validation failures
 * all land here: failed log row, nothing stored.
 *
 * Prompt-adherence: parse → retrieve → generate → enforce (in compile) →
 * verify → at most one targeted model repair, then re-enforce. Code wins
 * over DNA; every enforcement is logged in meta.adjustments[].
 */
export async function generateFromPhrase(
  userId: string,
  prompt: string,
  name?: string,
): Promise<GenerationOutcome & { profile: string }> {
  await checkCap(userId);
  const base = auroraBase();
  const rulesVersion = designRulesVersion();
  try {
    const constraints = constraintsFor(prompt);
    const exemplars = exemplarsFor(constraints);
    const call = await generateDna(prompt, { exemplars, constraints });
    const identityName = (name?.trim() || titleFromPrompt(prompt, "Untouched Idea")).slice(0, 80);
    const compileOnce = (output: typeof call.output, profile: GenerationProfile): Promise<ArcheIdentity> =>
      compileValidIdentity(
        {
          name: identityName,
          source: { type: "phrase", promptText: prompt.trim().slice(0, GENERATION_PROMPT_MAX_LENGTH) },
          axes: output.axes,
          palette: output.palette,
          profile,
          base,
          constraints,
        },
        validateIdentity,
      );
    const profile = deriveProfile(call.output.axes);
    let compiled: ArcheIdentity;
    try {
      compiled = await compileOnce(call.output, profile);
    } catch (err) {
      // Unrepairable enforce-tier violation: one follow-up model call
      // carrying the named rule findings, then recompile once. Anything
      // else throws straight to the failed-log path below.
      if (!(err instanceof Error) || !err.message.startsWith("generated payload violates design rules")) {
        throw err;
      }
      const retry = await generateDna(prompt, {
        exemplars,
        constraints,
        repairFeedback: err.message,
      });
      // Attribute the single follow-up call's tokens alongside the first.
      call.tokensIn = (call.tokensIn ?? 0) + (retry.tokensIn ?? 0);
      call.tokensOut = (call.tokensOut ?? 0) + (retry.tokensOut ?? 0);
      const final = retry;
      const retryProfile = deriveProfile(final.output.axes);
      compiled = await compileOnce(final.output, retryProfile);
      call.output = final.output;
    }
    // Deterministic verifier on the final compiled tokens (what the user
    // will actually see). One targeted repair citing exact numbers, then
    // re-enforce deterministically. Max 2 adherence attempts total.
    let report = verifyAdherence(compiled, constraints);
    if (!report.pass) {
      const repair = await generateDna(prompt, {
        exemplars,
        constraints,
        repairFeedback: adherenceRepairFeedback(report.failures),
      });
      call.tokensIn = (call.tokensIn ?? 0) + (repair.tokensIn ?? 0);
      call.tokensOut = (call.tokensOut ?? 0) + (repair.tokensOut ?? 0);
      const repairProfile = deriveProfile(repair.output.axes);
      const recompiled = await compileOnce(repair.output, repairProfile);
      const second = verifyAdherence(recompiled, constraints);
      if (second.pass) {
        compiled = recompiled;
        call.output = repair.output;
        report = second;
      } else {
        // Keep the best-scoring candidate but never silently ship it:
        // surface the code-measured failure instead of storing a mismatch.
        throw new Error(
          `prompt-adherence check failed: ${second.failures.join("; ")} (max chroma ${second.metrics.maxChroma}, hue spread ${second.metrics.hueSpread}°)`,
        );
      }
    }
    (compiled.meta as Record<string, unknown>).promptConstraints = constraints;
    (compiled.meta as Record<string, unknown>).promptSlots = constraintSlots(constraints);
    (compiled.meta as Record<string, unknown>).promptSlots = [
      ...((compiled.meta as Record<string, unknown>).promptSlots as string[]),
      `Brand: ${nameColor(String((compiled.tokens.light as unknown as Record<string, { $value?: unknown }>)["--brand"]?.$value ?? ""))}`,
    ];
    const service = createServiceClient();
    const slug = await uniqueSlug(service, userId, identityName);
    const { data, error } = await service
      .from("libraries")
      .insert({ owner: userId, name: identityName, slug, visibility: "private", payload: compiled as never })
      .select("id")
      .single();
    if (error || !data) {
      throw new Error(`draft store failed: ${error?.message ?? "unknown"}`);
    }
    const libraryId = (data as unknown as { id: string }).id;
    await logAttempt({
      user_id: userId,
      library_id: libraryId,
      kind: "generate",
      prompt: prompt.trim().slice(0, GENERATION_PROMPT_MAX_LENGTH),
      dna: {
        axes: call.output.axes,
        palette: call.output.palette,
        profile: compiled.dna!.profile,
        rulesVersion,
        constraints,
        slots: constraintSlots(constraints),
        brandDefaulted: withBrandDefault(call.output.palette).defaulted,
      },
      payload_diff: diffPayloads(base, compiled),
      adjustments: (compiled.meta as Record<string, unknown>).adjustments ?? [],
      model: call.model,
      tokens_in: call.tokensIn,
      tokens_out: call.tokensOut,
      status: "ok",
    });
    return {
      libraryId,
      slug,
      name: identityName,
      profile: compiled.dna!.profile,
      adjustments: ((compiled.meta as Record<string, unknown>).adjustments as unknown[]).length,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Failure isolation (FR-GEN-6): the only write is the failed log row.
    await logAttempt({
      user_id: userId,
      kind: "generate",
      prompt: prompt.trim().slice(0, GENERATION_PROMPT_MAX_LENGTH),
      model: process.env.LLM_MODEL ?? "unconfigured",
      status: "failed",
      error: message,
    });
    throw err instanceof Error ? err : new Error(message);
  }
}

/**
 * Modal creation, phase 1: run the ONE model call for a prompt and return
 * its DNA without storing any library. The modal holds this in memory
 * across its 3 steps; closing the modal drops it — nothing was created.
 * The attempt is logged (failures included, Rule 7) with no library link;
 * phase 2 links the row to the created library.
 */
/**
 * Honest step-1 swatches: real compiled light-mode tokens, never
 * illustrative fills. Brand Token brief: Background, Primary, Accent,
 * and Brand — each a distinct role, each labeled with its derived name.
 */
export interface PalettePreviewSwatches {
  surface: string;
  surfaceText: string;
  primary: string;
  onPrimary: string;
  accent: string;
  onAccent: string;
  brand: string;
  onBrand: string;
  secondary: string;
  secondaryText: string;
}

export interface PalettePreviewOption {
  id: string;
  name: string;
  reason: string;
  anchors: DnaPalette;
  swatches: PalettePreviewSwatches;
}

/** Emitted values for one compiled option, both modes. */
export interface BrandSwatchSet {
  light: PalettePreviewSwatches;
  dark: PalettePreviewSwatches;
}

/**
 * Palette-row option: HOW the brand is used. One compiled system per usage,
 * emitted values only — the row renders plain color strips, never a composed
 * component preview.
 */
export interface UsagePreviewOption {
  id: string;
  /** Evocative color name of the emitted brand solid (naming table). */
  name: string;
  /** Usage label: As Dreamed | On Primary | Muted | Tertiary | Ink. */
  roleLabel: string;
  /** Recorded reason, e.g. secondary-muted / tertiary-accentHue / ink. */
  reason: string;
  brandHue: number;
  swatches: BrandSwatchSet;
}

/**
 * Brand-row option: ONE static color and nothing else. The five options are
 * fixed and independent of the generation; picking one rebuilds the palette
 * row from that single hue (paletteFromBrand), so the color drives the
 * palettes.
 */
export interface BrandColorPreviewOption {
  id: string;
  name: string;
  brandHue: number;
  /** Emitted --brand at this hue and full voice (light mode) — the swatch. */
  swatch: string;
}

export interface TypefacePreviewFace {
  id: string;
  family: string;
  stack: string;
  cssUrl: string | null;
}

export interface TypefacePreviewOption {
  id: string;
  name: string;
  reason: string;
  display: TypefacePreviewFace;
  body: TypefacePreviewFace;
}

export interface GenerationPreview {
  logId: string | null;
  axes: DnaObject;
  palette: DnaPalette;
  profile: GenerationProfile;
  constraints: PromptConstraints;
  slots: string[];
  paletteOptions: PalettePreviewOption[];
  /**
   * Palette row: up to five Material 3 brand usages (as dreamed, on primary,
   * muted secondary, tertiary, ink), same single call. Rendered as colors.
   */
  usageOptions: UsagePreviewOption[];
  /**
   * Brand row: five static colors, independent of the generation — a single
   * color selection, nothing composed. Picking one rebuilds the palette
   * row from that hue.
   */
  brandColors: BrandColorPreviewOption[];
  /**
   * Precalculated palette rows, one per static brand color: switching brand
   * is an instant tab-switch, never a fetch. Same compile as the main row,
   * over each color's static palette — still zero model calls.
   */
  brandPalettes: Record<string, UsagePreviewOption[]>;
  typeOptions: TypefacePreviewOption[];
}

function swatchesFor(
  compiled: ArcheIdentity,
  mode: "light" | "dark" = "light",
): PalettePreviewSwatches {
  const set = compiled.tokens[mode] as unknown as Record<string, { $value?: unknown }>;
  const str = (name: string, fallback: string): string => {
    const v = set[name]?.$value;
    return typeof v === "string" && v.length > 0 ? v : fallback;
  };
  return {
    surface: str("--card", "#ffffff"),
    surfaceText: str("--card-foreground", "#111111"),
    primary: str("--primary", "#333333"),
    onPrimary: str("--primary-foreground", "#ffffff"),
    accent: str("--accent", "#555555"),
    onAccent: str("--accent-foreground", "#ffffff"),
    brand: str("--brand", "#333333"),
    onBrand: str("--brand-foreground", "#ffffff"),
    secondary: str("--secondary", "#eeeeee"),
    secondaryText: str("--secondary-foreground", "#111111"),
  };
}

const FALLBACK_SWATCHES: PalettePreviewSwatches = {
  surface: "#ffffff",
  surfaceText: "#111111",
  primary: "#333333",
  onPrimary: "#ffffff",
  accent: "#555555",
  onAccent: "#ffffff",
  brand: "#333333",
  onBrand: "#ffffff",
  secondary: "#eeeeee",
  secondaryText: "#111111",
};

/**
 * Compile each palette variant to its honest preview swatches (same axes,
 * profile, and prompt constraints as the final compile — enforcement
 * included). A variant that cannot compile falls back to the base
 * palette's swatches; positions never shift.
 */
async function previewPaletteOptions(args: {
  name: string;
  source: { type: "phrase"; promptText: string };
  axes: DnaObject;
  basePalette: DnaPalette;
  variants: [PaletteVariant, PaletteVariant, PaletteVariant];
  profile: GenerationProfile;
  base: ArcheIdentity;
  constraints: PromptConstraints;
}): Promise<PalettePreviewOption[]> {
  const compile = (palette: DnaPalette): Promise<PalettePreviewSwatches> =>
    compileValidIdentity(
      {
        name: args.name,
        source: args.source,
        axes: args.axes,
        palette,
        profile: args.profile,
        base: args.base,
        constraints: args.constraints,
      },
      validateIdentity,
    ).then(swatchesFor);
  const baseSwatches = await compile(args.basePalette).catch(() => FALLBACK_SWATCHES);
  return Promise.all(
    args.variants.map(async (variant) => ({
      id: variant.id,
      name: variant.name,
      reason: variant.reason,
      anchors: variant.anchors,
      swatches: await compile(variant.anchors).catch(() => baseSwatches),
    })),
  );
}

/**
 * True when the brief (or the DNA) forces every chroma to zero. The brand
 * row then has no second color to offer: hue rotations emit the same gray,
 * so the distinctness gate dedupes them down to "As Dreamed".
 */
function achromaticBrief(
  axes: DnaObject,
  palette: DnaPalette,
  constraints: PromptConstraints,
): boolean {
  if (constraints.chromaCap !== undefined && constraints.chromaCap <= 0.02) return true;
  if (typeof axes.chroma === "number" && axes.chroma === 0) return true;
  return isMonochromeDna({ chroma: axes.chroma }, palette);
}

/**
 * Compile each brand usage once so the palette row shows real emitted values
 * (never illustrative fills). A usage whose emitted brand pair cannot pass AA
 * in BOTH modes does not ship — the compiler never emits a failing foreground.
 */
async function previewUsageOptions(args: {
  name: string;
  source: { type: "phrase"; promptText: string };
  axes: DnaObject;
  palette: DnaPalette;
  profile: GenerationProfile;
  constraints: PromptConstraints;
  base: ArcheIdentity;
  achromatic: boolean;
}): Promise<UsagePreviewOption[]> {
  return compileUsageOptions({ ...args, basePalette: args.palette });
}

/**
 * Compile one usage set from an explicit base palette. The generation's own
 * row uses the dreamed palette; a picked brand color re-runs the same
 * compile over its static palette (paletteFromBrand), so selecting a brand
 * rebuilds the palette row from that single hue — same code, same gates.
 */
async function compileUsageOptions(args: {
  name: string;
  source: { type: "phrase"; promptText: string };
  axes: DnaObject;
  basePalette: DnaPalette;
  profile: GenerationProfile;
  constraints: PromptConstraints;
  base: ArcheIdentity;
  achromatic: boolean;
}): Promise<UsagePreviewOption[]> {
  const context = { profile: args.profile, achromatic: args.achromatic };
  const options = deriveBrandOptions(args.basePalette, context);
  const out: UsagePreviewOption[] = [];
  for (const option of options) {
    try {
      const compiled = await compileValidIdentity(
        {
          name: args.name,
          source: args.source,
          axes: args.axes,
          // The usage pins the hue within the base palette.
          palette: { ...args.basePalette, brandHue: option.brandHue },
          profile: args.profile,
          base: args.base,
          constraints: args.constraints,
          // The mark renders at the usage's voice: muted and neutral ink
          // compile their own solids (AA-gated below).
          brandChromaScale: option.chromaScale,
        },
        validateIdentity,
      );
      const light = swatchesFor(compiled, "light");
      const dark = swatchesFor(compiled, "dark");
      const lightOk = contrastRatio(light.onBrand, light.brand) >= 4.5;
      const darkOk = contrastRatio(dark.onBrand, dark.brand) >= 4.5;
      if (!lightOk || !darkOk) continue;
      out.push({
        id: option.id,
        name: nameColor(light.brand),
        roleLabel: option.roleLabel,
        reason: option.reason,
        brandHue: option.brandHue,
        swatches: { light, dark },
      });
    } catch {
      // A usage the gate rejects cannot ship; it stays out of the row.
    }
  }
  return out;
}



/**
 * Compile the five static brand colors at full voice so the row shows real
 * emitted values: each option carries exactly one emitted --brand. Fixed
 * and independent of the generation — the same five hues every time.
 */
async function previewBrandColors(args: {
  name: string;
  source: { type: "phrase"; promptText: string };
  axes: DnaObject;
  palette: DnaPalette;
  profile: GenerationProfile;
  constraints: PromptConstraints;
  base: ArcheIdentity;
  achromatic: boolean;
}): Promise<BrandColorPreviewOption[]> {
  const colors = deriveBrandColors();
  const out: BrandColorPreviewOption[] = [];
  for (const color of colors) {
    try {
      const compiled = await compileValidIdentity(
        {
          name: args.name,
          source: args.source,
          axes: args.axes,
          palette: { ...args.palette, brandHue: color.brandHue },
          profile: args.profile,
          base: args.base,
          constraints: args.constraints,
        },
        validateIdentity,
      );
      const brand = swatchesFor(compiled, "light").brand;
      out.push({ id: color.id, name: color.name, brandHue: color.brandHue, swatch: brand });
    } catch {
      // A color the compiler rejects cannot be offered.
    }
  }
  return out;
}

/** Resolve each typography variant to renderable header/body specimens. */
function previewTypefaceOptions(
  variants: [TypefaceVariant, TypefaceVariant, TypefaceVariant],
  compilerPick: { display: string; sans: string },
): TypefacePreviewOption[] {
  const pickSpec = typefaceSpec(compilerPick.display, compilerPick.sans);
  return variants.map((variant) => {
    const spec: TypefaceOptionSpec | null = typefaceSpec(variant.display, variant.body);
    const resolved = spec ?? pickSpec;
    const face = (s: { id: string; family: string; stack: string; cssUrl: string | null }): TypefacePreviewFace => ({
      id: s.id,
      family: s.family,
      stack: s.stack,
      cssUrl: s.cssUrl,
    });
    return {
      id: variant.id,
      name: variant.name,
      reason: variant.reason,
      display: face(resolved?.display ?? { id: variant.display, family: variant.display, stack: "inherit", cssUrl: null }),
      body: face(resolved?.body ?? { id: variant.body, family: variant.body, stack: "inherit", cssUrl: null }),
    };
  });
}

export async function previewGeneration(userId: string, prompt: string): Promise<GenerationPreview> {
  await checkCap(userId);
  const trimmed = prompt.trim().slice(0, GENERATION_PROMPT_MAX_LENGTH);
  if (!trimmed) {
    throw new Error("prompt must not be empty");
  }
  const rulesVersion = designRulesVersion();
  try {
    const constraints = constraintsFor(trimmed);
    const exemplars = exemplarsFor(constraints);
    const call = await generateDna(trimmed, { exemplars, constraints });
    const derived = deriveProfile(call.output.axes);
    // The single call returns the DNA plus 3 palette + 3 typography
    // variants. Semantic validation is code-side (unknown ids never burn a
    // retry — deterministic fallbacks fill the position).
    const compilerPick = deriveTypePick(call.output.axes, derived);
    const paletteVariants = normalizePaletteVariants(call.output.palettes, call.output.palette, derived);
    const typefaceVariants = normalizeTypefaceVariants(call.output.typefaces, compilerPick);
    const identityName = titleFromPrompt(trimmed, "Untouched Idea").slice(0, 80);
    const paletteOptions = await previewPaletteOptions({
      name: identityName,
      source: { type: "phrase", promptText: trimmed.slice(0, 120) },
      axes: call.output.axes,
      basePalette: call.output.palette,
      variants: paletteVariants,
      profile: derived,
      base: auroraBase(),
      constraints,
    });
    // Two rows from the same single call, no extra model call, ever: the
    // palette row offers the brand usages, the brand row the colors.
    const usageOptions = await previewUsageOptions({
      name: identityName,
      source: { type: "phrase", promptText: trimmed.slice(0, 120) },
      axes: call.output.axes,
      palette: call.output.palette,
      profile: derived,
      constraints,
      base: auroraBase(),
      achromatic: achromaticBrief(call.output.axes, call.output.palette, constraints),
    });
    const brandColors = await previewBrandColors({
      name: identityName,
      source: { type: "phrase", promptText: trimmed.slice(0, 120) },
      axes: call.output.axes,
      palette: call.output.palette,
      profile: derived,
      constraints,
      base: auroraBase(),
      achromatic: achromaticBrief(call.output.axes, call.output.palette, constraints),
    });
    // Precalculate every brand's palette row up front, so switching brand
    // is an instant tab-switch: no fetch, no waiting, still zero model
    // calls — the same usage compile over each static brand palette.
    const brandPalettes: Record<string, UsagePreviewOption[]> = {};
    for (const color of deriveBrandColors()) {
      brandPalettes[color.id] = await compileUsageOptions({
        name: identityName,
        source: { type: "phrase", promptText: trimmed.slice(0, 120) },
        axes: call.output.axes,
        basePalette: paletteFromBrand(color.brandHue),
        profile: derived,
        constraints,
        base: auroraBase(),
        achromatic: achromaticBrief(call.output.axes, call.output.palette, constraints),
      });
    }
    const typeOptions = previewTypefaceOptions(typefaceVariants, compilerPick);
    // Brand Token brief: the understood brand rides with the slots, and a
    // missing brandHue defaults to the primary hue — recorded, not silent.
    const { defaulted: brandDefaulted } = withBrandDefault(call.output.palette);
    const dreamed = paletteOptions.find((o) => o.id === "as-dreamed") ?? paletteOptions[0]!;
    const slots = [...constraintSlots(constraints), `Brand: ${nameColor(dreamed.swatches.brand)}`];
    const logId = await logAttempt({
      user_id: userId,
      library_id: null,
      kind: "generate",
      prompt: trimmed,
      dna: {
        axes: call.output.axes,
        palette: call.output.palette,
        profile: derived,
        rulesVersion,
        constraints,
        slots,
        brandDefaulted,
        paletteVariants: paletteVariants.map((v) => ({ id: v.id, name: v.name, anchors: v.anchors })),
        brandVariants: usageOptions.map((v) => ({
          id: v.id,
          name: v.name,
          roleLabel: v.roleLabel,
          brandHue: v.brandHue,
          reason: v.reason,
        })),
        brandColors: brandColors.map((v) => ({ id: v.id, name: v.name, brandHue: v.brandHue })),
        typefaceVariants: typefaceVariants.map((v) => ({ id: v.id, name: v.name, display: v.display, body: v.body })),
      },
      model: call.model,
      tokens_in: call.tokensIn,
      tokens_out: call.tokensOut,
      status: "ok",
    });
    return {
      logId,
      axes: call.output.axes,
      palette: call.output.palette,
      profile: derived,
      constraints,
      slots,
      paletteOptions,
      usageOptions,
      brandColors,
      brandPalettes,
      typeOptions,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAttempt({
      user_id: userId,
      kind: "generate",
      prompt: trimmed,
      model: process.env.LLM_MODEL ?? "unconfigured",
      status: "failed",
      error: message,
    });
    throw err instanceof Error ? err : new Error(message);
  }
}

export interface FinishSelections {
  /** Palette scheme; the modal always sends As Generated ("as-dreamed"). */
  paletteId: string;
  /** Palette-row usage (how the brand is used); defaults to As Dreamed. */
  brandId?: string;
  /** Brand-row color; when set it wins over the usage's pinned hue. */
  brandColorId?: string;
  typefaceId?: string;
  exampleId?: string;
  chipIds: string[];
}

/**
 * Modal creation, phase 2: fold the modal's 3 step selections into the
 * preview DNA and compile deterministically (zero model calls — the picker
 * only replays sections of the single preview response), then insert the
 * library ONCE. Any failure before the insert stores nothing (FR-GEN-6);
 * closing the modal never reaches this function at all. The preview DNA
 * round-trips through the client, so it is re-validated here — and the
 * compile gate stays absolute regardless.
 */
export async function completeGeneration(
  userId: string,
  preview: GenerationPreview,
  prompt: string,
  name: string | undefined,
  selections: FinishSelections,
): Promise<GenerationOutcome & { profile: string }> {
  const axesParsed = dnaObjectSchema.safeParse(preview.axes);
  const paletteParsed = dnaPaletteSchema.safeParse(preview.palette);
  const profileParsed = generationProfileSchema.safeParse(preview.profile);
  if (!axesParsed.success || !paletteParsed.success || !profileParsed.success) {
    throw new Error("generation preview expired or was modified — start over");
  }
  // Picker variants round-trip through the client: re-validate every entry
  // (schema + registry) and fall back deterministically, so a tampered id
  // or font can never reach a payload.
  const previewPaletteOptions = Array.isArray(preview.paletteOptions) ? preview.paletteOptions : [];
  const validPaletteOptions = previewPaletteOptions.filter((o) => paletteVariantSchema.safeParse(o).success);
  const paletteOptions = normalizePaletteVariants(
    validPaletteOptions.length === 3 ? validPaletteOptions : [],
    paletteParsed.data,
    profileParsed.data,
  );
  const previewTypeOptions = Array.isArray(preview.typeOptions) ? preview.typeOptions : [];
  const validTypeOptions = previewTypeOptions.filter((o) => typefaceVariantSchema.safeParse(o).success);
  const compilerPick = deriveTypePick(axesParsed.data, profileParsed.data);
  const typefaceOptions = normalizeTypefaceVariants(validTypeOptions.length === 3 ? validTypeOptions : [], compilerPick);
  const trimmedPrompt = prompt.trim().slice(0, GENERATION_PROMPT_MAX_LENGTH);
  if (!trimmedPrompt) {
    throw new Error("prompt must not be empty");
  }
  const axes = axesParsed.data;
  const palette = paletteParsed.data;
  const profile = profileParsed.data;
  const knownChips = new Set(WORD_CHIPS.map((chip) => chip.id));
  const chipIds = [...new Set(selections.chipIds)].filter((id) => knownChips.has(id));
  const paletteId = selections.paletteId || "as-dreamed";
  const base = auroraBase();
  const rulesVersion = designRulesVersion();
  const identityName = (name?.trim() || titleFromPrompt(trimmedPrompt, "Untouched Idea")).slice(0, 80);
  const constraints = preview.constraints ?? constraintsFor(trimmedPrompt);
  // The picker narrows the single generation: the chosen palette variant's
  // anchors, the chosen brand-only option's hue, and the chosen typography
  // variant's header/body pair fold into the final compile; anything unpicked
  // stays as the model dreamed it. The brand row is re-derived here from the
  // generation's own anchors — never trusted from the round-tripped client
  // state, and never a model call.
  // Brand-row color, resolved against the static row (never trusted from the
  // client). Present means the palettes rebuild from that single hue;
  // absent means the generation's own palette stands.
  const brandColorId = resolveBrandColor(selections.brandColorId)?.id ?? null;
  // Usages are derived from the brand's static palette when a color is
  // picked, else from the generation's own palette — the same base the
  // preview row was compiled from, so finish can never disagree with it.
  const brandBase = brandColorId
    ? paletteFromBrand(resolveBrandColor(brandColorId)!.brandHue)
    : palette;
  const brandId = deriveBrandOptions(brandBase, {
    profile,
    achromatic: achromaticBrief(axes, brandBase, constraints),
  }).find((option) => option.id === selections.brandId)?.id ?? "as-dreamed";
  const selectedTypeface = typefaceOptions.find((o) => o.id === (selections.typefaceId ?? "")) ?? typefaceOptions[0]!;
  const typefaceOverride = { display: selectedTypeface.display, sans: selectedTypeface.body };
  const fold = (
    dnaAxes: DnaObject,
    dnaPalette: DnaPalette,
  ): { axes: DnaObject; palette: DnaPalette; brand: BrandOption } => {
    let paletteOverride: DnaPalette | undefined;
    if (selections.exampleId) {
      const record = EXAMPLE_RECORDS.find((entry) => entry.id === selections.exampleId);
      if (!record) {
        throw new Error(`unknown example '${selections.exampleId}'`);
      }
      paletteOverride = { ...record.palette };
    }
    const foldBase = brandColorId
      ? paletteFromBrand(resolveBrandColor(brandColorId)!.brandHue)
      : dnaPalette;
    const localBrands = deriveBrandOptions(foldBase, {
      profile,
      achromatic: achromaticBrief(dnaAxes, foldBase, constraints),
    });
    const brand = localBrands.find((option) => option.id === brandId) ?? localBrands[0]!;
    const applied = applyPickerDelta(
      dnaAxes,
      dnaPalette,
      { chipIds, paletteId, brandId: brand.id, brandColorId: brandColorId ?? undefined },
      paletteOptions,
      localBrands,
    );
    const anchors = paletteOverride ?? applied.anchors;
    // The brand row picks only the mark color: it survives an example override.
    return {
      axes: { ...dnaAxes, ...applied.axes },
      palette: { ...anchors, brandHue: applied.anchors.brandHue },
      brand,
    };
  };
  try {
    let folded = fold(axes, palette);
    let compiled: ArcheIdentity;
    try {
      compiled = await compileValidIdentity(
        {
          name: identityName,
          source: { type: "phrase", promptText: trimmedPrompt },
          axes: folded.axes,
          palette: folded.palette,
          profile,
          base,
          constraints,
          typeface: typefaceOverride,
          brandChromaScale: folded.brand.chromaScale,
        },
        validateIdentity,
      );
    } catch (err) {
      // Same repair contract as the direct text door: one follow-up model
      // call carrying the named rule findings, selections re-applied, then
      // recompile once. Anything else throws to the failed path below.
      if (!(err instanceof Error) || !err.message.startsWith("generated payload violates design rules")) {
        throw err;
      }
      const retry = await generateDna(trimmedPrompt, {
        exemplars: exemplarsFor(constraints),
        constraints,
        repairFeedback: err.message,
      });
      folded = fold(retry.output.axes, retry.output.palette);
      compiled = await compileValidIdentity(
        {
          name: identityName,
          source: { type: "phrase", promptText: trimmedPrompt },
          axes: folded.axes,
          palette: folded.palette,
          profile: deriveProfile(folded.axes),
          base,
          constraints,
          typeface: typefaceOverride,
          brandChromaScale: folded.brand.chromaScale,
        },
        validateIdentity,
      );
    }
    // Verifier safety net (same contract as the direct text door): one
    // targeted repair, then surface the code-measured failure.
    const report = verifyAdherence(compiled, constraints);
    if (!report.pass) {
      throw new Error(`prompt-adherence check failed: ${report.failures.join("; ")}`);
    }
    (compiled.meta as Record<string, unknown>).promptConstraints = constraints;
    (compiled.meta as Record<string, unknown>).promptSlots = [
      ...constraintSlots(constraints),
      `Brand: ${nameColor(String((compiled.tokens.light as unknown as Record<string, { $value?: unknown }>)["--brand"]?.$value ?? ""))}`,
    ];
    (compiled.meta as Record<string, unknown>).picker = {
      step: "done",
      paletteId,
      paletteReason: paletteOptions.find((o) => o.id === paletteId)?.reason ?? null,
      brandId: folded.brand.id,
      brandColorId,
      brandHue: compiled.dna!.palette.brandHue,
      brandReason: folded.brand.reason,
      typefaceId: selections.typefaceId ?? typefaceOptions[0]!.id,
      exampleId: selections.exampleId ?? null,
      chipIds,
    };
    const service = createServiceClient();
    const slug = await uniqueSlug(service, userId, identityName);
    const { data, error } = await service
      .from("libraries")
      .insert({ owner: userId, name: identityName, slug, visibility: "private", payload: compiled as never })
      .select("id")
      .single();
    if (error || !data) {
      throw new Error(`draft store failed: ${error?.message ?? "unknown"}`);
    }
    const libraryId = (data as unknown as { id: string }).id;
    if (preview.logId) {
      // Link the preview's log row to the created library (best-effort —
      // the library insert above is the source of truth).
      await service
        .from("generation_logs")
        .update({
          library_id: libraryId,
          dna: {
            axes: folded.axes,
            palette: folded.palette,
            profile: compiled.dna!.profile,
            rulesVersion,
            constraints,
            slots: constraintSlots(constraints),
            brandDefaulted: withBrandDefault(preview.palette).defaulted,
            paletteId,
            paletteReason: paletteOptions.find((o) => o.id === paletteId)?.reason ?? null,
            brandId: folded.brand.id,
            brandColorId,
            brandHue: compiled.dna!.palette.brandHue,
            brandReason: folded.brand.reason,
            typefaceId: selections.typefaceId ?? typefaceOptions[0]!.id,
          },
          payload_diff: diffPayloads(base, compiled),
          adjustments: (compiled.meta as Record<string, unknown>).adjustments ?? [],
        })
        .eq("id", preview.logId);
    }
    return {
      libraryId,
      slug,
      name: identityName,
      profile: compiled.dna!.profile,
      adjustments: ((compiled.meta as Record<string, unknown>).adjustments as unknown[]).length,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (preview.logId) {
      const service = createServiceClient();
      await service
        .from("generation_logs")
        .update({ status: "failed", error: message })
        .eq("id", preview.logId);
    }
    throw err instanceof Error ? err : new Error(message);
  }
}

/**
 * Prompt edit (FR-GEN-3): delta-only model output applied onto the stored
 * DNA, recompiled, saved as draft (never auto-published). Unrelated fields
 * stay byte-identical — the payload diff proves it.
 */
export async function applyPromptEdit(
  userId: string,
  libraryId: string,
  editPrompt: string,
): Promise<{ delta: DnaDelta; diff: ReturnType<typeof diffPayloads> }> {
  await checkCap(userId);
  const service = createServiceClient();
  const { data: library } = await service
    .from("libraries")
    .select("id,payload")
    .eq("id", libraryId)
    .eq("owner", userId)
    .maybeSingle();
  if (!library) {
    throw new Error("library not found");
  }
  const current = (library as unknown as { payload: ArcheIdentity }).payload;
  const storedDna = current.dna;
  if (!storedDna) {
    throw new Error("prompt edits need stored DNA — this identity was made by hand; generate a new one from a phrase instead");
  }
  try {
    const call = await generateDnaDelta(
      { axes: storedDna.axes, palette: storedDna.palette },
      editPrompt,
    );
    const next = await compileValidIdentity(
      {
        name: current.meta.name,
        source: storedDna.source,
        axes: { ...storedDna.axes, ...(call.delta.axes ?? {}) },
        palette: { ...storedDna.palette, ...(call.delta.palette ?? {}) },
        base: current,
      },
      validateIdentity,
    );
    // Provenance: the recompile keeps the original source; only the compiler
    // version advances (it is stamped fresh every compile).
    const diff = diffPayloads(current, next);
    const { error: saveError } = await service
      .from("libraries")
      .update({ payload: next as never, updated_at: new Date().toISOString() })
      .eq("id", libraryId);
    if (saveError) {
      throw new Error(`draft save failed: ${saveError.message}`);
    }
    await logAttempt({
      user_id: userId,
      library_id: libraryId,
      kind: "edit",
      prompt: editPrompt.trim().slice(0, 280),
      dna: {
        axes: next.dna!.axes,
        palette: next.dna!.palette,
        profile: next.dna!.profile ?? "standard",
        rulesVersion: designRulesVersion(),
      },
      dna_delta: { delta: call.delta },
      payload_diff: diff,
      adjustments: (next.meta as Record<string, unknown>).adjustments ?? [],
      model: call.model,
      tokens_in: call.tokensIn,
      tokens_out: call.tokensOut,
      status: "ok",
    });
    return { delta: call.delta, diff };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAttempt({
      user_id: userId,
      library_id: libraryId,
      kind: "edit",
      prompt: editPrompt.trim().slice(0, 280),
      model: process.env.LLM_MODEL ?? "unconfigured",
      status: "failed",
      error: message,
    });
    throw err instanceof Error ? err : new Error(message);
  }
}

/** Picker progress, stored on the draft (`payload.meta.picker`) so the
 * staged flow survives navigation — resume lands on the stored step. */
export interface PickerProgress {
  step: "palettes" | "examples" | "words" | "done";
  paletteId?: string;
  paletteReason?: string | null;
  brandId?: string;
  brandColorId?: string | null;
  brandHue?: number;
  brandReason?: string;
  exampleId?: string;
  chipIds?: string[];
}

export type PickerStep = "palettes" | "examples" | "words";

const PICKER_NEXT: Record<PickerStep, PickerProgress["step"]> = {
  palettes: "examples",
  examples: "words",
  words: "done",
};

/**
 * Staged picker recompile (Brief #7 D4): fold one step's selection into the
 * draft's DNA and recompile deterministically. Zero model calls — the picker
 * only replays sections of the single generation response (palettes derived
 * from its anchors, words mapped to its axes, examples as anchor records).
 * compileValidIdentity re-runs the AA gate, so a step can never ship a
 * violating draft. Nothing is logged to generation_logs: there is no model
 * call to meter (the kind check only admits generate/edit).
 */
export async function recompileWithPicker(
  current: ArcheIdentity,
  selections: PickerSelections,
  paletteOverride?: DnaPalette,
): Promise<{ compiled: ArcheIdentity; unknownChips: string[]; brand: BrandOption }> {
  const dna = current.dna;
  if (!dna) {
    throw new Error("picker needs stored DNA — this identity was made by hand; generate a new one from a phrase instead");
  }
  const profile = dna.profile ?? "standard";
  const constraints =
    ((current.meta as Record<string, unknown>).promptConstraints as PromptConstraints | undefined) ??
    (dna.source.type === "phrase" && dna.source.promptText ? parseConstraints(dna.source.promptText) : {});
  // A picked static brand color re-bases the usages on its static palette,
  // exactly like the modal finish path — the draft owns both choices.
  const storedBrand = resolveBrandColor(selections.brandColorId);
  const brandBase = storedBrand ? paletteFromBrand(storedBrand.brandHue) : dna.palette;
  const brandOptions = deriveBrandOptions(brandBase, {
    profile,
    achromatic: achromaticBrief(dna.axes, brandBase, constraints),
  });
  const brand = brandOptions.find((option) => option.id === selections.brandId) ?? brandOptions[0]!;
  const applied = applyPickerDelta(
    dna.axes,
    dna.palette,
    { ...selections, brandId: brand.id },
    derivePaletteOptions(dna.palette, profile),
    brandOptions,
  );
  const anchors = paletteOverride ?? applied.anchors;
  const compiled = await compileValidIdentity(
    {
      name: current.meta.name,
      source: dna.source,
      axes: { ...dna.axes, ...applied.axes },
      // The brand row survives an example override: it owns the mark color
      // (hue + voice), never the system.
      palette: { ...anchors, brandHue: applied.anchors.brandHue },
      brandChromaScale: brand.chromaScale,
      profile,
      base: current,
      constraints,
    },
    validateIdentity,
  );
  return { compiled, unknownChips: applied.unknownChips, brand };
}

/**
 * Apply one picker step to a draft and persist it (step transitions are the
 * autosave). Returns the step the UI should show next.
 */
export async function applyPickerStep(
  userId: string,
  libraryId: string,
  step: PickerStep,
  value: string | string[],
): Promise<{ nextStep: PickerProgress["step"]; unknownChips: string[] }> {
  const service = createServiceClient();
  const { data: library } = await service
    .from("libraries")
    .select("id,payload")
    .eq("id", libraryId)
    .eq("owner", userId)
    .maybeSingle();
  if (!library) {
    throw new Error("library not found");
  }
  const current = (library as unknown as { payload: ArcheIdentity }).payload;
  const stored = ((current.meta as Record<string, unknown>).picker ?? {}) as Partial<PickerProgress>;
  const chipIds = Array.isArray(stored.chipIds) ? stored.chipIds.filter((id): id is string => typeof id === "string") : [];
  let selections: PickerSelections;
  let paletteOverride: DnaPalette | undefined;
  let progress: PickerProgress;
  // Both brand rows survive every later step: the usage and the color.
  const brandColorId = stored.brandColorId ?? undefined;
  if (step === "palettes") {
    const paletteId = String(value);
    selections = { chipIds, paletteId, brandId: stored.brandId, brandColorId };
    progress = { step: PICKER_NEXT[step], paletteId, exampleId: stored.exampleId, chipIds };
  } else if (step === "examples") {
    const exampleId = String(value);
    const record = EXAMPLE_RECORDS.find((entry) => entry.id === exampleId);
    if (!record) {
      throw new Error(`unknown example '${exampleId}'`);
    }
    paletteOverride = { ...record.palette };
    selections = {
      chipIds,
      paletteId: stored.paletteId ?? "as-dreamed",
      brandId: stored.brandId,
      brandColorId,
    };
    progress = { step: PICKER_NEXT[step], paletteId: stored.paletteId, exampleId, chipIds };
  } else {
    const known = new Set(WORD_CHIPS.map((chip) => chip.id));
    const picked = (Array.isArray(value) ? value : [value]).map(String).filter((id) => known.has(id));
    selections = {
      chipIds: picked,
      paletteId: stored.paletteId ?? "as-dreamed",
      brandId: stored.brandId,
      brandColorId,
    };
    progress = { step: PICKER_NEXT[step], paletteId: stored.paletteId, exampleId: stored.exampleId, chipIds: picked };
  }
  const { compiled, unknownChips, brand } = await recompileWithPicker(current, selections, paletteOverride);
  // The brand row is preserved across every later step and recorded with its
  // resulting hue and reason (the draft owns both choices).
  progress.brandId = brand.id;
  progress.brandColorId = selections.brandColorId ?? null;
  progress.brandHue = compiled.dna?.palette.brandHue;
  progress.brandReason = brand.reason;
  if (current.dna) {
    progress.paletteReason =
      derivePaletteOptions(current.dna.palette, current.dna.profile ?? "standard").find(
        (option) => option.id === (progress.paletteId ?? "as-dreamed"),
      )?.reason ?? null;
  }
  (compiled.meta as Record<string, unknown>).picker = progress;
  const { error: saveError } = await service
    .from("libraries")
    .update({ payload: compiled as never, updated_at: new Date().toISOString() })
    .eq("id", libraryId);
  if (saveError) {
    throw new Error(`draft save failed: ${saveError.message}`);
  }
  return { nextStep: progress.step, unknownChips };
}
