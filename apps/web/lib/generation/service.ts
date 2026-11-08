import { compileValidIdentity } from "@arche/registry-core/compiler";
import {
  designRulesVersion,
  validateIdentity,
  type ArcheIdentity,
  type DnaDelta,
} from "@arche/registry-core";
import { createServiceClient } from "@/lib/supabase/service";
import { fixturesDir, slugify } from "@/lib/starter";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { generateDna, generateDnaDelta } from "./provider";

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
async function logAttempt(row: LogRow): Promise<void> {
  const service = createServiceClient();
  await service.from("generation_logs").insert({
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
  });
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
          source: { type: "phrase", promptText: prompt.trim().slice(0, 120) },
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
          source: { type: "phrase", promptText: prompt.trim().slice(0, 120) },
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
      prompt: prompt.trim().slice(0, 120),
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
      prompt: prompt.trim().slice(0, 120),
      model: process.env.LLM_MODEL ?? "unconfigured",
      status: "failed",
      error: message,
    });
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
