import { compileValidIdentity } from "@arche/registry-core/compiler";
import {
  applyPickerDelta,
  derivePaletteOptions,
  designRulesVersion,
  EXAMPLE_RECORDS,
  validateIdentity,
  WORD_CHIPS,
  type ArcheIdentity,
  type DnaDelta,
  type DnaObject,
  type DnaPalette,
  type GenerationProfile,
  type PickerSelections,
} from "@arche/registry-core";
import {
  dnaObjectSchema,
  dnaPaletteSchema,
  generationProfileSchema,
} from "@arche/foundation/dna";
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
 * Stored `dna` shape for generations (Deliverable 3): the model's full
 * single-call response — plan + self-check verdict + final inputs +
 * profile + rules version — from the ONE completion. `dna_delta` holds the
 * same shape for prompt edits ({plan, selfCheck, delta, profile}).
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
    readFileSync(join(fixturesDir(), "identity.arche.json"), "utf8"),
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
 * Text door (FR-SHIFT-1): phrase → validated draft. Invalid model output
 * (after the provider's retry), provider errors, and validation failures
 * all land here: failed log row, nothing stored.
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
    const call = await generateDna(prompt);
    const identityName = (name?.trim() || titleFromPrompt(prompt, "Untouched Idea")).slice(0, 80);
    let compiled: ArcheIdentity;
    try {
      compiled = await compileValidIdentity(
        {
          name: identityName,
          source: { type: "phrase", promptText: prompt.trim().slice(0, GENERATION_PROMPT_MAX_LENGTH) },
          axes: call.output.axes,
          palette: call.output.palette,
          profile: call.profile,
          base,
        },
        validateIdentity,
      );
    } catch (err) {
      // Unrepairable enforce-tier violation: one follow-up model call
      // carrying the named rule findings, then recompile once. Anything
      // else throws straight to the failed-log path below.
      if (!(err instanceof Error) || !err.message.startsWith("generated payload violates design rules")) {
        throw err;
      }
      const retry = await generateDna(prompt, err.message);
      // Attribute the single follow-up call's tokens alongside the first.
      call.tokensIn = (call.tokensIn ?? 0) + (retry.tokensIn ?? 0);
      call.tokensOut = (call.tokensOut ?? 0) + (retry.tokensOut ?? 0);
      const final = retry;
      compiled = await compileValidIdentity(
        {
          name: identityName,
          source: { type: "phrase", promptText: prompt.trim().slice(0, GENERATION_PROMPT_MAX_LENGTH) },
          axes: final.output.axes,
          palette: final.output.palette,
          profile: final.profile,
          base,
        },
        validateIdentity,
      );
      call.plan = final.plan;
      call.selfCheck = final.selfCheck;
      call.profile = final.profile;
      call.output = final.output;
    }
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
        plan: call.plan,
        selfCheck: call.selfCheck,
        axes: call.output.axes,
        palette: call.output.palette,
        profile: call.profile,
        rulesVersion,
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
      profile: call.profile,
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
export interface GenerationPreview {
  logId: string | null;
  axes: DnaObject;
  palette: DnaPalette;
  profile: GenerationProfile;
}

export async function previewGeneration(userId: string, prompt: string): Promise<GenerationPreview> {
  await checkCap(userId);
  const trimmed = prompt.trim().slice(0, GENERATION_PROMPT_MAX_LENGTH);
  if (!trimmed) {
    throw new Error("prompt must not be empty");
  }
  const rulesVersion = designRulesVersion();
  try {
    const call = await generateDna(trimmed);
    const logId = await logAttempt({
      user_id: userId,
      library_id: null,
      kind: "generate",
      prompt: trimmed,
      dna: {
        plan: call.plan,
        selfCheck: call.selfCheck,
        axes: call.output.axes,
        palette: call.output.palette,
        profile: call.profile,
        rulesVersion,
      },
      model: call.model,
      tokens_in: call.tokensIn,
      tokens_out: call.tokensOut,
      status: "ok",
    });
    return { logId, axes: call.output.axes, palette: call.output.palette, profile: call.profile };
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
  paletteId: string;
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
  preview: { logId: string | null; axes: DnaObject; palette: DnaPalette; profile: GenerationProfile },
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
  const fold = (dnaAxes: DnaObject, dnaPalette: DnaPalette): { axes: DnaObject; palette: DnaPalette } => {
    const options = derivePaletteOptions(dnaPalette, profile);
    let paletteOverride: DnaPalette | undefined;
    if (selections.exampleId) {
      const record = EXAMPLE_RECORDS.find((entry) => entry.id === selections.exampleId);
      if (!record) {
        throw new Error(`unknown example '${selections.exampleId}'`);
      }
      paletteOverride = { ...record.palette };
    }
    const applied = applyPickerDelta(dnaAxes, dnaPalette, { chipIds, paletteId }, options);
    return { axes: { ...dnaAxes, ...applied.axes }, palette: paletteOverride ?? applied.anchors };
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
      const retry = await generateDna(trimmedPrompt, err.message);
      folded = fold(retry.output.axes, retry.output.palette);
      compiled = await compileValidIdentity(
        {
          name: identityName,
          source: { type: "phrase", promptText: trimmedPrompt },
          axes: folded.axes,
          palette: folded.palette,
          profile: retry.profile,
          base,
        },
        validateIdentity,
      );
    }
    (compiled.meta as Record<string, unknown>).picker = {
      step: "done",
      paletteId,
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
            plan: null,
            selfCheck: null,
            axes: folded.axes,
            palette: folded.palette,
            profile,
            rulesVersion,
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
      profile,
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
      { axes: storedDna.axes, palette: storedDna.palette, profile: storedDna.profile },
      editPrompt,
    );
    const next = await compileValidIdentity(
      {
        name: current.meta.name,
        source: storedDna.source,
        axes: { ...storedDna.axes, ...(call.delta.axes ?? {}) },
        palette: { ...storedDna.palette, ...(call.delta.palette ?? {}) },
        profile: call.profile ?? storedDna.profile ?? "standard",
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
        plan: call.plan,
        selfCheck: call.selfCheck,
        axes: next.dna!.axes,
        palette: next.dna!.palette,
        profile: next.dna!.profile ?? "standard",
        rulesVersion: designRulesVersion(),
      },
      dna_delta: { plan: call.plan, selfCheck: call.selfCheck, delta: call.delta, profile: call.profile ?? null },
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
): Promise<{ compiled: ArcheIdentity; unknownChips: string[] }> {
  const dna = current.dna;
  if (!dna) {
    throw new Error("picker needs stored DNA — this identity was made by hand; generate a new one from a phrase instead");
  }
  const profile = dna.profile ?? "standard";
  const applied = applyPickerDelta(
    dna.axes,
    dna.palette,
    selections,
    derivePaletteOptions(dna.palette, profile),
  );
  const compiled = await compileValidIdentity(
    {
      name: current.meta.name,
      source: dna.source,
      axes: { ...dna.axes, ...applied.axes },
      palette: paletteOverride ?? applied.anchors,
      profile,
      base: current,
    },
    validateIdentity,
  );
  return { compiled, unknownChips: applied.unknownChips };
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
  if (step === "palettes") {
    const paletteId = String(value);
    selections = { chipIds, paletteId };
    progress = { step: PICKER_NEXT[step], paletteId, exampleId: stored.exampleId, chipIds };
  } else if (step === "examples") {
    const exampleId = String(value);
    const record = EXAMPLE_RECORDS.find((entry) => entry.id === exampleId);
    if (!record) {
      throw new Error(`unknown example '${exampleId}'`);
    }
    paletteOverride = { ...record.palette };
    selections = { chipIds, paletteId: stored.paletteId ?? "as-dreamed" };
    progress = { step: PICKER_NEXT[step], paletteId: stored.paletteId, exampleId, chipIds };
  } else {
    const known = new Set(WORD_CHIPS.map((chip) => chip.id));
    const picked = (Array.isArray(value) ? value : [value]).map(String).filter((id) => known.has(id));
    selections = { chipIds: picked, paletteId: stored.paletteId ?? "as-dreamed" };
    progress = { step: PICKER_NEXT[step], paletteId: stored.paletteId, exampleId: stored.exampleId, chipIds: picked };
  }
  const { compiled, unknownChips } = await recompileWithPicker(current, selections, paletteOverride);
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
