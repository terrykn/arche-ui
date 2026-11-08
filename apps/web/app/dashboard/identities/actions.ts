"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateIdentity } from "@arche/registry-core";
import { applyPromptEdit, generateFromPhrase } from "@/lib/generation/service";
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
  const name = String(formData.get("name") ?? "").trim();
  const visibility = String(formData.get("visibility") ?? "private");
  if (!name) {
    redirect("/dashboard/identities/new?error=Name%20is%20required");
  }
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
  const { data, error } = await service
    .from("libraries")
    .insert({
      owner,
      name,
      slug: slugify(name),
      visibility: visibility === "public" ? "public" : "private",
      payload,
    })
    .select("id")
    .single();
  if (error || !data) {
    // Friendly duplicate message: the (owner, slug) key is unique, so this
    // means an earlier attempt already created it — point at Identities.
    const message =
      (error as unknown as { code?: string } | null)?.code === "23505"
        ? `You already have an identity named "${name}" — open it from Dashboard → Identities instead of creating it again.`
        : (error?.message ?? "create failed");
    redirect(`/dashboard/identities/new?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/dashboard");
  redirect(`/dashboard/identities/${(data as unknown as { id: string }).id}/edit`);
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
    redirect("/dashboard/identities/new?error=Describe%20the%20vibe%20in%20a%20phrase%20first");
  }
  try {
    const outcome = await generateFromPhrase(owner, prompt, name || undefined);
    revalidatePath("/dashboard");
    redirect(`/dashboard/identities/${outcome.libraryId}/edit?generated=1`);
  } catch (err) {
    // Next.js success-path redirect() surfaces as a NEXT_REDIRECT throwable —
    // rethrow it instead of reporting it as a generation failure.
    if (err instanceof Error && (err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    redirect(`/dashboard/identities/new?error=${encodeURIComponent(message)}`);
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
