import type { ArcheIdentity, ValidationResult } from "@arche/registry-core";

export interface LibrarySummary {
  /** `<user>/<library>` on hosted, payload name on local. */
  library: string;
  visibility?: string;
  version?: number | null;
  name?: string;
}

export interface PresentationRef {
  imagery: string;
  motion: {
    feel: string;
    durationFast: string | null;
    durationNormal: string | null;
    guidance: string[];
  };
  specimens: { sinkLight: string; sinkDark: string; og: string } | null;
  antiSlop: Array<{ rule: string; guidance: string }>;
  note: string;
}

export interface IdentityResult {
  payload: ArcheIdentity;
  /** Version that was served (null for local files / unpublished drafts). */
  version: number | null;
  /** Deterministic presentation guidance (Part 5.2) — zero model calls. */
  presentation: PresentationRef;
  install: {
    registryUrl: string | null;
    commands: string[];
  };
}

export interface PublishOutcome {
  ok: boolean;
  version?: number;
  registryUrl?: string | null;
  issues?: ValidationResult["issues"];
}

export interface GenerateOutcome {
  /** `<user>/<slug>` reference for follow-up tools. */
  library: string;
  libraryId: string;
  /** AA-lighten/darken passes the compiler applied. */
  adjustments: number;
}

/**
 * Transport-agnostic data interface (§4). Local stdio serves payload files;
 * hosted HTTP serves the Brief #3 data layer (drafts + immutable versions).
 * A behavior difference between backends is noted on the tool, never silent.
 */
export interface McpBackend {
  readonly kind: "local" | "hosted";
  listLibraries(): Promise<LibrarySummary[]>;
  getIdentity(library: string, version?: number): Promise<IdentityResult | null>;
  validatePayload(payload: unknown): ValidationResult;
  getDraft(library: string): Promise<ArcheIdentity | null>;
  saveDraft(library: string, payload: ArcheIdentity, provenance: string): Promise<void>;
  draftHash(library: string): Promise<string | null>;
  latestVersion(library: string): Promise<number | null>;
  publish(library: string): Promise<PublishOutcome>;
  emit(library: string, outDir: string): Promise<string[]>;
  /** Shapeshift text door: phrase → validated private draft (hosted only). */
  generateIdentity(prompt: string, name?: string): Promise<GenerateOutcome>;
}
