import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type DesignRuleTier = "teach" | "enforce";
export type DesignRuleArea = "color" | "typography" | "radius" | "spacing" | "motion" | "slop";

export interface DesignRule {
  id: string;
  area: DesignRuleArea;
  tier: DesignRuleTier;
  statement: string;
  params: Record<string, unknown>;
}

export interface DesignRuleRegistry {
  registryVersion: number;
  rules: DesignRule[];
}

// The registry file lives at the package root (packages/foundation/design-rules/);
// dist output mirrors it via scripts/copy-assets.ts.
const REGISTRY_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "design-rules",
  "design-rules.json",
);

let cached: DesignRuleRegistry | null = null;

/** Loads the design-rules registry (parsed + typed). Rule ids are permanent once shipped. */
export function loadDesignRules(): DesignRuleRegistry {
  if (!cached) {
    cached = JSON.parse(readFileSync(REGISTRY_FILE, "utf8")) as DesignRuleRegistry;
  }
  return cached;
}

/** Registry version stamped into teach blocks and generation logs. */
export function designRulesVersion(): number {
  return loadDesignRules().registryVersion;
}

/** Teach-tier statements, in registry order (deterministic). */
export function teachStatements(): DesignRule[] {
  return loadDesignRules().rules.filter((rule) => rule.tier === "teach");
}

/** Enforce-tier rules, in registry order (deterministic). */
export function enforceRules(): DesignRule[] {
  return loadDesignRules().rules.filter((rule) => rule.tier === "enforce");
}

/**
 * The static teach block injected into generation system prompts. Built at
 * runtime from the registry file — never hand-maintain a second copy of the
 * rules in a prompt string, so taught and enforced rules cannot drift.
 * Byte-identical across calls for the same rules version (place it so the
 * provider can cache it).
 */
export function buildTeachBlock(): string {
  const version = designRulesVersion();
  const lines = teachStatements().map((rule) => `- [${rule.id}] ${rule.statement}`);
  return [
    `Arche design rules v${version} (taught; the checkable half is enforced on the compiled payload, so follow them — violations are repaired or rejected):`,
    ...lines,
  ].join("\n");
}
