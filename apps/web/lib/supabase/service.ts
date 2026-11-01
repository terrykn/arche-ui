import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. SERVER ONLY — never import from client components.
 * Bypasses RLS; every caller must enforce entitlement itself (private
 * libraries 404 for non-owners, per Brief #3 Rule 3).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error("Supabase service credentials are not configured");
  }
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
