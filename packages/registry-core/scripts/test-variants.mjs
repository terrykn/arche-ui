/* global console, process */
/**
 * Acceptance tests for the AI-proposed picker variants (one prompt returns
 * one DNA + 3 palette variants + 3 typography variants).
 *
 * Deterministic: no model calls. The model is replaced by hand-authored
 * variant arrays (valid, invalid, hostile); the code path under test is
 * schema → normalize (code-side fallbacks) → compile with the selection.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const {
  modelOutputSchema,
  normalizePaletteVariants,
  normalizeTypefaceVariants,
  typefaceSpec,
  deriveProfile,
  validateIdentity,
} = require("./dist/index.js");
const { compileValidIdentity, compileIdentity, deriveTypePick } = require("./dist/compiler.js");
const { readFileSync } = require("node:fs");

const base = JSON.parse(readFileSync(join(root, "..", "..", "fixtures", "identity.default.json"), "utf8"));
const GUARD = { minContrast: "AA", respectReducedMotion: true };

const AXES = {
  warmth: 0.5, chroma: 0.5, energy: 0.5, playfulness: 0.3, sharpness: 0.5,
  density: 0.5, ornament: 0.2, formality: 0.3,
  material: "flat", motionFeel: "smooth", texture: "none",
  ...GUARD,
};
const PALETTE = { primaryHue: 220, accentHue: 20, neutralHue: 220 };

const compile = (name, axes, palette, profile, extra = {}) =>
  compileValidIdentity(
    {
      name,
      source: { type: "phrase", promptText: name },
      axes: { ...axes },
      palette,
      profile,
      base,
      ...extra,
    },
    validateIdentity,
  );

// Brand Token brief: model variants always carry the brand anchor (the
// provider schema requires it); code backfills it when absent.
const goodPalettes = [
  { id: "quiet-harbor", name: "Quiet Harbor", anchors: { primaryHue: 220, accentHue: 220, neutralHue: 220, brandHue: 220 }, reason: "One calm family." },
  { id: "signal-buoy", name: "Signal Buoy", anchors: { primaryHue: 220, accentHue: 20, neutralHue: 220, brandHue: 5 }, reason: "Warm accent on cool ground." },
  { id: "deep-channel", name: "Deep Channel", anchors: { primaryHue: 240, accentHue: 160, neutralHue: 240, brandHue: 240 }, reason: "A bolder sibling." },
];

const goodTypefaces = [
  { id: "harbor-grotesk", name: "Harbor Grotesk", display: "clash-display", body: "general-sans", reason: "Expressive header, neutral body." },
  { id: "ledger-serif", name: "Ledger Serif", display: "zodiak", body: "switzer", reason: "Formal serif voice." },
  { id: "warm-humanist", name: "Warm Humanist", display: "sentient", body: "cabinet-grotesk", reason: "Warm editorial pair." },
];

test("response schema: DNA + exactly 3 palette + 3 typography variants", () => {
  const ok = modelOutputSchema.safeParse({ axes: AXES, palette: PALETTE, palettes: goodPalettes, typefaces: goodTypefaces });
  assert.ok(ok.success, "full variant response validates");
  const missing = modelOutputSchema.safeParse({ axes: AXES, palette: PALETTE });
  assert.ok(!missing.success, "variants are required, not optional");
  const short = modelOutputSchema.safeParse({
    axes: AXES, palette: PALETTE, palettes: goodPalettes.slice(0, 2), typefaces: goodTypefaces,
  });
  assert.ok(!short.success, "two palettes fail the length-3 contract");
});

test("palette variants: valid triple passes through untouched", () => {
  const out = normalizePaletteVariants(goodPalettes, PALETTE, "standard");
  assert.deepEqual(out, goodPalettes);
});

test("palette variants: bad hues and duplicate ids fall back deterministically", () => {
  const raw = [
    goodPalettes[0],
    { id: "broken", name: "Broken", anchors: { primaryHue: 999, accentHue: 20, neutralHue: 220 }, reason: "Out of range." },
    { id: "quiet-harbor", name: "Copycat", anchors: { ...PALETTE }, reason: "Duplicate id." },
  ];
  const out = normalizePaletteVariants(raw, PALETTE, "standard");
  assert.equal(out.length, 3);
  assert.deepEqual(out[0], goodPalettes[0]);
  assert.notEqual(out[1].id, "broken");
  assert.ok(out[1].anchors.primaryHue >= 0 && out[1].anchors.primaryHue <= 360);
  assert.equal(new Set(out.map((o) => o.id)).size, 3, "ids unique after fallback");
  const again = normalizePaletteVariants(raw, PALETTE, "standard");
  assert.deepEqual(out, again);
});

test("palette variants: non-array input yields the deterministic derivation", () => {
  const out = normalizePaletteVariants(undefined, PALETTE, "standard");
  assert.equal(out.length, 3);
  assert.equal(out[0].id, "as-dreamed");
  assert.deepEqual(out[0].anchors, { ...PALETTE, brandHue: PALETTE.primaryHue });
});

test("typography variants: valid triple leads, three registered pairs follow", () => {
  const pick = deriveTypePick(AXES, "standard");
  const out = normalizeTypefaceVariants(goodTypefaces, pick);
  assert.equal(out.length, 6);
  assert.deepEqual(out.slice(0, 3), goodTypefaces);
  assert.equal(new Set(out.map((o) => o.id)).size, 6, "six unique ids");
  const pairings = new Set(out.map((o) => `${o.display}+${o.body}`));
  assert.equal(pairings.size, 6, "six distinct pairings — no two choices look alike");
});

test("typography variants: unknown fonts and bad pairings fall back, never throw", () => {
  const pick = deriveTypePick(AXES, "standard");
  const raw = [
    goodTypefaces[0],
    { id: "mystery", name: "Mystery", display: "not-a-font", body: "general-sans", reason: "Unknown id." },
    // Two distinct neutral grotesques: an explicitly incompatible pairing.
    { id: "clash", name: "Clash", display: "satoshi", body: "switzer", reason: "Incompatible pair." },
  ];
  const out = normalizeTypefaceVariants(raw, pick);
  assert.equal(out.length, 6);
  assert.deepEqual(out[0], goodTypefaces[0]);
  assert.notEqual(out[1].display, "not-a-font");
  assert.notDeepEqual([out[2].display, out[2].body], ["satoshi", "switzer"]);
  assert.equal(new Set(out.map((o) => o.id)).size, 6, "ids unique after fallback");
  const pairings = new Set(out.map((o) => `${o.display}+${o.body}`));
  assert.equal(pairings.size, 6, "six distinct pairings — no two choices look alike");
  const again = normalizeTypefaceVariants(raw, pick);
  assert.deepEqual(out, again);
});

test("typography variants: first fallback is the compiler's own pick", () => {
  const pick = deriveTypePick(AXES, "standard");
  const out = normalizeTypefaceVariants([], pick);
  assert.equal(out.length, 6);
  assert.equal(out[0].display, pick.display);
  assert.equal(out[0].body, pick.sans);
});

test("compiler: typeface selection overrides the DNA-derived pick, stacks mirror", async () => {
  const compiled = await compile("t-variant-type", AXES, PALETTE, "standard", {
    typeface: { display: "zodiak", sans: "switzer" },
  });
  assert.equal(compiled.fonts.display, "zodiak");
  assert.equal(compiled.fonts.sans, "switzer");
  assert.equal(compiled.fonts.mono, "geist-mono", "mono stays derived");
  assert.ok(
    String(compiled.tokens.light["--font-display"].$value).startsWith("Zodiak,"),
    "display token mirrors the selected family",
  );
  assert.ok(
    String(compiled.tokens.light["--font-sans"].$value).startsWith("Switzer,"),
    "sans token mirrors the selected family",
  );
});

test("compiler: invalid typeface overrides throw before any payload", async () => {
  await assert.rejects(
    () => compile("t-variant-badfont", AXES, PALETTE, "standard", { typeface: { display: "nope", sans: "switzer" } }),
    /not in the closed font registry/,
  );
  await assert.rejects(
    // clash-display is display-only: it must never fill the body slot.
    () => compile("t-variant-bodyslot", AXES, PALETTE, "standard", { typeface: { display: "zodiak", sans: "clash-display" } }),
    /display-only/,
  );
  await assert.rejects(
    // Distinct neutral grotesques are an incompatible pairing.
    () => compile("t-variant-pair", AXES, PALETTE, "standard", { typeface: { display: "satoshi", sans: "switzer" } }),
    /compatible pair|must not be paired|incompatible/i,
  );
});

test("typeface specimens resolve to renderable stacks and stylesheets", () => {
  const spec = typefaceSpec("clash-display", "general-sans");
  assert.ok(spec, "recommended pair resolves");
  assert.ok(spec.display.stack.includes("Clash Display"), `display stack names the family: ${spec.display.stack}`);
  assert.ok(spec.body.stack.includes("General Sans"), `body stack names the family: ${spec.body.stack}`);
  assert.equal(typeof spec.display.cssUrl, "string", "fontshare display face has a stylesheet");
  assert.equal(typefaceSpec("nope", "general-sans"), null, "unknown ids resolve to null");
});

test("variants: end to end — chosen palette anchors + typeface reach the payload", async () => {
  const profile = deriveProfile(AXES);
  const palettes = normalizePaletteVariants(goodPalettes, PALETTE, profile);
  const pick = deriveTypePick(AXES, profile);
  const faces = normalizeTypefaceVariants(goodTypefaces, pick);
  const chosen = palettes[1];
  const chosenFace = faces[0];
  const compiled = await compile("t-variant-e2e", AXES, chosen.anchors, profile, {
    typeface: { display: chosenFace.display, sans: chosenFace.body },
  });
  assert.deepEqual(compiled.dna.palette, chosen.anchors, "chosen anchors are the compiled palette");
  assert.equal(compiled.fonts.display, chosenFace.display);
  assert.equal(compiled.fonts.sans, chosenFace.body);
});
