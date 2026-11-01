import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** Locate the repo fixtures dir from any monorepo cwd. */
export function fixturesDir(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(dir, "fixtures", "identity.default.json"))) {
      return join(dir, "fixtures");
    }
    dir = dirname(dir);
  }
  throw new Error("fixtures dir not found (identity.default.json missing)");
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
