"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { issueRegistryToken } from "@/lib/registry-token";
import { callbackWith, isLoopbackCallback } from "./loopback";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("not signed in");
  }
  return user.id;
}

/**
 * Authorize this machine: issue a fresh registry token (replacing any
 * previous one, exactly like dashboard issuance) and redirect the browser
 * back to the CLI's loopback URL carrying state + token. The raw token
 * appears only in that loopback redirect — never in rendered HTML or logs.
 */
export async function authorizeCallback(formData: FormData) {
  const callback = String(formData.get("callback") ?? "");
  const state = String(formData.get("state") ?? "");
  if (!isLoopbackCallback(callback)) {
    throw new Error("invalid callback URL");
  }
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    const next = `/cli/auth?callback=${encodeURIComponent(callback)}&state=${encodeURIComponent(state)}`;
    redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  }
  const { raw, hash, prefix } = issueRegistryToken();
  const service = createServiceClient();
  const { error } = await service
    .from("profiles")
    .update({
      registry_token_hash: hash,
      registry_token_prefix: prefix,
      registry_token_created_at: new Date().toISOString(),
    })
    .eq("id", userId!);
  if (error) {
    redirect(callbackWith(callback, { error: "issue_failed", state }));
  }
  redirect(callbackWith(callback, { state, token: raw }));
}

export async function denyCallback(formData: FormData) {
  const callback = String(formData.get("callback") ?? "");
  const state = String(formData.get("state") ?? "");
  if (!isLoopbackCallback(callback)) {
    throw new Error("invalid callback URL");
  }
  redirect(callbackWith(callback, { error: "denied", state }));
}
