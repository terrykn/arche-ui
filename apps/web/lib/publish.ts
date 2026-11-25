import { createHash } from "node:crypto";
import {
  assertGeneratedCompliant,
  buildRegistry,
  serializeStable,
  validateIdentity,
} from "@arche-ui/registry-core";
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

  // Design-rule enforcement binds generated payloads at publish too: a
  // payload carrying DNA must be strictly compliant (the generator
  // repairs-or-fails, so this only fires on post-generation hand edits).
  // Hand-authored payloads (no DNA) publish with lint findings attached.
  const payload = row.payload as Parameters<typeof validateIdentity>[0];
  if (payload.dna) {
    try {
      assertGeneratedCompliant(payload);
    } catch (err) {
      return {
        ok: false,
        issues: [{ path: "design-rules", message: err instanceof Error ? err.message : String(err) }],
      };
    }
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

  // Part 5.1: versioned specimen assets. Awaited but non-fatal — publish
  // succeeds even when headless rendering or storage is unavailable.
  try {
    const { captureVersionAssets } = await import("./specimen-assets");
    const ownerProfile = await supabase.from("profiles").select("username").eq("id", library.owner).maybeSingle();
    const username =
      (ownerProfile.data as unknown as { username: string } | null)?.username ?? "user";
    const outcome = await captureVersionAssets({
      libraryId,
      username,
      slug: row.slug as string,
      version: nextVersion,
    });
    console.info(`[publish] specimen assets v${nextVersion}: ${outcome.mechanism}`);
  } catch (err) {
    console.warn(`[publish] specimen assets skipped: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { ok: true, version: nextVersion };
}

export type { LibraryVersion };
