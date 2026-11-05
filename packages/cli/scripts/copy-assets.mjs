/**
 * Bundles the Arche-owned catalog data into the built CLI (Brief #4 §8):
 * `arche check` reads manifests from dist/data/, never from the network
 * and never from the foundation source tree at runtime.
 */
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..");
const foundation = join(pkgRoot, "..", "foundation", "src");

const dataDir = join(pkgRoot, "dist", "data");
mkdirSync(dataDir, { recursive: true });

// Manifests: full documents (standards sections carry the permanent rule ids).
cpSync(join(foundation, "manifests"), join(dataDir, "manifests-tmp"), { recursive: true });
const { readdirSync } = await import("node:fs");
const manifests = readdirSync(join(dataDir, "manifests-tmp"))
  .filter((file) => file.endsWith(".json"))
  .sort()
  .map((file) => JSON.parse(readFileSync(join(dataDir, "manifests-tmp", file), "utf8")));
writeFileSync(join(dataDir, "manifests.json"), JSON.stringify(manifests));
const { rmSync } = await import("node:fs");
rmSync(join(dataDir, "manifests-tmp"), { recursive: true, force: true });

// Token contract: the closed token surface check scans against.
cpSync(join(foundation, "contract", "token-contract.json"), join(dataDir, "token-contract.json"));

const count = manifests.length;
// eslint-disable-next-line no-undef
console.log(`cli assets: bundled ${count} manifests + token contract into dist/data/`);
