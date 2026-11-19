import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FIXTURE_FILE = join("fixtures", "identity.default.json");

/**
 * Locate the repo fixtures dir from any monorepo cwd. The deployed server
 * bundles this module into a chunk, so also walk up from the module itself:
 * the traced fixture files ship at the function root, not next to the chunk.
 */
export function fixturesDir(): string {
  const starts: string[] = [];
  try {
    starts.push(dirname(fileURLToPath(import.meta.url)));
  } catch {
    // Bundled CommonJS output has no file URL; cwd candidates still resolve.
  }
  starts.push(process.cwd());
  const searched: string[] = [];
  for (const start of starts) {
    let dir = start;
    for (let i = 0; i < 6; i++) {
      searched.push(dir);
      if (existsSync(join(dir, FIXTURE_FILE))) {
        return join(dir, "fixtures");
      }
      dir = dirname(dir);
    }
  }
  throw new Error(
    `fixtures dir not found (identity.default.json missing) — searched ${searched.join(", ")}`,
  );
}

/** Deep copy of the Arche Default payload — the starting point for new identities. */
export function starterPayload(): unknown {
  return JSON.parse(
    readFileSync(join(fixturesDir(), "identity.default.json"), "utf8"),
  );
}

export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "identity";
}
