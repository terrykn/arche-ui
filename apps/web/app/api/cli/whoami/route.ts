import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { bearerFromHeader, verifyRegistryToken } from "@/lib/registry-token";

/**
 * CLI auth bridge (Brief #4, Deliverable 0).
 * Verifies a dashboard-issued registry token: returns the owner's username,
 * 401 otherwise. No other user data leaves this endpoint.
 */
export async function GET(request: Request) {
  const raw = bearerFromHeader(request.headers.get("authorization"));
  if (!raw) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let profiles: Array<{ id: string; username: string; registry_token_hash: string | null }> = [];
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id,username,registry_token_hash");
    if (error || !data) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    profiles = data as typeof profiles;
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const match = profiles.find(
    (p) => p.registry_token_hash && verifyRegistryToken(raw, p.registry_token_hash),
  );
  if (!match) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ username: match.username });
}
