/**
 * Tests for the Brief #7 staged picker options (Deliverable 4 groundwork):
 * - chips map onto real DNA axes with bounded deltas; composition commutes;
 * - three palette options, distinct anchors, evocative names, hue-bounded;
 * - enterprise profile collapses the accent family (no second hue);
 * - example records carry palette + typefaces + stack;
 * - applyPickerDelta is deterministic, clamps to 0-1, reports unknown chips,
 *   and falls back to the generation anchors on unknown palette ids.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const {
  applyPickerDelta,
  derivePaletteOptions,
  EXAMPLE_RECORDS,
  WORD_CHIPS,
} = require("./dist/index.js");

const AXES = ["warmth", "chroma", "energy", "playfulness", "sharpness", "density", "ornament", "formality"];

function midAxes() {
  return Object.fromEntries(AXES.map((axis) => [axis, 0.5]));
}

test("chips reference real DNA axes with bounded deltas", () => {
  assert.ok(WORD_CHIPS.length >= 6, "picker needs a real chip set");
  for (const chip of WORD_CHIPS) {
    assert.ok(chip.id && chip.label, "chip needs id + label");
    for (const [axis, delta] of Object.entries(chip.deltas)) {
      assert.ok(AXES.includes(axis), `chip '${chip.id}': unknown axis '${axis}'`);
      assert.ok(Math.abs(delta) <= 0.5, `chip '${chip.id}': delta out of nudge range`);
    }
  }
});

test("palette options: three, distinct, named, hue-bounded", () => {
  const options = derivePaletteOptions({ primaryHue: 170, accentHue: 20, neutralHue: 170 });
  assert.equal(options.length, 3);
  const ids = new Set(options.map((o) => o.id));
  assert.equal(ids.size, 3, "option ids unique");
  for (const option of options) {
    assert.ok(option.name && option.name !== option.id, "evocative name, not an id");
    for (const hue of Object.values(option.anchors)) {
      assert.ok(hue >= 0 && hue <= 360, "hue in range");
    }
    assert.ok(option.reason.length > 0, "reason recorded for the draft");
  }
  const anchors = new Set(options.map((o) => JSON.stringify(o.anchors)));
  assert.ok(anchors.size >= 2, "options differ from each other");
});

test("enterprise profile collapses the accent family", () => {
  const options = derivePaletteOptions({ primaryHue: 0, accentHue: 200, neutralHue: 0 }, "enterprise");
  assert.equal(options.length, 3);
  const boardroom = options.find((o) => o.id === "boardroom-ink");
  assert.ok(boardroom, "enterprise offers the boardroom option");
  assert.equal(boardroom.anchors.accentHue, boardroom.anchors.primaryHue);
});

test("example records carry palette + typefaces + stack", () => {
  assert.ok(EXAMPLE_RECORDS.length >= 3, "example step needs choices");
  for (const record of EXAMPLE_RECORDS) {
    assert.ok(record.title && record.blurb, "example needs title + blurb");
    assert.equal(record.typefaces.length, 2, "a pair, never independent fonts");
    assert.ok(record.stack.length > 0, "stack recorded per site");
    for (const hue of Object.values(record.palette)) {
      assert.ok(hue >= 0 && hue <= 360, "example hue in range");
    }
  }
});

test("applyPickerDelta composes, clamps, and reports", () => {
  const palette = { primaryHue: 170, accentHue: 20, neutralHue: 170 };
  const first = applyPickerDelta(midAxes(), palette, { chipIds: ["calm", "retro", "nope"], paletteId: "quiet-ground" });
  assert.deepEqual(first.unknownChips, ["nope"]);
  assert.equal(first.axes.playfulness, 0.7);
  assert.equal(first.axes.energy, 0.25);
  assert.equal(first.anchors.neutralHue, first.anchors.primaryHue);
  // Order-independence: chips commute.
  const second = applyPickerDelta(midAxes(), palette, { chipIds: ["retro", "calm", "calm"], paletteId: "quiet-ground" });
  assert.deepEqual(second.axes, first.axes, "duplicate chips apply once; order never matters");
  // Clamping at the rails.
  const rails = Object.fromEntries(AXES.map((axis) => [axis, 0.95]));
  const clamped = applyPickerDelta(rails, palette, { chipIds: ["retro", "bold", "dense", "premium"], paletteId: "as-dreamed" });
  for (const value of Object.values(clamped.axes)) {
    assert.ok(value >= 0 && value <= 1, "axes stay in range");
  }
  // Unknown palette id falls back to the generation anchors.
  const fallback = applyPickerDelta(midAxes(), palette, { chipIds: [], paletteId: "missing" });
  assert.deepEqual(fallback.anchors, palette);
  // Determinism.
  assert.equal(JSON.stringify(first), JSON.stringify(applyPickerDelta(midAxes(), palette, { chipIds: ["calm", "retro", "nope"], paletteId: "quiet-ground" })));
});
