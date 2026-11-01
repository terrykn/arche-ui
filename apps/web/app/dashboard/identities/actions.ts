"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateIdentity } from "@arche/registry-core";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { publishLibrary } from "@/lib/publish";
import { issueRegistryToken } from "@/lib/registry-token";
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
    redirect(`/dashboard/identities/new?error=${encodeURIComponent(error?.message ?? "create failed")}`);
  }
  revalidatePath("/dashboard");
  redirect(`/dashboard/identities/${(data as unknown as { id: string }).id}/edit`);
}

export interface SaveState {
  ok: boolean;
  issues?: Array<{ path: string; message: string }>;
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
