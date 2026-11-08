import { createHash } from "node:crypto";
import { buildRegistry, serializeStable, validateIdentity } from "@arche/registry-core";
import { createServiceClient } from "./supabase/service";
import type { Library, LibraryVersion } from "./db";

export interface PublishResult {
  ok: true;
  version: number;
}

export interface PublishFailure {
  ok: false;
  issues: Array<{ path: string; message: string }>;
}

/**
 * Publish gate (Brief #3 Rule 2 + §6): load payload → validate with the same
 * code as the local emit path → emit → store an immutable snapshot.
 * Invalid payloads cannot publish; failures name the token/pair/knob.
 */
export async function publishLibrary(
  libraryId: string,
  ownerId: string,
): Promise<PublishResult | PublishFailure> {
  const supabase = createServiceClient();

  const { data: library, error: libraryError } = await supabase
    .from("libraries")
    .select("*")
    .eq("id", libraryId)
    .eq("owner", ownerId)
    .single();
  if (libraryError || !library) {
    return {
      ok: false,
      issues: [{ path: "library", message: "library not found" }],
    };
  }
  const row = library as unknown as Library;

  const validation = validateIdentity(row.payload as Parameters<typeof validateIdentity>[0]);
  if (!validation.ok) {
    return { ok: false, issues: validation.issues };
  }

  const items = buildRegistry(row.payload as Parameters<typeof buildRegistry>[0]);
  const snapshot: Record<string, string> = {};
  for (const [name, json] of items) {
    snapshot[`${name}.json`] = json;
  }
  const payloadHash = createHash("sha256").update(serializeStable(row.payload)).digest("hex");

  const { data: latest } = await supabase
    .from("library_versions")
    .select("version")
    .eq("library_id", libraryId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = ((latest as unknown as { version: number } | null)?.version ?? 0) + 1;

  const { error: insertError } = await supabase.from("library_versions").insert({
    library_id: libraryId,
    version: nextVersion,
    payload_hash: payloadHash,
    snapshot,
    payload: JSON.parse(serializeStable(row.payload)),
  });
  if (insertError) {
    return {
      ok: false,
      issues: [{ path: "library_versions", message: `snapshot store failed: ${insertError.message}` }],
    };
  }

  await supabase
    .from("libraries")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", libraryId);

  return { ok: true, version: nextVersion };
}

export type { LibraryVersion };
