/**
 * Brief #7 D4 call-count proof: the staged picker recompiles the draft from
 * the single generation's DNA with ZERO model calls. Every picker step
 * (palette / example anchors / word chips) flows through applyPickerDelta +
 * compileValidIdentity — this test runs that exact path with the network
 * stubbed out and fails on the first fetch attempt.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(root, "..", "..");
const require = createRequire(join(root, "package.json"));
const { applyPickerDelta, derivePaletteOptions, EXAMPLE_RECORDS, validateIdentity } = require("./dist/index.js");
const { compileValidIdentity } = require("./dist/compiler.js");

let fetchCalls = 0;
globalThis.fetch = (...args) => {
  fetchCalls += 1;
  throw new Error(`picker recompile must not touch the network (attempt #${fetchCalls}: ${args[0]})`);
};

function fixture() {
  return JSON.parse(readFileSync(join(repoRoot, "fixtures", "identity.arche.json"), "utf8"));
}

async function recompile(current, selections, paletteOverride) {
  const applied = applyPickerDelta(
    current.dna.axes,
    current.dna.palette,
    selections,
    derivePaletteOptions(current.dna.palette, current.dna.profile ?? "standard"),
  );
  return compileValidIdentity(
    {
      name: current.meta.name,
      source: current.dna.source,
      axes: { ...current.dna.axes, ...applied.axes },
      palette: paletteOverride ?? applied.anchors,
      profile: current.dna.profile ?? "standard",
      base: current,
    },
    validateIdentity,
  );
}

test("palette + words + example steps recompile with zero network calls", async () => {
  const start = fixture();
  // Step 1: palette option.
  const palettes = derivePaletteOptions(start.dna.palette, start.dna.profile ?? "standard");
  const surprising = palettes.find((o) => o.id === "surprising") ?? palettes[1];
  const afterPalette = await recompile(start, { chipIds: [], paletteId: surprising.id });
  assert.deepEqual(afterPalette.dna.palette, surprising.anchors);
  // Step 2: example anchors.
  const record = EXAMPLE_RECORDS[0];
  const afterExample = await recompile(afterPalette, { chipIds: [], paletteId: "as-dreamed" }, { ...record.palette });
  assert.deepEqual(afterExample.dna.palette, record.palette);
  // Step 3: word chips.
  const afterWords = await recompile(afterExample, { chipIds: ["calm", "retro"], paletteId: "as-dreamed" });
  assert.ok(afterWords.dna.axes.energy < afterExample.dna.axes.energy, "calm quiets energy");
  assert.ok(afterWords.dna.axes.retroFuturism > afterExample.dna.axes.retroFuturism, "retro bends the era axis");
  // Every step stays a valid, AA-gated identity.
  for (const compiled of [afterPalette, afterExample, afterWords]) {
    const validation = validateIdentity(compiled);
    assert.equal(validation.ok, true, JSON.stringify(validation.issues)?.slice(0, 300));
  }
  assert.equal(fetchCalls, 0, "no model calls across all three picker steps");
});

test("picker recompile is deterministic", async () => {
  const start = fixture();
  const selections = { chipIds: ["bold", "minimal"], paletteId: "quiet-ground" };
  const first = await recompile(start, selections);
  const second = await recompile(start, selections);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.equal(fetchCalls, 0, "still no network on repeat compiles");
});
