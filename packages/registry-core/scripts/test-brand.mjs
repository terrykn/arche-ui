/* global console, process */
/**
 * Acceptance battery for the Brand Token brief (Brand ≠ Primary).
 *
 * Deterministic: no model calls. The model is replaced by hand-authored DNA
 * (Verizon-style, light-brand, default-brand, monochrome-brief palettes);
 * the code path under test is schema default → compile → validate.
 *
 * Covers: DNA brandHue default + delta schema, --brand token family with
 * the absolute AA gate (light brand → dark text included), 4-anchor
 * monochrome, hue-family snap + zero-subsumption for brand, hero brandCta
 * affinity, the brand-usage-scope static check, and the no-brand-variant
 * list for functional components.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync, readFileSync } from "node:fs";
import { contrastRatio } from "@arche/foundation/contract/validate-tokens";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const {
  modelOutputSchema,
  modelDeltaOutputSchema,
  withBrandDefault,
  resolveBrandHue,
  validateIdentity,
  rankedVariants,
  checkDesignRules,
} = require("./dist/index.js");
const { compileValidIdentity, isMonochromeDna } = require("./dist/compiler.js");

const base = JSON.parse(readFileSync(join(root, "..", "..", "fixtures", "identity.default.json"), "utf8"));
const GUARD = { minContrast: "AA", respectReducedMotion: true };

const AXES = {
  warmth: 0.5, chroma: 0.8, energy: 0.7, playfulness: 0.4, sharpness: 0.5,
  density: 0.5, ornament: 0.3, formality: 0.3,
  material: "flat", motionFeel: "smooth", texture: "none",
  ...GUARD,
};

const OKLCH_RE = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/;
function oklch(value) {
  const m = String(value).match(OKLCH_RE);
  assert.ok(m, `expected oklch, got ${value}`);
  return { l: Number(m[1]), c: Number(m[2]), h: Number(m[3]) };
}
function hueDist(a, b) {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return Math.min(d, 360 - d);
}
function ratio(light, fg, bg) {
  return contrastRatio(String(light[fg].$value), String(light[bg].$value));
}

const compile = (name, palette, axes = AXES, constraints) =>
  compileValidIdentity(
    {
      name,
      source: { type: "phrase", promptText: name },
      axes: { ...axes },
      palette,
      base,
      ...(constraints ? { constraints } : {}),
    },
    validateIdentity,
  );

// ---------------------------------------------------------------------------
// 1. DNA: brandHue is optional on input, defaulted by code, allowed in deltas
// ---------------------------------------------------------------------------

test("brandHue is optional on input and defaults to the primary hue", () => {
  const { palette, defaulted } = withBrandDefault({ primaryHue: 220, accentHue: 20, neutralHue: 220 });
  assert.equal(defaulted, true);
  assert.equal(palette.brandHue, 220);
  assert.equal(resolveBrandHue({ primaryHue: 220, accentHue: 20, neutralHue: 220 }), 220);
  assert.equal(resolveBrandHue({ primaryHue: 220, accentHue: 20, neutralHue: 220, brandHue: 5 }), 5);
  const kept = withBrandDefault({ primaryHue: 220, accentHue: 20, neutralHue: 220, brandHue: 5 });
  assert.equal(kept.defaulted, false);
});

test("response + delta schemas accept the brand anchor", () => {
  const full = {
    axes: AXES,
    palette: { primaryHue: 220, accentHue: 20, neutralHue: 220, brandHue: 5 },
    palettes: [0, 1, 2].map((i) => ({
      id: `p${i}`, name: `P${i}`,
      anchors: { primaryHue: 220, accentHue: 20, neutralHue: 220, brandHue: 5 },
      reason: "r",
    })),
    typefaces: [0, 1, 2].map((i) => ({
      id: `t${i}`, name: `T${i}`, display: "satoshi", body: "satoshi", reason: "r",
    })),
  };
  assert.ok(modelOutputSchema.safeParse(full).success, "brandHue accepted everywhere");
  const legacy = { ...full, palette: { primaryHue: 220, accentHue: 20, neutralHue: 220 } };
  assert.ok(modelOutputSchema.safeParse(legacy).success, "missing brandHue still validates (code defaults it)");
  assert.ok(
    modelDeltaOutputSchema.safeParse({ delta: { palette: { brandHue: 10 } } }).success,
    "prompt edits may retarget the brand hue alone",
  );
});

// ---------------------------------------------------------------------------
// 2. Verizon-style: loud brand, usable primary, AA in both modes
// ---------------------------------------------------------------------------

test("verizon-style DNA: red brand, black-ink primary, both roles readable", async () => {
  const verizon = await compile("t-brand-verizon", {
    primaryHue: 250, accentHue: 250, neutralHue: 250, brandHue: 5,
  });
  const brand = oklch(verizon.tokens.light["--brand"].$value);
  assert.ok(hueDist(brand.h, 5) <= 2, `brand hue stays loud and exact (got ${brand.h})`);
  const primary = oklch(verizon.tokens.light["--primary"].$value);
  assert.ok(hueDist(primary.h, brand.h) > 30, "primary and brand are visibly different roles");
  assert.equal(verizon.dna.palette.brandHue, 5, "compiled DNA always carries the brand anchor");
  assert.equal(verizon.meta.brand.hue, 5);
  assert.equal(verizon.meta.brand.heroCta, "brand", "hue gap > 30° prefers the brand CTA");
  for (const mode of ["light", "dark"]) {
    const set = verizon.tokens[mode];
    assert.ok(ratio(set, "--brand-foreground", "--brand") >= 4.5, `${mode}: brand solid text passes AA`);
  }
});

test("light brand takes dark text in light mode, chosen per mode", async () => {
  const lemon = await compile("t-brand-lemon", {
    primaryHue: 220, accentHue: 20, neutralHue: 220, brandHue: 100,
  });
  for (const mode of ["light", "dark"]) {
    const set = lemon.tokens[mode];
    assert.ok(ratio(set, "--brand-foreground", "--brand") >= 4.5, `${mode}: yellow brand text passes AA`);
  }
  const fgLight = oklch(lemon.tokens.light["--brand-foreground"].$value);
  assert.ok(fgLight.l < 0.5, `light-mode text on a yellow solid is dark (L ${fgLight.l})`);
  // The solid is identical in both modes here, so both modes may agree —
  // the point is each mode's choice is derived and recorded separately.
  assert.equal(lemon.meta.brand.foreground.light, String(lemon.tokens.light["--brand-foreground"].$value));
  assert.equal(lemon.meta.brand.foreground.dark, String(lemon.tokens.dark["--brand-foreground"].$value));
});

test("missing brandHue compiles to the primary family, never to a surprise", async () => {
  const plain = await compile("t-brand-default", { primaryHue: 220, accentHue: 20, neutralHue: 220 });
  assert.equal(plain.dna.palette.brandHue, 220, "compiled DNA backfills the default");
  for (const mode of ["light", "dark"]) {
    const b = oklch(plain.tokens[mode]["--brand"].$value);
    const p = oklch(plain.tokens[mode]["--primary"].$value);
    assert.ok(hueDist(b.h, p.h) <= 1, `${mode}: default brand hue equals the primary hue`);
    assert.ok(ratio(plain.tokens[mode], "--brand-foreground", "--brand") >= 4.5, `${mode}: gated pair passes`);
  }
  assert.equal(plain.meta.brand.heroCta, "primary", "coincident hues keep the primary CTA");
});

test("brand survives a hue sweep: every family passes the AA gate", async () => {
  for (const hue of [0, 25, 55, 120, 180, 250, 300, 340]) {
    const compiled = await compile(`t-brand-sweep-${hue}`, {
      primaryHue: (hue + 140) % 360, accentHue: (hue + 200) % 360, neutralHue: 220, brandHue: hue,
    });
    for (const mode of ["light", "dark"]) {
      const set = compiled.tokens[mode];
      assert.ok(ratio(set, "--brand-foreground", "--brand") >= 4.5, `hue ${hue} ${mode}: solid pair passes`);
    }
  }
});

// ---------------------------------------------------------------------------
// 3. Constraint-aware: monochrome zeroes brand, hue families snap it
// ---------------------------------------------------------------------------

test("monochrome brief: brand chroma is exactly zero, never pink", async () => {
  const mono = await compile(
    "t-brand-mono",
    { primaryHue: 220, accentHue: 222, neutralHue: 221, brandHue: 0 },
    { ...AXES, chroma: 0.8 },
    { chromaCap: 0.02, hueSpreadMax: 10 },
  );
  for (const mode of ["light", "dark"]) {
    for (const token of ["--brand", "--brand-foreground"]) {
      assert.equal(oklch(mono.tokens[mode][token].$value).c, 0, `${mode}.${token} is achromatic`);
    }
  }
});

test("monochrome spread covers all four anchors", () => {
  const tight = { primaryHue: 220, accentHue: 222, neutralHue: 221, brandHue: 224 };
  assert.equal(isMonochromeDna({ chroma: 0.05 }, tight), true, "four tight anchors are monochrome");
  const loudBrand = { ...tight, brandHue: 40 };
  assert.equal(isMonochromeDna({ chroma: 0.05 }, loudBrand), false, "a loud brand breaks monochrome");
});

test("hue-family constraint snaps the brand family with the rest", async () => {
  const snapped = await compile(
    "t-brand-snap",
    { primaryHue: 250, accentHue: 250, neutralHue: 250, brandHue: 250 },
    AXES,
    { hueFamily: 20 },
  );
  for (const mode of ["light", "dark"]) {
    const b = oklch(snapped.tokens[mode]["--brand"].$value);
    assert.ok(b.c < 0.015 || hueDist(b.h, 20) <= 30, `${mode}: brand snapped toward the family`);
  }
});

// ---------------------------------------------------------------------------
// 4. Hero brandCta affinity (>30° prefers the brand CTA)
// ---------------------------------------------------------------------------

test("hero selector prefers the brand CTA only for a distinct brand hue", () => {
  const source = {
    name: "hero",
    axes: {
      alignment: { values: ["center", "left"], default: "center" },
      mediaLayout: { values: ["none", "right", "below"], default: "none" },
      ctaVariant: { values: ["primary", "brand"], default: "primary" },
    },
  };
  const ctx = { genre: "landing", content: {} };
  const plain = rankedVariants("hero", source, ctx);
  assert.equal(plain[0].axes.ctaVariant, "primary", "no signal keeps the primary CTA");
  const branded = rankedVariants("hero", source, { ...ctx, brandCta: true });
  assert.equal(branded[0].axes.ctaVariant, "brand", "distinct brand hue prefers the brand CTA");
  assert.ok(branded[0].reason.includes("brand CTA"), "the reason names the brand choice");
});

// ---------------------------------------------------------------------------
// 5. brand-usage-scope: static check over templates, blocks, manifests
// ---------------------------------------------------------------------------

test("brand tokens appear only in the whitelisted brand moments", () => {
  const foundation = join(root, "..", "foundation", "src");
  const whitelisted = new Set(["button.tsx", "badge.tsx", "card.tsx", "hero.tsx", "cta.tsx", "pricing.tsx"]);
  const offenders = [];
  for (const dir of ["templates", "blocks"]) {
    for (const file of readdirSync(join(foundation, dir))) {
      if (!file.endsWith(".tsx")) continue;
      const src = readFileSync(join(foundation, dir, file), "utf8");
      if (src.includes("--brand") && !whitelisted.has(file)) offenders.push(`${dir}/${file}`);
    }
  }
  assert.deepEqual(offenders, [], "no template or block outside the brand moments spends --brand");
  const manifestOffenders = [];
  for (const dir of ["manifests", "blocks"]) {
    for (const file of readdirSync(join(foundation, dir))) {
      if (!file.endsWith(".json")) continue;
      const raw = readFileSync(join(foundation, dir, file), "utf8");
      if (raw.includes("--brand") && !whitelisted.has(file.replace(".manifest.json", ".tsx").replace(".block.json", ".tsx"))) {
        manifestOffenders.push(`${dir}/${file}`);
      }
    }
  }
  assert.deepEqual(manifestOffenders, [], "no manifest outside the brand moments declares brand tokens");
});

test("functional components have no brand variant", () => {
  const noBrand = [
    "input", "textarea", "select", "checkbox", "radio-group", "switch", "slider",
    "table", "form", "tabs", "navigation-menu", "menubar", "dialog", "toast",
    "tooltip", "popover", "scroll-area", "separator", "progress", "toggle", "toolbar",
  ];
  const foundation = join(root, "..", "foundation", "src");
  for (const name of noBrand) {
    const manifestPath = join(foundation, "manifests", `${name}.manifest.json`);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const variants = manifest.axes?.variant?.values ?? [];
    assert.ok(!variants.includes("brand"), `${name} manifest has no brand variant`);
    assert.ok(
      !(manifest.styleSurface && JSON.stringify(manifest.styleSurface).includes('"brand"')),
      `${name} styleSurface has no brand value`,
    );
    const templateFiles = readdirSync(join(foundation, "templates")).filter((f) => f.startsWith(name));
    for (const file of templateFiles) {
      const src = readFileSync(join(foundation, "templates", file), "utf8");
      assert.ok(!src.includes("--brand"), `${file} spends no brand token`);
    }
  }
  // The brand moments do declare it (the allowlist is real, not vacuous).
  for (const name of ["button", "badge"]) {
    const manifest = JSON.parse(readFileSync(join(foundation, "manifests", `${name}.manifest.json`), "utf8"));
    assert.ok(manifest.axes.variant.values.includes("brand"), `${name} manifest declares the brand variant`);
  }
  const card = JSON.parse(readFileSync(join(foundation, "manifests", "card.manifest.json"), "utf8"));
  assert.ok(card.axes.variant.values.includes("brand"), "card manifest declares the brand variant");
});

// ---------------------------------------------------------------------------
// 6. No regressions: brand tokens satisfy every enforce-tier rule + contract
// ---------------------------------------------------------------------------

test("brand payloads are enforce-tier clean and contract-valid", async () => {
  const compiled = await compile("t-brand-clean", {
    primaryHue: 250, accentHue: 20, neutralHue: 250, brandHue: 5,
  });
  assert.deepEqual(checkDesignRules(compiled), [], "no enforce-tier findings on a brand payload");
  const validation = validateIdentity(compiled);
  assert.ok(validation.ok, `contract holds: ${JSON.stringify(validation.issues.slice(0, 2))}`);
});
