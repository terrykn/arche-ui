import { createHash } from "node:crypto";
import {
  buildPresentation,
  buildRegistry,
  serializeStable,
  validateIdentity,
  type ArcheIdentity,
} from "@arche/registry-core";
import type { McpBackend, IdentityResult, LibrarySummary, PublishOutcome, GenerateOutcome } from "@arche/mcp";
import { createServiceClient } from "./supabase/service";
import { publishLibrary } from "./publish";
import { generateFromPhrase } from "./generation/service";

function parseRef(ref: string): { username: string | null; slug: string } {
  const parts = ref.split("/").filter(Boolean);
  if (parts.length === 2) return { username: parts[0]!, slug: parts[1]! };
  return { username: null, slug: parts[0] ?? ref };
}

/**
 * Hosted backend (§6): reads Brief #3 drafts + immutable published versions.
 * Private payloads 404 for non-owners — same refusal as /r/… serving.
 */
export class HostedBackend implements McpBackend {
  readonly kind = "hosted" as const;
  constructor(
    private ownerId: string,
    private ownerUsername: string,
    private baseUrl: string,
  ) {}

  private svc() {
    return createServiceClient();
  }

  async listLibraries(): Promise<LibrarySummary[]> {
    const supabase = this.svc();
    const { data } = await supabase
      .from("libraries")
      .select("name,slug,visibility,owner")
      .order("updated_at", { ascending: false })
      .limit(100);
    const libs = (data ?? []) as Array<{
      name: string;
      slug: string;
      visibility: string;
      owner: string;
    }>;
    const { data: profiles } = await supabase.from("profiles").select("id,username");
    const names = new Map(
      ((profiles ?? []) as Array<{ id: string; username: string }>).map((p) => [p.id, p.username]),
    );
    const rows = libs.map((r) => ({
      ...r,
      profiles: { username: names.get(r.owner) ?? "unknown" },
    }));
    // Entitlement: own libraries + public libraries only.
    return rows
      .filter((r) => r.owner === this.ownerId || r.visibility === "public")
      .map((r) => ({
        library: `${r.profiles?.username ?? "unknown"}/${r.slug}`,
        name: r.name,
        visibility: r.visibility,
        version: null,
      }));
  }

  private async resolveLibrary(ref: string) {
    const { username, slug } = parseRef(ref);
    const supabase = this.svc();
    if (username) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id,username")
        .eq("username", username)
        .maybeSingle();
      if (!profile) return null;
      const p = profile as unknown as { id: string; username: string };
      const { data: library } = await supabase
        .from("libraries")
        .select("id,name,slug,visibility,owner,payload")
        .eq("owner", p.id)
        .eq("slug", slug)
        .maybeSingle();
      if (!library) return null;
      return { library: library as unknown as Record<string, unknown> & { payload: ArcheIdentity }, ownerUsername: p.username };
    }
    const { data: library } = await supabase
      .from("libraries")
      .select("id,name,slug,visibility,owner,payload")
      .eq("owner", this.ownerId)
      .eq("slug", slug)
      .maybeSingle();
    if (!library) return null;
    return {
      library: library as unknown as Record<string, unknown> & { payload: ArcheIdentity },
      ownerUsername: this.ownerUsername,
    };
  }

  private canRead(row: { visibility: string; owner: string }): boolean {
    if (row.owner === this.ownerId) return true;
    return row.visibility === "public";
  }

  async getIdentity(library: string, version?: number): Promise<IdentityResult | null> {
    const resolved = await this.resolveLibrary(library);
    if (!resolved) return null;
    const row = resolved.library as unknown as {
      id: string;
      name: string;
      slug: string;
      visibility: string;
      owner: string;
      payload: ArcheIdentity;
    };
    if (!this.canRead(row)) return null;
    const supabase = this.svc();
    let servedVersion: number | null = null;
    let servedPayload = row.payload;
    if (version !== undefined) {
      const { data } = await supabase
        .from("library_versions")
        .select("version,payload")
        .eq("library_id", row.id)
        .eq("version", version)
        .maybeSingle();
      if (!data) return null;
      const v = data as unknown as { version: number; payload: ArcheIdentity | null };
      servedVersion = v.version;
      // Pre-payload snapshots (before Brief #5 migration) fall back to draft.
      if (v.payload) servedPayload = v.payload;
    } else {
      const { data } = await supabase
        .from("library_versions")
        .select("version,payload")
        .eq("library_id", row.id)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      const v = data as unknown as { version: number; payload: ArcheIdentity | null } | null;
      servedVersion = v?.version ?? null;
      if (v?.payload) servedPayload = v.payload;
    }
    const draft = servedPayload;
    const assetBase = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/identity-assets`
      : undefined;
    return {
      payload: draft,
      version: servedVersion,
      presentation: buildPresentation(draft, {
        assetBaseUrl: assetBase,
        libraryId: row.id,
        version: servedVersion,
      }),
      install: {
        registryUrl: `${this.baseUrl}/r/${resolved.ownerUsername}/${row.slug}`,
        commands: [
          `arche init ${resolved.ownerUsername}/${row.slug}`,
          `arche install --library ${resolved.ownerUsername}/${row.slug}`,
        ],
      },
    };
  }

  validatePayload(payload: unknown) {
    return validateIdentity(payload as ArcheIdentity);
  }

  async getDraft(library: string): Promise<ArcheIdentity | null> {
    const resolved = await this.resolveLibrary(library);
    if (!resolved) return null;
    const row = resolved.library as unknown as { owner: string; visibility: string; payload: ArcheIdentity };
    if (!this.canRead(row)) return null;
    // Draft writes are owner-only; reads follow registry entitlement.
    return row.payload;
  }

  async saveDraft(library: string, payload: ArcheIdentity, _provenance: string): Promise<void> {
    const resolved = await this.resolveLibrary(library);
    if (!resolved) throw new Error(`library '${library}' not found`);
    const row = resolved.library as unknown as { id: string; owner: string };
    if (row.owner !== this.ownerId) throw new Error("only the owner can edit this library");
    const supabase = this.svc();
    const { error } = await supabase
      .from("libraries")
      .update({ payload: JSON.parse(serializeStable(payload)), updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) throw new Error(`draft save failed: ${error.message}`);
  }

  async draftHash(library: string): Promise<string | null> {
    const draft = await this.getDraft(library);
    return draft ? createHash("sha256").update(serializeStable(draft)).digest("hex") : null;
  }

  async latestVersion(library: string): Promise<number | null> {
    const resolved = await this.resolveLibrary(library);
    if (!resolved) return null;
    const row = resolved.library as unknown as { id: string; owner: string; visibility: string };
    if (!this.canRead(row)) return null;
    const supabase = this.svc();
    const { data } = await supabase
      .from("library_versions")
      .select("version")
      .eq("library_id", row.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as unknown as { version: number } | null)?.version ?? null;
  }

  async publish(library: string): Promise<PublishOutcome> {
    const resolved = await this.resolveLibrary(library);
    if (!resolved) return { ok: false, issues: [{ path: "library", message: `library '${library}' not found` }] };
    const row = resolved.library as unknown as { id: string; owner: string };
    if (row.owner !== this.ownerId) {
      return { ok: false, issues: [{ path: "library", message: "only the owner can publish" }] };
    }
    const result = await publishLibrary(row.id, this.ownerId);
    if (!result.ok) return { ok: false, issues: result.issues };
    return {
      ok: true,
      version: result.version,
      registryUrl: `${this.baseUrl}/r/${resolved.ownerUsername}/${(resolved.library as unknown as { slug: string }).slug}`,
    };
  }

  async emit(): Promise<string[]> {
    throw new Error("emit_registry is local mode only");
  }

  /** Shapeshift text door over MCP: same service as the dashboard (Rule 5). */
  async generateIdentity(prompt: string, name?: string): Promise<GenerateOutcome> {
    const outcome = await generateFromPhrase(this.ownerId, prompt, name);
    return {
      library: `${this.ownerUsername}/${outcome.slug}`,
      libraryId: outcome.libraryId,
      adjustments: outcome.adjustments,
    };
  }
}
