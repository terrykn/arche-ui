/* global console, process */
/**
 * Golden test for the style compiler.
 * - Compiles the single input twice → byte-identical (determinism).
 * - Compares against committed snapshot (goldens/golden-test.json) → silent drift fails.
 * Usage: node scripts/check-goldens.mjs [--write]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { compileIdentity } from "../dist/compiler.js";
import { validateIdentity, serializeStable } from "../dist/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const goldenPath = join(root, "goldens", "golden-test.json");
const repoRoot = join(root, "..", "..");
const write = process.argv.includes("--write");

const readFixture = (file) => JSON.parse(readFileSync(join(repoRoot, "fixtures", file), "utf8"));
const base = readFixture("identity.default.json");
const fixture = readFixture("identity.default.json");

const input = {
  key: "test",
  name: "golden-test",
  source: fixture.dna.source,
  axes: fixture.dna.axes,
  palette: fixture.dna.palette,
  profile: fixture.dna.profile ?? "standard",
};

let failures = 0;
mkdirSync(dirname(goldenPath), { recursive: true });
const first = compileIdentity({ ...input, base });
const second = compileIdentity({ ...input, base });
const a = serializeStable(first);
const b = serializeStable(second);
const hash = createHash("sha256").update(a).digest("hex").slice(0, 12);
const validation = validateIdentity(first);
const status = [];
if (a !== b) {
  failures++;
  status.push("NONDETERMINISTIC");
}
if (!validation.ok) {
  failures++;
  status.push("INVALID:" + validation.issues[0].path);
}
if (existsSync(goldenPath)) {
  const golden = readFileSync(goldenPath, "utf8");
  if (golden !== a) {
    if (write) {
      writeFileSync(goldenPath, a);
      status.push("REGENERATED-golden");
    } else {
      failures++;
      status.push("DRIFT-vs-golden");
    }
  }
} else if (write) {
  writeFileSync(goldenPath, a);
  status.push("WROTE-new-golden");
} else {
  failures++;
  status.push("MISSING-golden(run --write once, deliberately)");
}
const adj = first.meta.adjustments.length;
console.log(`${input.key}: hash=${hash} valid=${validation.ok} adjustments=${adj} ${status.join(" ") || "OK"}`);
if (failures > 0) {
  console.log(`GOLDENS: ${failures} failure(s)`);
  process.exit(1);
}
console.log("GOLDENS: all 1 pass");
