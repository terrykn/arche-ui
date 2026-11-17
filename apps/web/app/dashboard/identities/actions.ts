"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateIdentity } from "@arche/registry-core";
import {
  applyPickerStep,
  applyPromptEdit,
  completeGeneration,
  generateFromPhrase,
  previewGeneration,
  type FinishSelections,
  type GenerationPreview,
  type PickerStep,
} from "@/lib/generation/service";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { publishLibrary } from "@/lib/publish";
import { issueRegistryToken } from "@/lib/registry-token";
import { ensureProfileExists } from "@/lib/profiles";
import { slugify, starterPayload } from "@/lib/starter";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user.id;
}

export async function createIdentity(formData: FormData) {
  const owner = await requireUserId();
  const baseName = String(formData.get("name") ?? "").trim() || "Untitled identity";
  const visibility = String(formData.get("visibility") ?? "private");
  const service = createServiceClient();
  // Self-healing: accounts predating the new-user trigger have no profiles
  // row, which the libraries.owner FK requires. Ensure it before inserting.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await ensureProfileExists(
    service,
    owner,
    user?.email ?? null,
    ((user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null) as string | null),
  );
  const payload = starterPayload() as Record<string, unknown>;
  const slugBase = slugify(baseName);
  let libraryId: string | null = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    const suffix = attempt === 0 ? "" : `-${attempt + 1}`;
    const numbered = attempt === 0 ? "" : ` ${attempt + 1}`;
    const { data, error } = await service
      .from("libraries")
      .insert({
        owner,
        name: `${baseName}${numbered}`.slice(0, 80),
        slug: `${slugBase}${suffix}`.slice(0, 60) || `identity${suffix}`,
        visibility: visibility === "public" ? "public" : "private",
        payload,
      })
      .select("id")
      .single();
    if (!error && data) {
      libraryId = (data as unknown as { id: string }).id;
      break;
    }
    if ((error as unknown as { code?: string } | null)?.code !== "23505") {
      redirect(`/dashboard?error=${encodeURIComponent(error?.message ?? "create failed")}`);
    }
  }
  if (!libraryId) {
    redirect(`/dashboard?error=${encodeURIComponent("Could not pick a unique name — try again")}`);
  }
  revalidatePath("/dashboard");
  redirect(`/dashboard/identities/${libraryId}/edit`);
}

export interface SaveState {
  ok: boolean;
  issues?: Array<{ path: string; message: string }>;
}

/** Text door (Brief #6 §7): phrase → validated draft, then edit it. */
export async function generatePhraseAction(formData: FormData) {
  const owner = await requireUserId();
  const prompt = String(formData.get("prompt") ?? "").trim().slice(0, 120);
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  if (!prompt) {
    redirect(`/dashboard?error=${encodeURIComponent("Describe your design first")}`);
  }
  try {
    const outcome = await generateFromPhrase(owner, prompt, name || undefined);
    revalidatePath("/dashboard");
    // Into the staged picker (Brief #7 D4): palettes → examples → words over
    // the single generation, then the Studio. Skippable from every step.
    redirect(`/dashboard/identities/${outcome.libraryId}/style`);
  } catch (err) {
    // Next.js success-path redirect() surfaces as a NEXT_REDIRECT throwable —
    // rethrow it instead of reporting it as a generation failure.
    if (err instanceof Error && (err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    redirect(`/dashboard?error=${encodeURIComponent(message)}&prompt=${encodeURIComponent(prompt)}`);
  }
}

/**
 * Modal creation phase 1: run the model's single call for the prompt and
 * return its DNA for the modal's 3 steps. No library is created — closing
 * the modal drops the preview and starts over.
 */
export async function startGenerationAction(
  prompt: string,
): Promise<{ ok: true; preview: GenerationPreview } | { ok: false; message: string }> {
  const owner = await requireUserId();
  try {
    const preview = await previewGeneration(owner, prompt);
    return { ok: true, preview };
  } catch (err) {
    if (err instanceof Error && (err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Modal creation phase 2: fold the 3 step selections into the preview DNA
 * and create the library exactly once, then enter the Studio. This is the
 * only write in the creation flow — every earlier step was in-memory.
 */
export async function finishGenerationAction(
  preview: GenerationPreview,
  prompt: string,
  selections: FinishSelections,
): Promise<{ ok: true; libraryId: string } | { ok: false; message: string }> {
  const owner = await requireUserId();
  try {
    const outcome = await completeGeneration(owner, preview, prompt, undefined, selections);
    revalidatePath("/dashboard");
    return { ok: true as const, libraryId: outcome.libraryId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false as const, message };
  }
}

export interface EditState {
  ok: boolean;
  delta?: Record<string, unknown>;
  diffCount?: number;
  issues?: Array<{ path: string; message: string }>;
}

/** Prompt edit (Brief #6 §7): natural-language nudge → delta-only recompile, stays draft. */
export async function applyPromptEditAction(libraryId: string, prompt: string): Promise<EditState> {
  const owner = await requireUserId();
  const trimmed = prompt.trim().slice(0, 280);
  if (!trimmed) {
    return { ok: false, issues: [{ path: "prompt", message: "describe the change first" }] };
  }
  try {
    const { delta, diff } = await applyPromptEdit(owner, libraryId, trimmed);
    revalidatePath("/dashboard");
    return { ok: true, delta: delta as Record<string, unknown>, diffCount: diff.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, issues: [{ path: "prompt", message }] };
  }
}

/**
 * Staged picker step (Brief #7 D4): one selection → deterministic recompile
 * → draft saved (the transition is the autosave) → next step. Zero model
 * calls; failures re-render the picker with the message, draft untouched.
 */
export async function applyPickerAction(libraryId: string, step: PickerStep, formData: FormData) {
  const owner = await requireUserId();
  const value =
    step === "words" ? formData.getAll("chips").map(String) : String(formData.get(step === "palettes" ? "palette" : "example") ?? "");
  if ((Array.isArray(value) ? value.length === 0 : !value)) {
    redirect(`/dashboard/identities/${libraryId}/style?step=${step}&error=${encodeURIComponent("Pick one to continue — or skip to the Studio")}`);
  }
  try {
    const { nextStep } = await applyPickerStep(owner, libraryId, step, value);
    revalidatePath("/dashboard");
    redirect(`/dashboard/identities/${libraryId}/style?step=${nextStep}`);
  } catch (err) {
    if (err instanceof Error && (err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    redirect(`/dashboard/identities/${libraryId}/style?step=${step}&error=${encodeURIComponent(message)}`);
  }
}

export async function savePayload(libraryId: string, payload: unknown): Promise<SaveState> {
  const owner = await requireUserId();
  // Drafts stay valid by construction: reject anything the gate would reject.
  const validation = validateIdentity(payload as Parameters<typeof validateIdentity>[0]);
  if (!validation.ok) {
    return { ok: false, issues: validation.issues };
  }
  const service = createServiceClient();
  const { data } = await service
    .from("libraries")
    .select("id")
    .eq("id", libraryId)
    .eq("owner", owner)
    .maybeSingle();
  if (!data) {
    return { ok: false, issues: [{ path: "library", message: "library not found" }] };
  }
  const { error } = await service
    .from("libraries")
    .update({ payload: payload as Record<string, never>, updated_at: new Date().toISOString() })
    .eq("id", libraryId);
  if (error) {
    return { ok: false, issues: [{ path: "library", message: error.message }] };
  }
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Rename a library. The slug stays untouched so install URLs keep working. */
export async function renameLibrary(
  libraryId: string,
  name: string,
): Promise<{ ok: true; name: string } | { ok: false; message: string }> {
  const owner = await requireUserId();
  const trimmed = name.trim().slice(0, 80);
  if (!trimmed) {
    return { ok: false, message: "Name can't be empty" };
  }
  const service = createServiceClient();
  const { data, error } = await service
    .from("libraries")
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq("id", libraryId)
    .eq("owner", owner)
    .select("name")
    .maybeSingle();
  if (error || !data) {
    return { ok: false, message: error?.message ?? "library not found" };
  }
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/identities/${libraryId}`);
  return { ok: true, name: (data as unknown as { name: string }).name };
}

/** Delete a library owned by the caller. The editor navigates away on success. */
export async function deleteLibrary(
  libraryId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const owner = await requireUserId();
  const service = createServiceClient();
  const { data, error } = await service
    .from("libraries")
    .delete()
    .eq("id", libraryId)
    .eq("owner", owner)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return { ok: false, message: error?.message ?? "library not found" };
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function publishAction(libraryId: string): Promise<SaveState & { version?: number }> {
  const owner = await requireUserId();
  const result = await publishLibrary(libraryId, owner);
  if (!result.ok) {
    return { ok: false, issues: result.issues };
  }
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/identities/${libraryId}`);
  return { ok: true, version: result.version };
}

export async function issueTokenAction(): Promise<{ raw: string } | { error: string }> {
  const owner = await requireUserId();
  const { raw, hash, prefix } = issueRegistryToken();
  const service = createServiceClient();
  const { error } = await service
    .from("profiles")
    .update({
      registry_token_hash: hash,
      registry_token_prefix: prefix,
      registry_token_created_at: new Date().toISOString(),
    })
    .eq("id", owner);
  if (error) {
    return { error: error.message };
  }
  return { raw };
}

export async function revokeTokenAction() {
  const owner = await requireUserId();
  const service = createServiceClient();
  await service
    .from("profiles")
    .update({ registry_token_hash: null, registry_token_prefix: null, registry_token_created_at: null })
    .eq("id", owner);
  revalidatePath("/dashboard/settings");
}
