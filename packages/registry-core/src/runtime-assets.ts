import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Runtime data assets (keyword table, exemplar corpus) live next to this
 * module in the package — but server builds bundle the package, so
 * import.meta.url points at a bundler chunk instead of the package directory.
 * In that case walk up from the process cwd to the repo/package root, where
 * the traced workspace files are shipped.
 */
export function resolveRuntimeAsset(relative: string[]): string {
  const bases: string[] = [];
  try {
    bases.push(dirname(fileURLToPath(import.meta.url)));
  } catch {
    // Bundled CommonJS output has no file URL; cwd candidates still resolve.
  }
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    bases.push(join(dir, "packages", "registry-core", "dist"));
    bases.push(join(dir, "node_modules", "@arche", "registry-core", "dist"));
    dir = dirname(dir);
  }
  const candidates = bases.map((base) => join(base, ...relative));
  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0]!;
}
