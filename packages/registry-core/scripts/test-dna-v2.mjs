/* global console, process */
/**
 * Golden tests for Brief #8 (DNA v2 — one DNA, one compiler).
 *
 * Deterministic: hand-authored DNA rows inside the brief's expected ranges
 * (the prompt→DNA mapping is the model's job, guided by the word→number
 * mappings; the DNA→payload mapping is pinned here). No network calls.
 *
 * Rows (§8): gallery / arcade / hospital / fintech-dashboard / bakery.
 * Plus: red-vs-blue separation, monochrome, true-zero/full-ladder,
 * determinism (incl. variants), and the three-hero variant test.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const {
  deriveProfile,
  validateIdentity,
  rankedVariants,
} = require("./dist/index.js");
const { compileValidIdentity, compileIdentity, isMonochromeDna } = require("./dist/compiler.js");
const { readFileSync } = require("node:fs");

const base = JSON.parse(readFileSync(join(root, "..", "..", "fixtures", "identity.arche.json"), "utf8"));
const GUARD = { minContrast: "AA", respectReducedMotion: true };

const compile = (name, axes, palette, profile) =>
  compileValidIdentity(
    { name, source: { type: "phrase", promptText: name }, axes: { ...axes, ...GUARD }, palette, profile, base },
    validateIdentity,
  );

const OKLCH_RE = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/;
function oklch(value) {
  const m = String(value).match(OKLCH_RE);
  assert.ok(m, `expected oklch, got ${value}`);
  return { l: Number(m[1]), c: Number(m[2]), h: Number(m[3]) };
}
function maxChroma(compiled) {
  let max = 0;
  for (const mode of ["light", "dark"]) {
    for (const token of Object.values(compiled.tokens[mode] ?? {})) {
      if (token && typeof token.$value === "string" && token.$value.startsWith("oklch(")) {
        max = Math.max(max, oklch(token.$value).c);
      }
    }
  }
  return max;
}
function hueDistance(a, b) {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return Math.min(d, 360 - d);
}
/** Approximate ΔE (0-100 scale) between two parsed oklch colors. */
function deltaE(a, b) {
  const toLab = ({ l, c, h }) => {
    const rad = (h * Math.PI) / 180;
    return [l, c * Math.cos(rad), c * Math.sin(rad)];
  };
  const [l1, a1, b1] = toLab(a);
  const [l2, a2, b2] = toLab(b);
  return 100 * Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
}

// ---------------------------------------------------------------------------
// Canonical DNA rows (each inside its §8 expected range)
// ---------------------------------------------------------------------------

const GALLERY_AXES = {
  warmth: 0.4, chroma: 0.08, energy: 0.2, playfulness: 0.4, sharpness: 0.3,
  density: 0.2, ornament: 0.2, formality: 0.8,
  material: "paper", motionFeel: "snappy", texture: "none",
};
const GALLERY_PALETTE = { primaryHue: 40, accentHue: 45, neutralHue: 42 };

const ARCADE_AXES = {
  warmth: 0.5, chroma: 0.9, energy: 1.0, playfulness: 0.9, sharpness: 0.8,
  density: 0.8, ornament: 0.5, formality: 0.0,
  material: "pixel", motionFeel: "glitchy", texture: "scanlines",
};
const ARCADE_PALETTE = { primaryHue: 320, accentHue: 180, neutralHue: 260 };

const HOSPITAL_AXES = {
  warmth: 0.3, chroma: 0.15, energy: 0.3, playfulness: 0.05, sharpness: 0.6,
  density: 0.45, ornament: 0.15, formality: 0.9,
  material: "flat", motionFeel: "stately", texture: "none",
};
const HOSPITAL_PALETTE = { primaryHue: 210, accentHue: 210, neutralHue: 220 };

const FINTECH_AXES = {
  warmth: 0.3, chroma: 0.85, energy: 0.9, playfulness: 0.3, sharpness: 0.7,
  density: 0.5, ornament: 0.3, formality: 0.7,
  material: "metal", motionFeel: "snappy", texture: "grid",
};
const FINTECH_PALETTE = { primaryHue: 225, accentHue: 200, neutralHue: 230 };

const BAKERY_AXES = {
  warmth: 0.8, chroma: 0.55, energy: 0.5, playfulness: 0.6, sharpness: 0.2,
  density: 0.4, ornament: 0.4, formality: 0.4,
  material: "clay", motionFeel: "smooth", texture: "grain",
};
const BAKERY_PALETTE = { primaryHue: 35, accentHue: 150, neutralHue: 50 };

test("profile is derived from DNA, never chosen", () => {
  assert.equal(deriveProfile({ formality: 0.8, chroma: 0.2, playfulness: 0.1 }), "enterprise");
  assert.equal(deriveProfile({ formality: 0.9, chroma: 0.85, playfulness: 0.1 }), "expressive");
  assert.equal(deriveProfile({ formality: 0.2, chroma: 0.3, playfulness: 0.8 }), "expressive");
  assert.equal(deriveProfile({ formality: 0.4, chroma: 0.5, playfulness: 0.4 }), "standard");
  assert.equal(deriveProfile(GALLERY_AXES), "enterprise");
  assert.equal(deriveProfile(ARCADE_AXES), "expressive");
});

test("gallery: monochrome compiles to near-zero chroma everywhere", async () => {
  assert.ok(isMonochromeDna(GALLERY_AXES, GALLERY_PALETTE), "gallery DNA is the monochrome state");
  const compiled = await compile("t-gallery", GALLERY_AXES, GALLERY_PALETTE, deriveProfile(GALLERY_AXES));
  assert.ok(maxChroma(compiled) <= 0.02, `monochrome max chroma across all roles <= 0.02 (got ${maxChroma(compiled)})`);
  const radius = Number(String(compiled.tokens.light["--radius"].$value).replace("rem", ""));
  assert.ok(radius >= 0.3, `radius soft (got ${radius}rem)`);
  assert.equal(compiled.components.button?.size, "sm", "airy density maps the size knob");
  assert.equal(compiled.dna.profile, "enterprise");
});

test("arcade: pixel hardware, loud solids, scanlines, retro face", async () => {
  const compiled = await compile("t-arcade", ARCADE_AXES, ARCADE_PALETTE, deriveProfile(ARCADE_AXES));
  const primary = oklch(compiled.tokens.light["--primary"].$value);
  assert.ok(primary.c >= 0.15, `primary solid carries the voice (got C=${primary.c})`);
  assert.equal(compiled.tokens.light["--border-width"].$value, "3px", "sharp pixel expressive DNA maps to 3px");
  assert.ok(String(compiled.tokens.light["--shadow-sm"].$value).startsWith("2px 2px 0 0"), "pixel hard-edge shadows");
  assert.equal(compiled.fonts.display, "clash-display", "pixel direction display face");
  assert.equal(compiled.dna.axes.texture, "scanlines");
  assert.equal(compiled.dna.profile, "expressive");
});

test("hospital: trust hero, enterprise accent discipline", async () => {
  const profile = deriveProfile(HOSPITAL_AXES);
  assert.equal(profile, "enterprise");
  const compiled = await compile("t-hospital", HOSPITAL_AXES, HOSPITAL_PALETTE, profile);
  const hero = rankedVariants(
    "hero",
    { name: "hero", axes: { alignment: { values: ["center", "left"], default: "center" }, mediaLayout: { values: ["none", "right", "below"], default: "none" } } },
    {
      genre: "landing",
      content: { category: "healthcare", audience: "general", media: "product", tone: [] },
      dna: { formality: 0.9, energy: 0.3, chroma: 0.15, playfulness: 0.05 },
    },
  )[0];
  assert.deepEqual(hero.axes, { alignment: "left", mediaLayout: "right" }, `trust hero selected (${hero.reason})`);
  const primary = oklch(compiled.tokens.light["--primary"].$value);
  const accent = oklch(compiled.tokens.light["--accent"].$value);
  assert.ok(hueDistance(primary.h, accent.h) <= 25, "enterprise accent stays in the primary family");
});

test("fintech dashboard: expressive solids, sharp borders, swiss discipline", async () => {
  const profile = deriveProfile(FINTECH_AXES);
  assert.equal(profile, "expressive");
  const compiled = await compile("t-fintech", FINTECH_AXES, FINTECH_PALETTE, profile);
  const primary = oklch(compiled.tokens.light["--primary"].$value);
  assert.ok(primary.c >= 0.15 && primary.c <= 0.26, `solids vivid within the band (got C=${primary.c})`);
  const radius = Number(String(compiled.tokens.light["--radius"].$value).replace("rem", ""));
  assert.ok(radius <= 0.5, `borders sharp (got ${radius}rem)`);
  const direction = compiled.meta.taste.artDirection;
  assert.equal(direction.id, "swiss-poster", `formal sharp DNA takes the swiss direction (${direction.id})`);
});

test("bakery: warm neutrals, friendly face, pill radius", async () => {
  assert.equal(deriveProfile(BAKERY_AXES), "standard");
  const compiled = await compile("t-bakery", BAKERY_AXES, BAKERY_PALETTE, "standard");
  const muted = oklch(compiled.tokens.light["--muted"].$value);
  assert.ok(muted.h >= 40 && muted.h <= 75, `neutrals lean warm gray (got h=${muted.h})`);
  assert.equal(compiled.fonts.display, "sentient", "warm voice takes the friendly serif");
  const radius = Number(String(compiled.tokens.light["--radius"].$value).replace("rem", ""));
  assert.ok(radius >= 0.5, `pill radius (got ${radius}rem)`);
});

test("prompt-to-prompt color: red vs blue separates", async () => {
  const axes = {
    warmth: 0.5, chroma: 0.8, energy: 0.6, playfulness: 0.3, sharpness: 0.5,
    density: 0.5, ornament: 0.3, formality: 0.3,
    material: "flat", motionFeel: "smooth", texture: "none",
  };
  const red = await compile("t-red", axes, { primaryHue: 5, accentHue: 5, neutralHue: 40 }, "standard");
  const blue = await compile("t-blue", axes, { primaryHue: 225, accentHue: 225, neutralHue: 230 }, "standard");
  const redH = oklch(red.tokens.light["--primary"].$value).h;
  const blueH = oklch(blue.tokens.light["--primary"].$value).h;
  assert.ok(hueDistance(redH, blueH) >= 60, `primary hues separate >= 60° (got ${hueDistance(redH, blueH)}°)`);
  const separation = deltaE(
    oklch(red.tokens.light["--primary"].$value),
    oklch(blue.tokens.light["--primary"].$value),
  );
  assert.ok(separation >= 15, `primary solids ΔE >= 15 (got ${separation.toFixed(1)})`);
});

test("chroma 0 is exactly grayscale; chroma 1 is the full ladder", async () => {
  const axes = {
    warmth: 0.5, energy: 0.6, playfulness: 0.3, sharpness: 0.5,
    density: 0.5, ornament: 0.3, formality: 0.3,
    material: "flat", motionFeel: "smooth", texture: "none",
  };
  const palette = { primaryHue: 20, accentHue: 200, neutralHue: 40 };
  const zero = await compile("t-zero", { ...axes, chroma: 0 }, palette, "standard");
  for (const mode of ["light", "dark"]) {
    for (const [name, token] of Object.entries(zero.tokens[mode])) {
      if (token && typeof token.$value === "string" && token.$value.startsWith("oklch(")) {
        assert.equal(oklch(token.$value).c, 0, `${mode}.${name} is exactly C=0 at chroma 0`);
      }
    }
  }
  const full = await compile("t-full", { ...axes, chroma: 1 }, palette, "standard");
  const primary = oklch(full.tokens.light["--primary"].$value);
  assert.ok(primary.c > 0.2, `chroma 1 renders the full ladder (got C=${primary.c})`);
});

test("same DNA recompiles byte-identical, including variant selections", async () => {
  const first = await compile("t-determinism", GALLERY_AXES, GALLERY_PALETTE, "enterprise");
  const second = compileIdentity({
    name: "t-determinism",
    source: { type: "phrase", promptText: "t-determinism" },
    axes: { ...GALLERY_AXES, ...GUARD },
    palette: GALLERY_PALETTE,
    profile: "enterprise",
    base,
  });
  assert.equal(JSON.stringify(first), JSON.stringify(second), "recompile is byte-identical");
  const context = {
    genre: "landing",
    content: { category: "photography", audience: "general", media: "image", tone: [] },
    dna: { formality: 0.8, energy: 0.2, chroma: 0.08, playfulness: 0.4 },
  };
  const a = rankedVariants("hero", { name: "hero", axes: { alignment: { values: ["center", "left"], default: "center" }, mediaLayout: { values: ["none", "right", "below"], default: "none" } } }, context);
  const b = rankedVariants("hero", { name: "hero", axes: { alignment: { values: ["center", "left"], default: "center" }, mediaLayout: { values: ["none", "right", "below"], default: "none" } } }, context);
  assert.deepEqual(a, b, "variant ranking is deterministic");
});

test("one hero block, three DNAs, three different variants", () => {
  const heroAxes = { alignment: { values: ["center", "left"], default: "center" }, mediaLayout: { values: ["none", "right", "below"], default: "none" } };
  const portfolio = rankedVariants("hero", { name: "hero", axes: heroAxes }, {
    genre: "landing",
    content: { category: "photography", audience: "general", media: "image", tone: [] },
    dna: { formality: 0.8, energy: 0.2, chroma: 0.08, playfulness: 0.4 },
  })[0];
  const hospital = rankedVariants("hero", { name: "hero", axes: heroAxes }, {
    genre: "landing",
    content: { category: "healthcare", audience: "general", media: "product", tone: [] },
    dna: { formality: 0.9, energy: 0.3, chroma: 0.15, playfulness: 0.05 },
  })[0];
  const restaurant = rankedVariants("hero", { name: "hero", axes: heroAxes }, {
    genre: "landing",
    content: { category: "restaurant", audience: "general", media: "image", tone: [] },
    dna: { formality: 0.3, energy: 0.5, chroma: 0.5, playfulness: 0.5, warmth: 0.8 },
  })[0];
  assert.deepEqual(portfolio.axes, { alignment: "left", mediaLayout: "below" }, `portfolio → quiet editorial (${portfolio.reason})`);
  assert.deepEqual(hospital.axes, { alignment: "left", mediaLayout: "right" }, `hospital → trust (${hospital.reason})`);
  assert.deepEqual(restaurant.axes, { alignment: "center", mediaLayout: "below" }, `restaurant → warm photographic (${restaurant.reason})`);
  for (const selection of [portfolio, hospital, restaurant]) {
    assert.ok(selection.reason.includes("dnaDistance"), "selection records its DNA distance");
    assert.ok(selection.reason.includes("decidingAxis"), "selection records its deciding axis");
    assert.ok(selection.reason.includes("genre"), "selection records its genre");
  }
});
