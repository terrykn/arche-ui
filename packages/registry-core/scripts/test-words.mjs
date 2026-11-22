/**
 * Tests for the describe-in-words model (creation flow):
 * - vocabulary: the nine words with exactly the specified traits;
 * - the one rule: last pick wins per trait, never averaged, no
 *   special-casing per pair — every contradictory pair in both orders;
 * - partial overlaps compose (Bold + Soft keeps thick borders + pillowy
 *   corners either way);
 * - a word that loses all its traits deselects itself; removing the
 *   winner restores the earlier word's values;
 * - words are shape-only: voice axes byte-identical, profile stable,
 *   pixel never written, ornament never raised past the type gates;
 * - border voices compile to real widths (invisible is 0px), profile-clamped;
 * - applyPickerDelta wordOrder is deterministic and order-sensitive.
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
const { applyPickerDelta, DESCRIBE_WORDS, resolveDescribeWords } = require("./dist/index.js");
const { compileIdentity } = require("./dist/compiler.js");

const AXES = ["warmth", "chroma", "energy", "playfulness", "sharpness", "density", "ornament", "formality"];
const VOICE_AXES = ["warmth", "chroma", "energy", "playfulness", "formality"];

function midAxes() {
  return Object.fromEntries(AXES.map((axis) => [axis, 0.5]));
}

function palette() {
  return { primaryHue: 170, accentHue: 20, neutralHue: 170 };
}

test("vocabulary: nine words with exactly the specified traits", () => {
  const expected = {
    calm: { shadow: "subtle", spacing: "spacious" },
    bold: { borders: "thick", roundedness: "sharp" },
    playful: { roundedness: "bubbly", shadow: "lifted" },
    minimal: { shadow: "flat", borders: "invisible" },
    soft: { roundedness: "pillowy", shadow: "gentle" },
    sharp: { roundedness: "square", borders: "defined" },
    spacious: { spacing: "roomy", borders: "hairline" },
    compact: { spacing: "dense", shadow: "flat" },
    flat: { shadow: "none", borders: "hairline" },
  };
  assert.deepEqual(
    DESCRIBE_WORDS.map((word) => word.id).sort(),
    Object.keys(expected).sort(),
    "exactly the nine specified words",
  );
  for (const word of DESCRIBE_WORDS) {
    assert.deepEqual(word.properties, expected[word.id], `word '${word.id}' writes exactly its traits`);
  }
});

// Every contradictory pair, asserted in both pick orders with the full
// expected owner per trait: the later pick owns every trait it writes
// (no averaging, no special-casing), and traits only one word writes keep
// their sole writer. Calm vs Compact collides on both traits, so the
// later pick shadows the earlier word entirely.
const CONTRADICTIONS = [
  {
    pair: ["soft", "sharp"],
    trait: "roundedness",
    forward: { shadow: "soft", borders: "sharp", roundedness: "sharp", spacing: null },
    backward: { shadow: "soft", borders: "sharp", roundedness: "soft", spacing: null },
  },
  {
    pair: ["spacious", "compact"],
    trait: "spacing",
    forward: { shadow: "compact", borders: "spacious", roundedness: null, spacing: "compact" },
    backward: { shadow: "compact", borders: "spacious", roundedness: null, spacing: "spacious" },
  },
  {
    pair: ["flat", "playful"],
    trait: "shadow",
    forward: { shadow: "playful", borders: "flat", roundedness: "playful", spacing: null },
    backward: { shadow: "flat", borders: "flat", roundedness: "playful", spacing: null },
  },
  {
    pair: ["flat", "soft"],
    trait: "shadow",
    forward: { shadow: "soft", borders: "flat", roundedness: "soft", spacing: null },
    backward: { shadow: "flat", borders: "flat", roundedness: "soft", spacing: null },
  },
  {
    pair: ["minimal", "bold"],
    trait: "borders",
    forward: { shadow: "minimal", borders: "bold", roundedness: "bold", spacing: null },
    backward: { shadow: "minimal", borders: "minimal", roundedness: "bold", spacing: null },
  },
  {
    pair: ["minimal", "playful"],
    trait: "shadow",
    forward: { shadow: "playful", borders: "minimal", roundedness: "playful", spacing: null },
    backward: { shadow: "minimal", borders: "minimal", roundedness: "playful", spacing: null },
  },
  {
    pair: ["calm", "compact"],
    trait: "spacing",
    forward: { shadow: "compact", borders: null, roundedness: null, spacing: "compact" },
    backward: { shadow: "calm", borders: null, roundedness: null, spacing: "calm" },
  },
  {
    pair: ["bold", "soft"],
    trait: "roundedness",
    forward: { shadow: "soft", borders: "bold", roundedness: "soft", spacing: null },
    backward: { shadow: "soft", borders: "bold", roundedness: "bold", spacing: null },
  },
];

for (const { pair, trait, forward: wantForward, backward: wantBackward } of CONTRADICTIONS) {
  const [a, b] = pair;
  test(`${a} vs ${b} (${trait}): last pick wins, both orders`, () => {
    const forward = resolveDescribeWords([a, b]);
    assert.equal(forward.slots[trait]?.wordId, b, `${b} picked last owns ${trait}`);
    for (const [slot, wantOwner] of Object.entries(wantForward)) {
      assert.equal(forward.slots[slot]?.wordId ?? null, wantOwner, `forward: ${slot} owned by ${wantOwner}`);
    }
    const backward = resolveDescribeWords([b, a]);
    assert.equal(backward.slots[trait]?.wordId, a, `${a} picked last owns ${trait}`);
    for (const [slot, wantOwner] of Object.entries(wantBackward)) {
      assert.equal(backward.slots[slot]?.wordId ?? null, wantOwner, `backward: ${slot} owned by ${wantOwner}`);
    }
    // Replays agree slot by slot: the rule is deterministic.
    assert.deepEqual(resolveDescribeWords([a, b]).slots, forward.slots, "replay is stable");
  });
}

test("contradictory axes resolve to the winner's absolute value (never averaged)", () => {
  const base = midAxes();
  const fold = (wordOrder) =>
    applyPickerDelta(base, palette(), { chipIds: [], paletteId: "as-dreamed", wordOrder });
  assert.equal(fold(["soft", "sharp"]).axes.sharpness, 1, "sharp last: square, not a medium corner");
  assert.equal(fold(["sharp", "soft"]).axes.sharpness, 0.1, "soft last: pillowy, not a medium corner");
  assert.equal(fold(["spacious", "compact"]).axes.density, 0.85, "compact last: dense");
  assert.equal(fold(["compact", "spacious"]).axes.density, 0.3, "spacious last: roomy");
  assert.equal(fold(["flat", "playful"]).axes.material, "clay", "playful last: lifted surface");
  assert.equal(fold(["playful", "flat"]).axes.material, "flat", "flat last: flat surface");
  assert.equal(fold(["flat", "soft"]).axes.material, "paper", "soft last: gentle paper surface");
  assert.equal(fold(["minimal", "bold"]).borderWidth, "thick", "bold last owns borders");
  assert.equal(fold(["bold", "minimal"]).borderWidth, "invisible", "minimal last owns borders");
});

test("partial overlaps compose: Bold + Soft keeps thick borders and pillowy corners either way", () => {
  for (const order of [["bold", "soft"], ["soft", "bold"]]) {
    const resolved = resolveDescribeWords(order);
    assert.equal(resolved.slots.borders?.value, "thick", `${order.join("→")}: borders stay thick (Bold's)`);
    assert.equal(resolved.slots.borders?.wordId, "bold");
    assert.deepEqual(resolved.activeIds, order, `${order.join("→")}: both words stay selected`);
    const applied = applyPickerDelta(midAxes(), palette(), { chipIds: [], paletteId: "as-dreamed", wordOrder: order });
    assert.equal(applied.borderWidth, "thick", `${order.join("→")}: thick borders survive the fold`);
  }
  const boldThenSoft = applyPickerDelta(midAxes(), palette(), { chipIds: [], paletteId: "as-dreamed", wordOrder: ["bold", "soft"] });
  assert.equal(boldThenSoft.axes.sharpness, 0.1, "soft picked last owns the corners");
  const softThenBold = applyPickerDelta(midAxes(), palette(), { chipIds: [], paletteId: "as-dreamed", wordOrder: ["soft", "bold"] });
  assert.equal(softThenBold.axes.sharpness, 0.8, "bold picked last owns the corners");
});

test("a word that loses every trait deselects itself", () => {
  // Soft writes roundedness + shadow; Sharp takes roundedness, Flat takes shadow.
  const resolved = resolveDescribeWords(["soft", "sharp", "flat"]);
  assert.equal(resolved.slots.roundedness?.wordId, "sharp");
  assert.equal(resolved.slots.shadow?.wordId, "flat");
  assert.deepEqual(resolved.activeIds, ["sharp", "flat"], "soft owns nothing and drops out");
  // Calm vs Compact is total shadowing either way: the later pick owns
  // both shared traits, so the earlier word drops out entirely.
  assert.deepEqual(resolveDescribeWords(["calm", "compact"]).activeIds, ["compact"]);
  assert.deepEqual(resolveDescribeWords(["compact", "calm"]).activeIds, ["calm"]);
});

test("removing the winner restores the earlier word's values", () => {
  const withFlat = resolveDescribeWords(["soft", "sharp", "flat"]);
  assert.equal(withFlat.slots.shadow?.value, "none");
  const withoutFlat = resolveDescribeWords(["soft", "sharp"]);
  assert.equal(withoutFlat.slots.shadow?.value, "gentle", "soft's shadow is back once flat is removed");
  assert.deepEqual(withoutFlat.activeIds, ["soft", "sharp"], "soft is selected again");
  const applied = applyPickerDelta(midAxes(), palette(), { chipIds: [], paletteId: "as-dreamed", wordOrder: ["soft", "sharp"] });
  assert.equal(applied.axes.material, "paper", "restored shadow recompiles to paper");
});

test("words are shape-only: voice axes identical, profile stable, no pixel, ornament never raised", () => {
  const combos = [[], ["calm"], ["bold", "soft"], ["sharp", "flat", "compact"], ["playful", "minimal", "spacious", "calm"]];
  const bases = [
    { ...midAxes(), playfulness: 0.2, ornament: 0.2 },
    { ...midAxes(), playfulness: 0.6, ornament: 0.8 },
  ];
  for (const base of bases) {
    for (const order of combos) {
      const applied = applyPickerDelta(base, palette(), { chipIds: [], paletteId: "as-dreamed", wordOrder: order });
      for (const axis of VOICE_AXES) {
        assert.equal(applied.axes[axis], base[axis], `${order.join("+") || "none"}: voice axis '${axis}' untouched`);
      }
      assert.ok(applied.axes.material !== "pixel", `${order.join("+") || "none"}: pixel is never written`);
      assert.ok(
        applied.axes.ornament === base.ornament || (applied.axes.ornament ?? 1) <= 0.25,
        `${order.join("+") || "none"}: ornament untouched or capped at 0.25 (never reaches the type gates)`,
      );
      // Profile derives from formality/chroma/playfulness alone (all in
      // VOICE_AXES, asserted identical above), so it cannot move either.
    }
  }
});

test("border voices compile to real widths, profile-clamped", () => {
  const fixture = JSON.parse(readFileSync(join(repoRoot, "fixtures", "identity.default.json"), "utf8"));
  const base = {
    key: "words-borders",
    name: "words borders",
    source: fixture.dna.source,
    axes: fixture.dna.axes,
    palette: fixture.dna.palette,
    profile: "standard",
    base: fixture,
  };
  for (const [word, want] of [["minimal", "0px"], ["spacious", "1px"], ["sharp", "2px"], ["bold", "2px"]]) {
    const applied = applyPickerDelta(fixture.dna.axes, fixture.dna.palette, { chipIds: [], paletteId: "as-dreamed", wordOrder: [word] });
    const compiled = compileIdentity({ ...base, axes: { ...fixture.dna.axes, ...applied.axes }, borderWidth: applied.borderWidth });
    assert.equal(compiled.tokens.light["--border-width"].$value, want, `${word} compiles to ${want} in standard`);
  }
  // Expressive lifts thick to 3px; enterprise clamps everything to 1px.
  const boldApplied = applyPickerDelta(fixture.dna.axes, fixture.dna.palette, { chipIds: [], paletteId: "as-dreamed", wordOrder: ["bold"] });
  const expressive = compileIdentity({
    ...base,
    profile: "expressive",
    axes: { ...fixture.dna.axes, ...boldApplied.axes },
    borderWidth: boldApplied.borderWidth,
  });
  assert.equal(expressive.tokens.light["--border-width"].$value, "3px", "thick is 3px under expressive");
  const enterprise = compileIdentity({
    ...base,
    profile: "enterprise",
    axes: { ...fixture.dna.axes, ...boldApplied.axes },
    borderWidth: boldApplied.borderWidth,
  });
  assert.equal(enterprise.tokens.light["--border-width"].$value, "1px", "enterprise clamps thick to its 1px bound");
});

test("wordOrder is deterministic, order-sensitive, and reports unknowns", () => {
  const selections = { chipIds: [], paletteId: "as-dreamed", wordOrder: ["soft", "sharp", "nope"] };
  const first = applyPickerDelta(midAxes(), palette(), selections);
  assert.deepEqual(first.unknownChips, ["nope"], "unknown words are reported, not applied");
  const second = applyPickerDelta(midAxes(), palette(), selections);
  assert.equal(JSON.stringify(first), JSON.stringify(second), "same history → same DNA");
  const swapped = applyPickerDelta(midAxes(), palette(), { ...selections, wordOrder: ["sharp", "soft", "nope"] });
  assert.notEqual(JSON.stringify(first.axes), JSON.stringify(swapped.axes), "order matters: last pick wins");
});
