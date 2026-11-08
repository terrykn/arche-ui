"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { issueMcpToken } from "@/lib/mcp-tokens";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  return user.id;
}

export async function createMcpTokenAction(
  formData: FormData,
): Promise<{ raw: string } | { error: string }> {
  const userId = await requireUserId();
  const label = String(formData.get("label") ?? "mcp").trim().slice(0, 60) || "mcp";
  const { raw, hash } = issueMcpToken();
  const service = createServiceClient();
  const { error } = await service.from("mcp_tokens").insert({
    user_id: userId,
    token_hash: hash,
    label,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/settings");
  return { raw };
}

export async function revokeMcpTokenAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/dashboard/settings?error=Missing%20token%20id");
  const service = createServiceClient();
  await service
    .from("mcp_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?saved=1");
}
