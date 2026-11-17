/**
 * Tests for the Brief #7 invisible blocks layer (selector + genres):
 * - every genre blueprint references real blocks; required ⊆ sequence;
 *   required ∩ forbidden = ∅; sequence ∩ forbidden = ∅;
 * - selectVariants covers all 20 blocks with manifest-valid axis values;
 * - determinism: same input → byte-identical output;
 * - context sensitivity: media/formality/audience change the hero pick;
 * - nextVariantAxes always returns a different combo when one exists and
 *   wraps around the full ranking.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const {
  GENRE_BLUEPRINTS,
  NEUTRAL_CONTEXT,
  getBlockManifests,
  nextVariantAxes,
  rankedVariants,
  selectVariants,
} = require("./dist/index.js");

const manifests = getBlockManifests();
const byName = new Map(manifests.map((m) => [m.name, m]));

function axesOf(name) {
  return byName.get(name).axes ?? {};
}

test("catalog holds 20 blocks; genres reference only real blocks", () => {
  assert.equal(manifests.length, 20);
  const names = new Set(manifests.map((m) => m.name));
  for (const blueprint of Object.values(GENRE_BLUEPRINTS)) {
    for (const list of [blueprint.sequence, blueprint.required, blueprint.optional, blueprint.forbidden]) {
      for (const name of list) {
        assert.ok(names.has(name), `${blueprint.id}: unknown block '${name}'`);
      }
    }
  }
});

test("genre sets are consistent (required ⊆ sequence, forbidden disjoint)", () => {
  for (const blueprint of Object.values(GENRE_BLUEPRINTS)) {
    const sequence = new Set(blueprint.sequence);
    const forbidden = new Set(blueprint.forbidden);
    for (const name of [...blueprint.required, ...blueprint.optional]) {
      assert.ok(sequence.has(name), `${blueprint.id}: '${name}' not in sequence`);
      assert.ok(!forbidden.has(name), `${blueprint.id}: '${name}' both listed and forbidden`);
    }
    for (const name of blueprint.sequence) {
      assert.ok(!forbidden.has(name), `${blueprint.id}: sequence block '${name}' is forbidden`);
    }
    assert.ok(blueprint.sequence.length > 0, `${blueprint.id}: empty sequence`);
    assert.ok(blueprint.contentRules.length > 0, `${blueprint.id}: no content rules`);
  }
});

test("selectVariants covers all 20 blocks with manifest-valid axes", () => {
  const selections = selectVariants(manifests, NEUTRAL_CONTEXT);
  assert.equal(selections.length, 20);
  for (const selection of selections) {
    const axes = axesOf(selection.block);
    for (const [key, value] of Object.entries(selection.axes)) {
      assert.ok(key in axes, `${selection.block}: unknown axis '${key}'`);
      assert.ok(
        axes[key].values.map(String).includes(value),
        `${selection.block}: axis '${key}' value '${value}' not in manifest`,
      );
    }
    assert.ok(selection.reason.length > 0, `${selection.block}: empty reason`);
    if (Object.keys(axes).length === 0) {
      assert.deepEqual(selection.axes, {});
    }
  }
});

test("selector is deterministic", () => {
  const context = {
    genre: "landing",
    content: { category: "construction", audience: "general", media: "image", tone: ["bold"] },
    dna: { formality: 0.4, energy: 0.8, playfulness: 0.7, density: 0.5 },
    artDirection: "glassmorphism",
  };
  const first = selectVariants(manifests, context);
  const second = selectVariants(manifests, context);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
});

test("context changes the hero pick (media + formality)", () => {
  const plain = selectVariants(manifests, NEUTRAL_CONTEXT).find((s) => s.block === "hero");
  assert.deepEqual(plain.axes, { alignment: "center", mediaLayout: "none", ctaVariant: "primary" });
  const construction = selectVariants(manifests, {
    genre: "landing",
    content: { category: "construction", audience: "general", media: "image", tone: [] },
  }).find((s) => s.block === "hero");
  assert.equal(construction.axes.mediaLayout, "below");
  assert.equal(construction.axes.alignment, "left");
  const enterprise = selectVariants(manifests, {
    genre: "landing",
    content: { category: "saas", audience: "executive", media: "none", tone: [] },
    dna: { formality: 0.9 },
    artDirection: "boardroom-red",
  }).find((s) => s.block === "hero");
  assert.equal(enterprise.axes.alignment, "left");
});

test("cta mirrors the hero alignment", () => {
  const selections = new Map(
    selectVariants(manifests, {
      genre: "product",
      content: { category: "devtools", audience: "technical", media: "product", tone: [] },
    }).map((s) => [s.block, s]),
  );
  assert.equal(selections.get("cta").axes.alignment, selections.get("hero").axes.alignment);
});

test("nextVariantAxes cycles a different combo and wraps", () => {
  const heroAxes = axesOf("hero");
  const context = NEUTRAL_CONTEXT;
  const ranked = rankedVariants("hero", { name: "hero", axes: heroAxes }, context);
  assert.ok(ranked.length > 1, "hero should rank multiple combos");
  let current = ranked[0].axes;
  const seen = new Set([JSON.stringify(current)]);
  for (let i = 0; i < ranked.length; i++) {
    current = nextVariantAxes("hero", current, { name: "hero", axes: heroAxes }, context);
    seen.add(JSON.stringify(current));
  }
  assert.deepEqual(current, ranked[0].axes, "full cycle returns to the top-ranked variant");
  assert.equal(seen.size, ranked.length, "cycle visits every ranked combo");
  const heroSource = { name: "hero", axes: axesOf("hero") };
  const firstSwap = nextVariantAxes("hero", {}, heroSource, context);
  assert.deepEqual(firstSwap, rankedVariants("hero", heroSource, context)[1].axes);
  assert.notDeepEqual(firstSwap, { alignment: "center", mediaLayout: "none" });
  const pricingSource = { name: "pricing", axes: axesOf("pricing") };
  assert.notDeepEqual(nextVariantAxes("pricing", {}, pricingSource, context), { tierCount: "three" });
  const single = rankedVariants("empty-state", { name: "empty-state", axes: axesOf("empty-state") }, context);
  assert.equal(single.length, 1);
  assert.deepEqual(nextVariantAxes("empty-state", {}, { name: "empty-state", axes: axesOf("empty-state") }, context), {});
});

test("new marketing blocks rank both combos and cycle", () => {
  for (const block of ["logo-cloud", "stats-band", "faq", "newsletter-signup", "site-footer", "auth-login", "auth-signup"]) {
    const source = { name: block, axes: axesOf(block) };
    const ranked = rankedVariants(block, source, NEUTRAL_CONTEXT);
    assert.equal(ranked.length, 2, `${block} ranks two combos`);
    const swapped = nextVariantAxes(block, {}, source, NEUTRAL_CONTEXT);
    assert.notDeepEqual(swapped, ranked[0].axes, `${block} first swap is visible`);
    assert.deepEqual(nextVariantAxes(block, swapped, source, NEUTRAL_CONTEXT), ranked[0].axes, `${block} cycle wraps`);
  }
});

test("newsletter-signup follows the hero alignment", () => {
  const technical = new Map(
    selectVariants(manifests, {
      genre: "product",
      content: { category: "devtools", audience: "technical", media: "product", tone: [] },
    }).map((s) => [s.block, s]),
  );
  assert.equal(technical.get("hero").axes.alignment, "left");
  assert.equal(technical.get("newsletter-signup").axes.layout, "split");
  const plain = selectVariants(manifests, NEUTRAL_CONTEXT).find((s) => s.block === "newsletter-signup");
  assert.deepEqual(plain.axes, { layout: "centered" });
});

test("auth splits for an expressive voice, stays centered otherwise", () => {
  const expressive = selectVariants(manifests, {
    genre: "auth",
    content: { category: "gaming", audience: "general", media: "none", tone: ["bold"] },
    dna: { formality: 0.2, energy: 0.8, playfulness: 0.9, density: 0.5 },
    artDirection: "crt-hardware",
  });
  for (const block of ["auth-login", "auth-signup"]) {
    assert.deepEqual(
      expressive.find((s) => s.block === block).axes,
      { layout: "split" },
      `${block} splits for expressive`,
    );
  }
  const plain = new Map(selectVariants(manifests, NEUTRAL_CONTEXT).map((s) => [s.block, s]));
  assert.deepEqual(plain.get("auth-login").axes, { layout: "centered" });
  assert.deepEqual(plain.get("faq").axes, { layout: "single" });
  assert.deepEqual(plain.get("site-footer").axes, { layout: "extended" });
});

test("stats-band narrows for a focused brief", () => {
  const focused = selectVariants(manifests, {
    genre: "landing",
    content: { category: "saas", audience: "executive", media: "none", tone: ["minimal"] },
  }).find((s) => s.block === "stats-band");
  assert.deepEqual(focused.axes, { columns: "two" });
});
