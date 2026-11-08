/* global console, process */
/**
 * Golden battery for the style compiler (Brief #6 §5).
 * - Compiles every input twice → byte-identical (determinism).
 * - Compares against committed snapshots (goldens/*.json) → silent drift fails.
 * Usage: node scripts/check-goldens.mjs [--write]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { compileIdentity } from "../dist/compiler.js";
import { validateIdentity, serializeStable } from "../dist/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const goldensDir = join(root, "goldens");
const repoRoot = join(root, "..", "..");
const write = process.argv.includes("--write");

const readFixture = (file) => JSON.parse(readFileSync(join(repoRoot, "fixtures", file), "utf8"));
const base = readFixture("identity.arche.json");

const guardrails = { minContrast: "AA", respectReducedMotion: true };
/** @type {Array<{ key: string; name: string; source: object; axes: object; palette: object }>} */
const inputs = [
  ...["arcade", "hospital", "default", "arche"].map((key) => {
    const f = readFixture(`identity.${key}.json`);
    return { key, name: `golden-${key}`, source: f.dna.source, axes: f.dna.axes, palette: f.dna.palette, profile: f.dna.profile ?? "standard" };
  }),
  {
    key: "ember-phrase",
    name: "golden-ember",
    source: { type: "phrase", promptText: "ember" },
    axes: {
      warmth: 0.85, energy: 0.7, playfulness: 0.45, sharpness: 0.55,
      density: 0.5, ornament: 0.35, retroFuturism: 0.25, formality: 0.3,
      material: "clay", motionFeel: "smooth", texture: "grain", ...guardrails,
    },
    palette: { primaryHue: 25, accentHue: 45, neutralHue: 60 },
  },
  {
    key: "abyss-trap",
    name: "golden-abyss",
    source: { type: "phrase", promptText: "dark abyss, near-black everything" },
    axes: {
      warmth: 0.2, energy: 0.15, playfulness: 0.1, sharpness: 0.8,
      density: 0.7, ornament: 0.1, retroFuturism: 0.1, formality: 0.7,
      material: "metal", motionFeel: "snappy", texture: "none", ...guardrails,
    },
    palette: { primaryHue: 230, accentHue: 210, neutralHue: 240 },
  },
  {
    key: "formal-ink",
    name: "golden-ink",
    source: { type: "phrase", promptText: "formal institutional ink" },
    axes: {
      warmth: 0.3, energy: 0.2, playfulness: 0.05, sharpness: 0.6,
      density: 0.45, ornament: 0.15, retroFuturism: 0.0, formality: 1.0,
      material: "flat", motionFeel: "stately", texture: "none", ...guardrails,
    },
    palette: { primaryHue: 220, accentHue: 220, neutralHue: 230 },
  },
  {
    key: "marble-garden",
    name: "golden-garden",
    source: { type: "phrase", promptText: "marble garden party" },
    axes: {
      warmth: 0.7, energy: 0.4, playfulness: 0.6, sharpness: 0.25,
      density: 0.3, ornament: 0.85, retroFuturism: 0.15, formality: 0.4,
      material: "marble", motionFeel: "smooth", texture: "marble-vein", ...guardrails,
    },
    palette: { primaryHue: 150, accentHue: 90, neutralHue: 80 },
  },
  {
    key: "glitch-noise",
    name: "golden-glitch",
    source: { type: "phrase", promptText: "glitch noise broadcast" },
    axes: {
      warmth: 0.4, energy: 1.0, playfulness: 0.8, sharpness: 1.0,
      density: 0.9, ornament: 0.5, retroFuturism: 0.9, formality: 0.0,
      material: "glass", motionFeel: "glitchy", texture: "scanlines", ...guardrails,
    },
    palette: { primaryHue: 320, accentHue: 180, neutralHue: 260 },
  },
];

let failures = 0;
mkdirSync(goldensDir, { recursive: true });
for (const input of inputs) {
  const first = compileIdentity({ ...input, base });
  const second = compileIdentity({ ...input, base });
  const a = serializeStable(first);
  const b = serializeStable(second);
  const hash = createHash("sha256").update(a).digest("hex").slice(0, 12);
  const validation = validateIdentity(first);
  const goldenPath = join(goldensDir, `golden-${input.key}.json`);
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
}
if (failures > 0) {
  console.log(`GOLDENS: ${failures} failure(s)`);
  process.exit(1);
}
console.log(`GOLDENS: all ${inputs.length} pass`);
