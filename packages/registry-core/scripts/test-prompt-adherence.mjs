/* global console, process */
/**
 * Acceptance tests for the prompt-adherence layer
 * (words → numeric constraints → deterministic enforcement → verifier).
 *
 * Deterministic: no model calls. The model is replaced by hand-authored DNA
 * (canonical rows + deliberately wrong DNA); the code path under test is
 * parse → enforce (inside compile) → verify.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const {
  parseConstraints,
  describeConstraints,
  constraintSlots,
  retrieveExemplars,
  loadCorpus,
  verifyAdherence,
  derivePaletteOptions,
  deriveProfile,
  validateIdentity,
  keywordTableVersion,
} = require("./dist/index.js");
const { compileValidIdentity, compileIdentity } = require("./dist/compiler.js");
const { readFileSync } = require("node:fs");

const base = JSON.parse(readFileSync(join(root, "..", "..", "fixtures", "identity.default.json"), "utf8"));
const GUARD = { minContrast: "AA", respectReducedMotion: true };

const OKLCH_RE = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/;
function oklch(value) {
  const m = String(value).match(OKLCH_RE);
  assert.ok(m, `expected oklch, got ${value}`);
  return { l: Number(m[1]), c: Number(m[2]), h: Number(m[3]) };
}
function allChromas(compiled) {
  const out = [];
  for (const mode of ["light", "dark"]) {
    for (const token of Object.values(compiled.tokens[mode] ?? {})) {
      if (token && typeof token.$value === "string" && token.$value.startsWith("oklch(")) {
        out.push(oklch(token.$value).c);
      }
    }
  }
  return out;
}
function maxChroma(compiled) {
  return Math.max(0, ...allChromas(compiled));
}
function meanChromatic(compiled) {
  const cs = allChromas(compiled).filter((c) => c >= 0.015);
  if (cs.length === 0) return 0;
  return cs.reduce((a, b) => a + b, 0) / cs.length;
}
function hueDistance(a, b) {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return Math.min(d, 360 - d);
}
function adjustmentsOf(compiled) {
  return compiled.meta.adjustments ?? [];
}

const compile = (name, axes, palette, profile, constraints) =>
  compileValidIdentity(
    {
      name,
      source: { type: "phrase", promptText: name },
      axes: { ...axes, ...GUARD },
      palette,
      profile,
      base,
      constraints,
    },
    validateIdentity,
  );

// ---------------------------------------------------------------------------
// Part 1 — parser
// ---------------------------------------------------------------------------

test("parser: monochrome keywords yield cap 0.02 + spread 10", () => {
  const c = parseConstraints("A quiet gallery, paper-white ground, muted and monochromatic overall");
  assert.equal(c.chromaCap, 0.02);
  assert.equal(c.hueSpreadMax, 10);
});

test("parser: vivid keywords yield an accent floor", () => {
  const c = parseConstraints("a loud electric neon arcade, saturated and bold");
  assert.equal(c.chromaFloorAccent, 0.15);
});

test("parser: named hues resolve (red / teal) and warmth hints feed slots", () => {
  const red = parseConstraints("a red brand landing page");
  assert.equal(red.hueFamily, 5);
  const teal = parseConstraints("deep teal console");
  assert.equal(teal.hueFamily, 180);
  const warm = parseConstraints("warm cozy bakery");
  assert.equal(warm.warmth, 0.85);
  const cool = parseConstraints("cool clinical console");
  assert.equal(cool.warmth, 0.15);
});

test("parser: empty brief → empty constraints (downstream behaves as today)", () => {
  assert.deepEqual(parseConstraints(""), {});
  assert.deepEqual(parseConstraints("a booking app"), {});
  assert.equal(describeConstraints({}), "free brief");
});

test("parser: deterministic + keyword table is a versioned data file", () => {
  const a = parseConstraints("Quiet MONOCHROME gallery, Paper-White ground");
  const b = parseConstraints("quiet monochrome gallery, paper-white ground");
  assert.deepEqual(a, b);
  assert.ok(keywordTableVersion() >= 1, "keyword table carries a version");
  assert.ok(describeConstraints(a).includes("monochromatic"));
  assert.ok(constraintSlots(a).length >= 2, "slots show in the picker step 1");
});

test("retrieval: nearest 1–3 exemplars, tag overlap only, threshold empties", () => {
  const corpus = loadCorpus();
  assert.ok(corpus.length >= 15, `corpus covers the prompt space (got ${corpus.length})`);
  const mono = parseConstraints("quiet monochromatic gallery, paper-white");
  const picks = retrieveExemplars(mono, corpus);
  assert.ok(picks.length >= 1 && picks.length <= 3, `1–3 exemplars (got ${picks.length})`);
  assert.ok(picks[0].tags.chromaBand === "muted", "monochrome retrieves muted entries");
  const none = retrieveExemplars({ hueFamily: 999 }, [{ id: "x", tags: {} }], undefined, 999);
  assert.deepEqual(none, [], "below threshold → generate without exemplars");
});

// ---------------------------------------------------------------------------
// Acceptance 1 — the failing prompt, fixed
// ---------------------------------------------------------------------------

const GALLERY_PROMPT =
  "A quiet gallery for a design-engineering tool: paper-white ground, hairline borders, near-neutral grays, high contrast. Muted and monochromatic overall.";

test("acceptance 1: gallery brief compiles to max chroma ≤ 0.02 + spread ≤ 10°", async () => {
  const constraints = parseConstraints(GALLERY_PROMPT);
  assert.equal(constraints.chromaCap, 0.02);
  // The reported failure mode: the model returns pink under a monochrome
  // brief. Enforcement must clamp it in code (and log the action).
  const axes = {
    warmth: 0.4, chroma: 0.5, energy: 0.2, playfulness: 0.4, sharpness: 0.3,
    density: 0.2, ornament: 0.2, formality: 0.8,
    material: "paper", motionFeel: "snappy", texture: "none",
  };
  const palette = { primaryHue: 340, accentHue: 340, neutralHue: 340 };
  const compiled = await compile("t-gallery-adherence", axes, palette, deriveProfile(axes), constraints);
  assert.ok(maxChroma(compiled) <= 0.02, `max chroma ≤ 0.02 (got ${maxChroma(compiled)})`);
  const report = verifyAdherence(compiled, constraints);
  assert.ok(report.pass, `verifier passes: ${report.failures.join("; ")}`);
  const rules = adjustmentsOf(compiled).map((a) => a.ruleId);
  assert.ok(rules.includes("prompt-monochrome-chroma-cap"), "enforcement is logged with a prompt-* rule id");
});

test("acceptance 1: three picker options are visibly distinct (mini component, not swatch)", async () => {
  const constraints = parseConstraints(GALLERY_PROMPT);
  assert.ok(constraints.chromaCap === 0.02);
  const palette = { primaryHue: 40, accentHue: 45, neutralHue: 42 };
  const options = derivePaletteOptions(palette, "enterprise");
  assert.equal(options.length, 3);
  // Anchors differ by construction: Loud rotates the accent, Quiet retints neutrals.
  const keys = options.map((o) => `${o.anchors.primaryHue}/${o.anchors.accentHue}/${o.anchors.neutralHue}`);
  assert.equal(new Set(keys).size, 3, "three anchor triples differ");
  // What the preview actually paints (button + card + text): accent fill and
  // surface fill differ across options — a primary-only swatch could never do this.
  const fills = options.map((o) => ({
    primary: `oklch(0.55 0.16 ${o.anchors.primaryHue})`,
    accent: `oklch(0.62 0.16 ${o.anchors.accentHue})`,
    surface: `oklch(0.95 0.02 ${o.anchors.neutralHue})`,
  }));
  const accentFills = new Set(fills.map((f) => f.accent));
  const surfaceFills = new Set(fills.map((f) => f.surface));
  assert.ok(
    accentFills.size >= 2 || surfaceFills.size >= 2,
    "mini-component fills differ across options",
  );
});

// ---------------------------------------------------------------------------
// Acceptance 3 — guarantee by construction (wrong DNA still complies)
// ---------------------------------------------------------------------------

test("acceptance 3: chroma-0.9 / spread-150° DNA under a monochrome constraint still compiles ≤ 0.02", async () => {
  const constraints = parseConstraints("monochromatic gallery, paper-white, quiet, muted");
  const badAxes = {
    warmth: 0.5, chroma: 0.9, energy: 1.0, playfulness: 0.9, sharpness: 0.8,
    density: 0.8, ornament: 0.9, formality: 0.0,
    material: "pixel", motionFeel: "glitchy", texture: "scanlines",
  };
  const badPalette = { primaryHue: 0, accentHue: 150, neutralHue: 250 };
  assert.ok(hueDistance(0, 150) >= 90, "test DNA really is spread");
  const compiled = await compile("t-hostile-dna", badAxes, badPalette, "expressive", constraints);
  assert.ok(maxChroma(compiled) <= 0.02, `model cannot override the constraint (got ${maxChroma(compiled)})`);
  for (const mode of ["light", "dark"]) {
    for (const [name, token] of Object.entries(compiled.tokens[mode])) {
      if (token && typeof token.$value === "string" && token.$value.startsWith("oklch(")) {
        assert.equal(oklch(token.$value).c, 0, `${mode}.${name} is exactly C=0`);
      }
    }
  }
  const report = verifyAdherence(compiled, constraints);
  assert.ok(report.pass, `verifier passes on hostile DNA: ${report.failures.join("; ")}`);
});

// ---------------------------------------------------------------------------
// Acceptance 2 — eval set over the corpus
// ---------------------------------------------------------------------------

test("acceptance 2: every corpus archetype passes (chroma / hue / contrast rules)", async () => {
  const corpus = loadCorpus();
  const byArchetype = new Map();
  for (const entry of corpus) {
    const constraints = parseConstraints(entry.prompt);
    const profile = deriveProfile(entry.axes);
    const compiled = await compile(
      `t-eval-${entry.id}`,
      entry.axes,
      entry.palette,
      profile,
      constraints,
    );
    const report = verifyAdherence(compiled, constraints);
    const notes = [];
    if (entry.tags.chromaBand === "muted" && entry.prompt.includes("monochromatic")) {
      const mean = meanChromatic(compiled);
      notes.push(`mean-chromatic ${mean}`);
      assert.ok(mean < 0.03, `${entry.id}: monochromatic mean chromatic ${mean} < 0.03`);
    }
    if (entry.tags.chromaBand === "vivid") {
      // The primary solid carries the full voice (step 5/8 of the scale);
      // the accent lives on a tint step by design, so the voice is read
      // off the primary — same convention as the Brief #8 fintech test.
      const primary = oklch(compiled.tokens.light["--primary"].$value).c;
      notes.push(`primary ${primary}`);
      assert.ok(primary > 0.15, `${entry.id}: vivid primary chroma ${primary} > 0.15`);
    }
    assert.ok(report.pass, `${entry.id} verifies: ${report.failures.join("; ")} (${notes.join(", ")})`);
    // AA on every text pair is re-checked by the compiler gate; the verifier
    // re-measures it on final tokens.
    assert.ok(report.metrics.minContrast >= 4.5, `${entry.id}: min contrast ${report.metrics.minContrast} ≥ 4.5`);
    const list = byArchetype.get(entry.tags.archetype) ?? { pass: 0, total: 0 };
    list.total++;
    list.pass++;
    byArchetype.set(entry.tags.archetype, list);
  }
  assert.ok(byArchetype.size >= 10, `every archetype covered (got ${byArchetype.size})`);
});

test("accent floor: quiet DNA under a vivid brief is raised to the floor in code", async () => {
  const constraints = parseConstraints("a loud saturated launch page");
  assert.equal(constraints.chromaFloorAccent, 0.15);
  const axes = {
    warmth: 0.5, chroma: 0.2, energy: 0.3, playfulness: 0.2, sharpness: 0.5,
    density: 0.5, ornament: 0.3, formality: 0.3,
    material: "flat", motionFeel: "smooth", texture: "none",
  };
  const palette = { primaryHue: 200, accentHue: 200, neutralHue: 220 };
  const compiled = await compile("t-accent-floor", axes, palette, deriveProfile(axes), constraints);
  const primary = oklch(compiled.tokens.light["--primary"].$value).c;
  const accent = oklch(compiled.tokens.light["--accent"].$value).c;
  assert.ok(primary >= 0.15, `primary raised to the floor (got ${primary})`);
  assert.ok(accent >= 0.15, `accent raised to the floor (got ${accent})`);
  const rules = adjustmentsOf(compiled).map((a) => a.ruleId);
  assert.ok(rules.includes("prompt-accent-floor"), "floor enforcement is logged");
  const report = verifyAdherence(compiled, constraints);
  assert.ok(report.pass, `verifier passes: ${report.failures.join("; ")}`);
});

test("acceptance 2: red vs blue brands separate ≥ 60° with ΔE ≥ 15", async () => {
  const axes = {
    warmth: 0.5, chroma: 0.8, energy: 0.6, playfulness: 0.3, sharpness: 0.5,
    density: 0.5, ornament: 0.3, formality: 0.3,
    material: "flat", motionFeel: "smooth", texture: "none",
  };
  const redC = parseConstraints("a red brand landing page");
  const blueC = parseConstraints("a blue brand landing page");
  assert.equal(redC.hueFamily, 5);
  assert.equal(blueC.hueFamily, 240);
  const red = await compile("t-red-adherence", axes, { primaryHue: 5, accentHue: 220, neutralHue: 30 }, "standard", redC);
  const blue = await compile("t-blue-adherence", axes, { primaryHue: 240, accentHue: 20, neutralHue: 230 }, "standard", blueC);
  const redH = oklch(red.tokens.light["--primary"].$value).h;
  const blueH = oklch(blue.tokens.light["--primary"].$value).h;
  assert.ok(hueDistance(redH, blueH) >= 60, `primaries separate ≥ 60° (got ${hueDistance(redH, blueH)}°)`);
  const toLab = ({ l, c, h }) => {
    const rad = (h * Math.PI) / 180;
    return [l, c * Math.cos(rad), c * Math.sin(rad)];
  };
  const [l1, a1, b1] = toLab(oklch(red.tokens.light["--primary"].$value));
  const [l2, a2, b2] = toLab(oklch(blue.tokens.light["--primary"].$value));
  const dE = 100 * Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
  assert.ok(dE >= 15, `ΔE ≥ 15 (got ${dE.toFixed(1)})`);
});

// ---------------------------------------------------------------------------
// Determinism + logging contract
// ---------------------------------------------------------------------------

test("determinism preserved: same DNA + compilerVersion → byte-identical payload", async () => {
  const constraints = parseConstraints(GALLERY_PROMPT);
  const axes = {
    warmth: 0.4, chroma: 0.08, energy: 0.2, playfulness: 0.4, sharpness: 0.3,
    density: 0.2, ornament: 0.2, formality: 0.8,
    material: "paper", motionFeel: "snappy", texture: "none",
  };
  const palette = { primaryHue: 40, accentHue: 45, neutralHue: 42 };
  const first = await compile("t-determinism-adherence", axes, palette, "enterprise", constraints);
  const second = compileIdentity({
    name: "t-determinism-adherence",
    source: { type: "phrase", promptText: "t-determinism-adherence" },
    axes: { ...axes, ...GUARD },
    palette,
    profile: "enterprise",
    base,
    constraints,
  });
  assert.equal(JSON.stringify(second), JSON.stringify(first), "recompile is byte-identical");
});
