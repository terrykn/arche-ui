import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { createHash } from "node:crypto";
import {
  buildPresentation,
  buildRegistry,
  serializeStable,
  validateIdentity,
  type ArcheIdentity,
} from "@arche-ui/registry-core";
import type { IdentityResult, LibrarySummary, McpBackend, PublishOutcome } from "./backend.js";

function payloadPaths(): string[] {
  const raw = process.env.ARCHE_MCP_PAYLOADS;
  if (!raw) return [];
  const target = resolve(raw);
  if (!existsSync(target)) return [];
  if (statSync(target).isDirectory()) {
    return readdirSync(target)
      .filter((f) => f.endsWith(".json"))
      .map((f) => join(target, f))
      .sort();
  }
  return [target];
}

function payloadName(path: string): string {
  return basename(path, ".json");
}

function readPayload(path: string): ArcheIdentity {
  return JSON.parse(readFileSync(path, "utf8")) as unknown as ArcheIdentity;
}

export function localPayloadFiles(): Array<{ name: string; path: string }> {
  return payloadPaths().map((path) => ({ name: payloadName(path), path }));
}

/** Local stdio backend: payloads are files, no versions, no publish gate. */
export class LocalBackend implements McpBackend {
  readonly kind = "local" as const;

  async listLibraries(): Promise<LibrarySummary[]> {
    return localPayloadFiles().map(({ name, path }) => {
      try {
        const payload = readPayload(path) as { meta?: { name?: string } };
        return { library: name, name: payload.meta?.name ?? name, version: null };
      } catch {
        return { library: name, version: null };
      }
    });
  }

  async getIdentity(library: string): Promise<IdentityResult | null> {
    const file = localPayloadFiles().find((f) => f.name === library);
    if (!file) return null;
    const payload = readPayload(file.path);
    return {
      payload,
      version: null,
      presentation: buildPresentation(payload),
      install: {
        registryUrl: null,
        commands: [`arche install --library ${library}`, `arche check`],
      },
    };
  }

  validatePayload(payload: unknown) {
    return validateIdentity(payload as ArcheIdentity);
  }

  async getDraft(library: string): Promise<ArcheIdentity | null> {
    const file = localPayloadFiles().find((f) => f.name === library);
    return file ? readPayload(file.path) : null;
  }

  async saveDraft(library: string, payload: ArcheIdentity): Promise<void> {
    const file = localPayloadFiles().find((f) => f.name === library);
    if (!file) throw new Error(`library '${library}' not found`);
    writeFileSync(file.path, serializeStable(payload), "utf8");
  }

  async draftHash(library: string): Promise<string | null> {
    const draft = await this.getDraft(library);
    return draft ? createHash("sha256").update(serializeStable(draft)).digest("hex") : null;
  }

  async latestVersion(): Promise<number | null> {
    return null;
  }

  async publish(): Promise<PublishOutcome> {
    return { ok: false, issues: [{ path: "publish", message: "publish is hosted-only; use emit_registry locally" }] };
  }

  async generateIdentity(): Promise<never> {
    throw new Error("generate_identity is hosted mode only");
  }

  async emit(library: string, outDir: string): Promise<string[]> {
    const draft = await this.getDraft(library);
    if (!draft) throw new Error(`library '${library}' not found`);
    const items = buildRegistry(draft);
    mkdirSync(resolve(outDir), { recursive: true });
    const files: string[] = [];
    for (const [name, json] of items) {
      const dest = join(resolve(outDir), `${name}.json`);
      writeFileSync(dest, json, "utf8");
      files.push(dest);
    }
    return files;
  }
}
