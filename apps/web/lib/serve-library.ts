import { serializeStable } from "@arche/registry-core";
import { createServiceClient } from "./supabase/service";
import { bearerFromHeader, verifyRegistryToken } from "./registry-token";
import type { Library, LibraryVersion, Profile } from "./db";

export interface ServedItem {
  status: 200;
  json: string;
}

export interface ServedMiss {
  status: 404;
}

/**
 * Shared registry serving lookup (Brief #3 §6 + Rule 3).
 * Private libraries 404 — with no payload content — for anyone without the
 * owner's registry token. No redirects that would confirm existence.
 */
export async function lookupItem(
  username: string,
  slug: string,
  file: string,
  version: number | null,
  authHeader: string | null,
): Promise<ServedItem | ServedMiss> {
  if (!file.endsWith(".json") || file.includes("/") || file.includes("\\")) {
    return { status: 404 };
  }
  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,registry_token_hash")
    .eq("username", username)
    .maybeSingle();
  if (!profile) {
    return { status: 404 };
  }
  const owner = profile as unknown as Pick<Profile, "id" | "registry_token_hash">;

  const { data: library } = await supabase
    .from("libraries")
    .select("id,visibility")
    .eq("owner", owner.id)
    .eq("slug", slug)
    .maybeSingle();
  if (!library) {
    return { status: 404 };
  }
  const row = library as unknown as Pick<Library, "id" | "visibility">;

  if (row.visibility === "private") {
    const raw = bearerFromHeader(authHeader);
    if (!raw || !owner.registry_token_hash || !verifyRegistryToken(raw, owner.registry_token_hash)) {
      return { status: 404 };
    }
  }

  let query = supabase
    .from("library_versions")
    .select("snapshot")
    .eq("library_id", row.id);
  query =
    version === null
      ? query.order("version", { ascending: false }).limit(1)
      : query.eq("version", version);
  const { data: versionRow } = await query.maybeSingle();
  if (!versionRow) {
    return { status: 404 };
  }
  const snapshot = (versionRow as unknown as Pick<LibraryVersion, "snapshot">).snapshot;
  const stored = snapshot?.[file];
  if (typeof stored !== "string") {
    return { status: 404 };
  }

  // Re-serialize through the emitter's stable serializer so served bytes are
  // identical to the local emit output regardless of JSONB key ordering.
  return { status: 200, json: serializeStable(JSON.parse(stored)) };
}
