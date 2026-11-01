import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface IconLibraryEntry {
  id: string;
  name: string;
  packages: string[];
  license: string;
  approxCount: string;
  notes: string;
  slots: Record<string, string>;
}

export interface IconRegistry {
  registryVersion: number;
  requiredSlots: string[];
  libraries: IconLibraryEntry[];
}

export interface RegistryIssue {
  path: string;
  message: string;
}

const REGISTRY_FILE = join(dirname(fileURLToPath(import.meta.url)), "icon-registry.json");

let cached: IconRegistry | null = null;

/** Loads the closed icon library registry (parsed + typed). */
export function loadIconRegistry(): IconRegistry {
  if (!cached) {
    cached = JSON.parse(readFileSync(REGISTRY_FILE, "utf8")) as IconRegistry;
  }
  return cached;
}

/** Libraries by id. */
export function iconLibrariesById(): Map<string, IconLibraryEntry> {
  return new Map(loadIconRegistry().libraries.map((library) => [library.id, library]));
}

/**
 * Validates an identity's icon library selection: exactly one known library id,
 * and every registered library must cover every required slot (a library that
 * cannot cover a slot fails validation naming the missing slots — never
 * silently substituted).
 */
export function validateIconSelection(icons: string | undefined): RegistryIssue[] {
  const issues: RegistryIssue[] = [];
  const registry = loadIconRegistry();
  if (typeof icons !== "string" || icons.length === 0) {
    issues.push({
      path: "icons",
      message: "identity declares no icon library; exactly one icon library id is required",
    });
  } else if (!iconLibrariesById().has(icons)) {
    issues.push({
      path: "icons",
      message: `icon library '${icons}' is not in the closed icon registry`,
    });
  }
  for (const library of registry.libraries) {
    const missing = registry.requiredSlots.filter((slot) => !(slot in library.slots));
    for (const slot of missing) {
      issues.push({
        path: `icons.${library.id}`,
        message: `icon library '${library.id}' (${library.name}) has no equivalent for required slot '${slot}'`,
      });
    }
  }
  return issues;
}
