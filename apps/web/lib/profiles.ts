import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Self-healing profile lookup (FK safety net for libraries.owner →
 * profiles.id). Sign-ups normally create the profile row via the
 * `on_auth_user_created` trigger, but if that trigger was never applied to
 * the project (or failed for an older account), every library insert fails
 * with `libraries_owner_fkey` violation. Callers that insert libraries
 * must ensure the row first instead of surfacing the raw FK error.
 */
export async function ensureProfileExists(
  service: SupabaseClient,
  userId: string,
  email: string | null,
  displayName: string | null,
): Promise<void> {
  const { data } = await service.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (data) return;

  let base = (email ?? "").split("@")[0]!.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  if (base.length < 3) base = `user-${userId.slice(0, 8)}`;
  let candidate = base;
  let n = 1;
  for (;;) {
    const { data: clash } = await service.from("profiles").select("id").eq("username", candidate).maybeSingle();
    if (!clash) break;
    n += 1;
    candidate = `${base.slice(0, 40 - String(n).length - 1)}-${n}`;
  }
  await service.from("profiles").insert({
    id: userId,
    username: candidate,
    display_name: displayName ?? (email ?? "").split("@")[0] ?? null,
  });
}
