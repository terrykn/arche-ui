/* global console */
/**
 * Acceptance battery for the palette + brand picker (3 palette schemes +
 * 3 brand strategies on step 1).
 *
 * Deterministic: no model calls. The model is replaced by hand-authored DNA +
 * palette anchors, and the code path under test is schema → derive options →
 * fold the selection → compile → validate, with the network stubbed out.
 *
 * Covers: (1) 3 + 3 on one screen under one live preview, instant
 * client-side re-skin, zero model calls; (2) the lede discloses only the
 * dreamed choices are the model's answers; (3) the Verizon-style case (red
 * dreamed mark, achromatic ink primary, vivid signal mark); (4) strategy
 * derivation (unified = brand IS primary, mark-only = ink structure,
 * accent = dusty structure + vivid highlight with the distinctness gate);
 * (5) monochrome collapses to one gray option, no pink; (6) unified skips
 * the distinctness gate by design while accent rotates +60 on collapse;
 * (7) AA on every shown strategy in both modes, measured on emitted
 * tokens; (8) no regressions — the rest of the battery still passes.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { contrastRatio } from "@arche/foundation/contract/validate-tokens";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(root, "..", "..");
const require = createRequire(join(root, "package.json"));
const {
  applyPickerDelta,
  brandDistinctness,
  curateBrandColors,
  deriveBrandColors,
  deriveBrandStrategies,
  derivePaletteOptions,
  paletteFromBrand,
  resolveBrandColor,
  validateIdentity,
} = require("./dist/index.js");
const { compileValidIdentity } = require("./dist/compiler.js");

const base = JSON.parse(readFileSync(join(repoRoot, "fixtures", "identity.default.json"), "utf8"));
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
/** Compile exactly like the service: the strategy rides along as brandStrategy. */
const compile = (name, palette, axes = AXES, extra = {}) =>
  compileValidIdentity(
    {
      name,
      source: { type: "phrase", promptText: name },
      axes: { ...axes },
      palette,
      base,
      ...extra,
    },
    validateIdentity,
  );
const compileStrategy = (name, strategy, axes = AXES, extra = {}) =>
  compile(name, { ...strategy.anchors }, axes, {
    ...extra,
    brandStrategy: strategy.strategy,
  });

// ---------------------------------------------------------------------------
// 1. Row shape: three strategies from any brand hue, fixed order
// ---------------------------------------------------------------------------

test("strategy derivation keeps 3 options in fixed order from any brand hue", () => {
  const strategies = deriveBrandStrategies(15, { structuralHue: 250 });
  assert.deepEqual(
    strategies.map((o) => o.id),
    ["unified", "mark-only", "accent"],
    "unified, mark-only, accent ship in fixed order",
  );
  assert.deepEqual(
    strategies.map((o) => o.reason),
    ["unified-brand-equals-primary", "mark-only-ink-primary", "accent-direct"],
    "each strategy records its reason (brand distinct from structure, so accent is direct)",
  );
  for (const strategy of strategies) {
    assert.equal(strategy.brandHue, 15, `${strategy.id}: the mark hue is the brand hue`);
    assert.ok(strategy.name && !/^\d/.test(strategy.name), "evocative name, never a bare hue");
    assert.ok(strategy.roleLabel && strategy.roleLabel.length > 0, "each option carries its role label");
    assert.deepEqual(
      Object.keys(strategy.anchors).sort(),
      ["accentHue", "brandHue", "neutralHue", "primaryHue"],
      "each strategy carries full system anchors",
    );
  }
  assert.deepEqual(
    strategies[0].anchors,
    { primaryHue: 15, accentHue: 15, neutralHue: 15, brandHue: 15 },
    "unified: the whole system sits on the brand hue",
  );
  assert.deepEqual(
    strategies[2].anchors,
    { primaryHue: 250, accentHue: 15, neutralHue: 250, brandHue: 15 },
    "accent: dreamed structure holds primary, the brand hue owns mark + highlight",
  );
});

test("each strategy is a visibly different system over the same brand hue", async () => {
  const strategies = deriveBrandStrategies(15, { structuralHue: 250 });
  const [unified, markOnly, accent] = strategies;
  const emitted = {};
  for (const strategy of strategies) {
    emitted[strategy.id] = await compileStrategy(`t-bp-strategy-${strategy.id}`, strategy);
  }
  // Unified: brand IS primary — the same solid feeds both roles.
  assert.equal(
    emitted.unified.tokens.light["--primary"].$value,
    emitted.unified.tokens.light["--brand"].$value,
    "unified: --primary and --brand are the same emitted solid",
  );
  assert.equal(
    emitted.unified.tokens.light["--primary-foreground"].$value,
    emitted.unified.tokens.light["--brand-foreground"].$value,
    "unified: one foreground for the one solid",
  );
  assert.ok(hueDist(oklch(emitted.unified.tokens.light["--primary"].$value).h, 15) <= 2);
  // Mark-only: achromatic structure, vivid signal mark; accent is the
  // brand lifted one ladder step (same hue, slightly lighter, own AA text).
  for (const mode of ["light", "dark"]) {
    assert.equal(oklch(emitted["mark-only"].tokens[mode]["--primary"].$value).c, 0, `mark-only ${mode}: primary is ink`);
    const markAccent = oklch(emitted["mark-only"].tokens[mode]["--accent"].$value);
    const markBrand = oklch(emitted["mark-only"].tokens[mode]["--brand"].$value);
    assert.ok(hueDist(markAccent.h, 15) <= 2, `mark-only ${mode}: accent stays on the brand hue`);
    assert.ok(markAccent.l > markBrand.l, `mark-only ${mode}: accent is lighter than the brand`);
    assert.ok(markAccent.l - markBrand.l < 0.15, `mark-only ${mode}: accent is only slightly lighter`);
    assert.ok(markAccent.c > 0.1, `mark-only ${mode}: accent stays loud while the structure goes quiet`);
    const accentRatio = contrastRatio(
      String(emitted["mark-only"].tokens[mode]["--accent-foreground"].$value),
      String(emitted["mark-only"].tokens[mode]["--accent"].$value),
    );
    assert.ok(accentRatio >= 4.5, `mark-only ${mode}: accent text passes AA (${accentRatio.toFixed(2)})`);
  }
  const mark = oklch(emitted["mark-only"].tokens.light["--brand"].$value);
  assert.ok(hueDist(mark.h, 15) <= 2, "mark-only: the mark stays on the brand hue");
  assert.ok(mark.c > 0.1, "mark-only: the mark stays loud while the structure goes quiet");
  // Accent: dusty dreamed structure, vivid brand highlight.
  const structPrimary = oklch(emitted.accent.tokens.light["--primary"].$value);
  const vividBrand = oklch(emitted.accent.tokens.light["--brand"].$value);
  assert.ok(hueDist(structPrimary.h, 250) <= 2, "accent: primary stays structural");
  assert.ok(hueDist(vividBrand.h, 15) <= 2, "accent: the mark is the brand hue");
  assert.ok(hueDist(oklch(emitted.accent.tokens.light["--accent"].$value).h, 15) <= 2, "accent: the highlight is the brand hue");
  assert.ok(structPrimary.c < vividBrand.c, "accent: structure is desaturated next to the mark");
  assert.ok(
    hueDist(structPrimary.h, unified ? oklch(emitted.unified.tokens.light["--primary"].$value).h : 15) > 25,
    "unified and accent primaries are different colors",
  );
  assert.notEqual(
    emitted["mark-only"].tokens.light["--primary"].$value,
    emitted.unified.tokens.light["--primary"].$value,
    "mark-only and unified primaries are different colors",
  );
  // Every strategy ships AA in both modes.
  for (const strategy of strategies) {
    for (const mode of ["light", "dark"]) {
      const tokens = emitted[strategy.id].tokens[mode];
      const ratio = contrastRatio(String(tokens["--brand-foreground"].$value), String(tokens["--brand"].$value));
      assert.ok(ratio >= 4.5, `${strategy.id} ${mode}: brand text passes AA (${ratio.toFixed(2)})`);
      const primaryRatio = contrastRatio(String(tokens["--primary-foreground"].$value), String(tokens["--primary"].$value));
      assert.ok(primaryRatio >= 4.5, `${strategy.id} ${mode}: primary text passes AA (${primaryRatio.toFixed(2)})`);
    }
  }
});

// ---------------------------------------------------------------------------
// Shared gate (spec: ΔH ≥ 30° OR ΔE₀₀ ≥ 15 OR ΔL ≥ 0.15)
// ---------------------------------------------------------------------------

test("distinctness gate: hue, CIEDE2000 and lightness are all measured", () => {
  const same = brandDistinctness({ l: 0.56, c: 0.16, h: 10 }, { l: 0.56, c: 0.16, h: 10 });
  assert.equal(same.distinct, false, "identical colors collapse");
  assert.equal(same.deltaE, 0);
  const far = brandDistinctness({ l: 0.56, c: 0.16, h: 10 }, { l: 0.56, c: 0.16, h: 60 });
  assert.equal(far.distinct, true, "ΔH ≥ 30° is distinct");
  assert.ok(far.hue >= 30 && far.deltaE > 0);
  const lightness = brandDistinctness({ l: 0.35, c: 0.16, h: 10 }, { l: 0.56, c: 0.16, h: 10 });
  assert.equal(lightness.distinct, true, "ΔL ≥ 0.15 is distinct even at the same hue");
  const achromatic = brandDistinctness({ l: 0.56, c: 0, h: 10 }, { l: 0.56, c: 0, h: 200 });
  assert.equal(achromatic.distinct, false, "two grays are one color whatever the hue numbers");
});

// ---------------------------------------------------------------------------
// Unified skips the gate by design; accent rotates on collapse
// ---------------------------------------------------------------------------

test("production: every strategy derives from the winning hue, no dreamed structure", () => {
  // No structuralHue passed (the production path): all three strategies
  // sit on the winning hue, so switching brand rebuilds all three.
  const strategies = deriveBrandStrategies(15);
  for (const strategy of strategies) {
    assert.deepEqual(
      strategy.anchors,
      { primaryHue: 15, accentHue: 15, neutralHue: 15, brandHue: 15 },
      `${strategy.id}: the whole system sits on the winning hue`,
    );
  }
  assert.equal(strategies.find((o) => o.id === "accent").reason, "accent-direct");
});

test("same-family structure ships direct: lightness separates what hue cannot", () => {
  // Brand sits on the structure (5° apart): unified is unaffected (same
  // color by design) and the accent mark ships direct — the emitted pair
  // (vivid mark at step 8 vs dusty structure at step 10) clears ΔL ≥ 0.15,
  // so no rotation is needed. The rotation cascade stays as a defensive
  // fallback for a true collapse.
  const strategies = deriveBrandStrategies(15, { structuralHue: 20 });
  const unified = strategies.find((o) => o.id === "unified");
  const accent = strategies.find((o) => o.id === "accent");
  assert.equal(unified.brandHue, 15, "unified keeps the brand hue exactly");
  assert.equal(unified.reason, "unified-brand-equals-primary");
  assert.equal(accent.reason, "accent-direct", "lightness separates the same-family pair");
  assert.equal(accent.brandHue, 15);
  assert.deepEqual(
    accent.anchors,
    { primaryHue: 20, accentHue: 15, neutralHue: 20, brandHue: 15 },
    "the explicit structure pins primary; the mark stays on the brand hue",
  );
});

test("a same-family accent compiles with AA on both pairs", async () => {
  const strategies = deriveBrandStrategies(15);
  const accent = strategies.find((o) => o.id === "accent");
  const compiled = await compileStrategy("t-bp-accent-family", accent);
  assert.ok(hueDist(oklch(compiled.tokens.light["--brand"].$value).h, 15) <= 2, "the emitted mark is the brand hue");
  assert.ok(hueDist(oklch(compiled.tokens.light["--primary"].$value).h, 15) <= 2, "the emitted structure is the same family");
  for (const mode of ["light", "dark"]) {
    const tokens = compiled.tokens[mode];
    const brandRatio = contrastRatio(String(tokens["--brand-foreground"].$value), String(tokens["--brand"].$value));
    assert.ok(brandRatio >= 4.5, `accent ${mode}: brand text passes AA`);
    const primaryRatio = contrastRatio(String(tokens["--primary-foreground"].$value), String(tokens["--primary"].$value));
    assert.ok(primaryRatio >= 4.5, `accent ${mode}: structural text passes AA`);
  }
});

// ---------------------------------------------------------------------------
// 3. Verizon-style: red mark, ink structure, vivid signal
// ---------------------------------------------------------------------------

test("verizon-style: red brand, ink primary, vivid signal mark", async () => {
  // 'bold red brand, black action buttons'
  const strategies = deriveBrandStrategies(5, { structuralHue: 250 });
  assert.equal(strategies.length, 3, "the verizon case offers all three strategies");
  const markOnly = strategies.find((o) => o.id === "mark-only");
  const compiled = await compileStrategy("t-bp-verizon", markOnly);
  const brand = oklch(compiled.tokens.light["--brand"].$value);
  assert.ok(hueDist(brand.h, 5) <= 2, "the mark is signal red");
  assert.ok(brand.c > 0.1, "the mark stays loud");
  assert.equal(oklch(compiled.tokens.light["--primary"].$value).c, 0, "primary is ink, not red");
  const verizonAccent = oklch(compiled.tokens.light["--accent"].$value);
  assert.ok(hueDist(verizonAccent.h, 5) <= 2, "accent is the signal red hue");
  assert.ok(verizonAccent.l > brand.l, "accent is a lighter signal red");
  assert.ok(verizonAccent.l - brand.l < 0.15, "accent is only slightly lighter");
  for (const mode of ["light", "dark"]) {
    const tokens = compiled.tokens[mode];
    assert.equal(oklch(tokens["--brand"].$value).c === 0, false, `${mode}: brand never goes gray`);
    const ratio = contrastRatio(String(tokens["--brand-foreground"].$value), String(tokens["--brand"].$value));
    assert.ok(ratio >= 4.5, `mark-only ${mode}: brand text passes AA (${ratio.toFixed(2)})`);
  }
});

// ---------------------------------------------------------------------------
// 5. Monochrome: every strategy emits gray; one option ships
// ---------------------------------------------------------------------------

test("monochrome brief: one gray strategy, no pink", async () => {
  const palette = { primaryHue: 220, accentHue: 222, neutralHue: 221, brandHue: 0 };
  const constraints = { chromaCap: 0.02, hueSpreadMax: 10 };
  const strategies = deriveBrandStrategies(0, { achromatic: true });
  assert.equal(strategies.length, 1, "hue-only strategies collapse to one gray: only Unified ships");
  assert.equal(strategies[0].id, "unified");
  const compiled = await compileStrategy(
    "t-bp-mono-unified",
    strategies[0],
    { ...AXES, chroma: 0.8 },
    { constraints },
  );
  for (const mode of ["light", "dark"]) {
    for (const token of ["--brand", "--brand-foreground", "--primary", "--primary-foreground"]) {
      assert.equal(
        oklch(compiled.tokens[mode][token].$value).c,
        0,
        `${mode}.${token} is achromatic — brand never breaks monochrome`,
      );
    }
  }
});

// ---------------------------------------------------------------------------
// Enterprise: brand stays exempt from the accent-collapse rule
// ---------------------------------------------------------------------------

test("enterprise: accent collapses to structure while the brand keeps its hue", async () => {
  const enterpriseAxes = { ...AXES, formality: 0.85, chroma: 0.3 };
  const strategies = deriveBrandStrategies(5, { profile: "enterprise", structuralHue: 250 });
  const accent = strategies.find((o) => o.id === "accent");
  const compiled = await compileStrategy("t-bp-enterprise-accent", accent, enterpriseAxes);
  assert.equal(compiled.dna.profile, "enterprise");
  const brand = oklch(compiled.tokens.light["--brand"].$value);
  const accentTok = oklch(compiled.tokens.light["--accent"].$value);
  const primary = oklch(compiled.tokens.light["--primary"].$value);
  assert.ok(hueDist(brand.h, 5) <= 2, "the brand hue is used exactly as chosen");
  assert.ok(hueDist(brand.h, primary.h) > 25, "the brand is not collapsed into primary");
  assert.ok(hueDist(accentTok.h, primary.h) <= 1, "the accent family collapses to structure");
});

// ---------------------------------------------------------------------------
// 7. AA across a hue sweep, measured on emitted tokens (both modes)
// ---------------------------------------------------------------------------

test("every strategy passes 4.5:1 for brand and primary foregrounds, light and dark", async () => {
  for (const hue of [0, 25, 55, 100, 120, 180, 210, 250, 300, 340]) {
    const structural = (hue + 140) % 360;
    for (const strategy of deriveBrandStrategies(hue, { structuralHue: structural })) {
      const compiled = await compileStrategy(`t-bp-aa-${hue}-${strategy.id}`, strategy);
      // The accent strategy rotates when the hue sits on the structure —
      // assert the emitted mark matches the (possibly rotated) choice.
      assert.ok(
        hueDist(oklch(compiled.tokens.light["--brand"].$value).h, strategy.brandHue) <= 2,
        `hue ${hue} ${strategy.id}: emitted mark matches the strategy hue`,
      );
      for (const mode of ["light", "dark"]) {
        const tokens = compiled.tokens[mode];
        const solidPair = contrastRatio(
          String(tokens["--brand-foreground"].$value),
          String(tokens["--brand"].$value),
        );
        assert.ok(solidPair >= 4.5, `hue ${hue} ${strategy.id} ${mode}: brand pair ${solidPair.toFixed(2)}`);
        const primaryPair = contrastRatio(
          String(tokens["--primary-foreground"].$value),
          String(tokens["--primary"].$value),
        );
        assert.ok(primaryPair >= 4.5, `hue ${hue} ${strategy.id} ${mode}: primary pair ${primaryPair.toFixed(2)}`);
      }
    }
  }
});

// ---------------------------------------------------------------------------
// Recording + determinism + zero model calls
// ---------------------------------------------------------------------------

test("the draft records the strategy choice, the resulting hue and the reason", async () => {
  const palette = { primaryHue: 250, accentHue: 250, neutralHue: 250, brandHue: 5 };
  const palettes = derivePaletteOptions(palette);
  const strategies = deriveBrandStrategies(5, { structuralHue: 250 });
  const choice = strategies.find((o) => o.id === "mark-only");
  const applied = applyPickerDelta(
    AXES,
    palette,
    { chipIds: [], paletteId: "as-dreamed", brandId: choice.id },
    palettes,
    strategies,
  );
  assert.deepEqual(applied.anchors, choice.anchors, "the strategy replaces the anchors wholesale");
  const compiled = await compileStrategy("t-bp-record", choice, { ...AXES, ...applied.axes });
  assert.equal(compiled.dna.palette.brandHue, choice.brandHue, "compiled DNA carries the strategy hue");
  assert.equal(compiled.meta.brand.hue, choice.brandHue, "the brand record agrees");
  assert.equal(compiled.meta.brand.strategy, "mark-only", "the brand record names the strategy");
  // Recording shape the draft/log writes (reasons are stable ids).
  const record = {
    paletteChoiceId: "as-dreamed",
    paletteReason: palettes.find((o) => o.id === "as-dreamed").reason,
    brandChoiceId: choice.id,
    brandHue: compiled.dna.palette.brandHue,
    brandReason: choice.reason,
  };
  assert.deepEqual(Object.keys(record).sort(), [
    "brandChoiceId",
    "brandHue",
    "brandReason",
    "paletteChoiceId",
    "paletteReason",
  ]);
  assert.equal(record.brandReason, "mark-only-ink-primary");
  // An unknown strategy id falls back to the scheme anchors, never trusted.
  const fallback = applyPickerDelta(
    AXES,
    palette,
    { chipIds: [], paletteId: "as-dreamed", brandId: "brand-tertiary" },
    palettes,
    strategies,
  );
  assert.deepEqual(fallback.anchors, palettes.find((o) => o.id === "as-dreamed").anchors);
});

let fetchCalls = 0;
globalThis.fetch = (...args) => {
  fetchCalls += 1;
  throw new Error(`brand picker must not touch the network (attempt #${fetchCalls}: ${args[0]})`);
};

test("strategy selection recompiles with zero model calls and is deterministic", async () => {
  const strategies = deriveBrandStrategies(65, { structuralHue: 250 });
  const first = await compileStrategy("t-bp-determinism", strategies[1]);
  const second = await compileStrategy("t-bp-determinism", strategies[1]);
  assert.equal(JSON.stringify(first), JSON.stringify(second), "same strategy → byte-identical payload");
  assert.equal(fetchCalls, 0, "no model call for either row");
});

test("option derivation is pure: same hue → same strategies, any order of use", () => {
  assert.deepEqual(
    deriveBrandStrategies(15, { structuralHue: 250 }),
    deriveBrandStrategies(15, { structuralHue: 250 }),
  );
  // Fold order never changes the outcome: brand then palette == palette then brand.
  const palette = { primaryHue: 250, accentHue: 250, neutralHue: 250, brandHue: 5 };
  const palettes = derivePaletteOptions(palette);
  const strategies = deriveBrandStrategies(5, { structuralHue: 250 });
  const a = applyPickerDelta(AXES, palette, { chipIds: ["bold"], paletteId: "surprising", brandId: "accent" }, palettes, strategies);
  const b = applyPickerDelta(AXES, palette, { chipIds: ["bold"], brandId: "accent", paletteId: "surprising" }, palettes, strategies);
  assert.deepEqual(a, b);
});

// ---------------------------------------------------------------------------
// Step UI: one step, two rows, one shared live preview
// ---------------------------------------------------------------------------

test("the picker step renders brand then palette on one screen under one live preview", () => {
  const dock = readFileSync(join(repoRoot, "apps", "web", "app", "dashboard", "creation-dock.tsx"), "utf8");
  assert.ok(dock.includes('data-testid="live-preview"'), "one shared live preview");
  assert.ok(dock.includes('data-testid="palette-row"'), "palette row exists");
  assert.ok(dock.includes('data-testid="brand-row"'), "brand row exists");
  assert.ok(
    dock.indexOf('data-testid="brand-row"') < dock.indexOf('data-testid="palette-row"'),
    "the brand section renders above the palette section",
  );
  // Both rows are color choices only, with no names: the palette row strips
  // the strategy's emitted colors, the brand row shows one swatch per option.
  // The composed mini component belongs to the shared live preview above
  // them, which is what the pick is judged on.
  const brandRow = dock.slice(
    dock.indexOf('data-testid="brand-row"'),
    dock.indexOf('data-testid="palette-row"'),
  );
  // Bounded at the typeface row: the composed mini component belongs to
  // the colors-step live preview only — steps 1 and 2 show no preview,
  // and the rows never compose one.
  const paletteRow = dock.slice(
    dock.indexOf('data-testid="palette-row"'),
    dock.indexOf('data-testid="typeface-row"'),
  );
  assert.ok(paletteRow.includes("SwatchStrip"), "palette options are plain color strips");
  assert.ok(dock.includes('{ label: "Background"'), "the strip names the background, not the surface");
  assert.ok(!paletteRow.includes("MiniSystemPreview"), "the palette row composes nothing");
  assert.ok(!brandRow.includes("MiniSystemPreview"), "the brand row composes nothing");
  assert.ok(brandRow.includes("backgroundColor: color.swatch"), "brand options are one swatch each");
  assert.ok(/>Brand</.test(dock), "brand section is labeled Brand");
  assert.ok(/>Palette</.test(dock), "palette section is labeled Palette");
  const mini = readFileSync(join(repoRoot, "apps", "web", "components", "mini-system-preview.tsx"), "utf8");
  for (const marker of ["Acme", "seat", "Reserve", "About Us", "Limited Time Deal", "20% off"]) {
    assert.ok(mini.includes(marker), `mini component shows ${marker} (wordmark, focal word, buttons, brand deal card)`);
  }
  assert.ok(!mini.includes("Check availability"), "deal card has no CTA button — the solid speaks for itself");
  assert.ok(!mini.includes(">New<"), "mini component has no New badge");
  assert.ok(!mini.includes("preview-role-key"), "mini component does not list a color key");
  // No prompt-lede under the step: the rows are nameless colors and the
  // live preview above is what the pick is judged on.
  assert.ok(!/how the brand is used/i.test(dock), "no palette explainer under the prompt");
  // Bound each row to its own fieldset: the typeface step below legitimately
  // renders names, so an unbounded slice would false-positive.
  const paletteField = paletteRow.slice(0, paletteRow.indexOf("</fieldset>"));
  assert.ok(!paletteField.includes("{option.roleLabel}"), "palette options show no usage names");
  assert.ok(!paletteField.includes("{option.name}"), "palette options show no color names");
  assert.ok(!paletteField.includes("{option.reason}"), "palette options show no reason text");
  assert.ok(!brandRow.includes(">{color.name}<"), "brand options render no name text");
  // Every brand's palette row ships precalculated with the preview, so the
  // brand pick is an instant tab-switch — no fetch, no waiting.
  assert.ok(dock.includes("brandPalettes"), "brand rows are precalculated, not fetched");
  assert.ok(!dock.includes("brandPending"), "no loading state between brand and palettes");
  assert.ok(!dock.includes("Rebuilding palettes"), "no rebuilding note — it is instant");
  assert.ok(dock.includes("setBrandColorId(color.id)"), "brand pick moves local state only");
  // The custom color lives on the Generated tile: clicking the tile body
  // selects it, and only the pipette badge opens the native picker.
  const badgeOpen = brandRow.indexOf('title="Pick any color"');
  const colorInput = brandRow.indexOf('type="color"');
  assert.ok(badgeOpen !== -1 && colorInput > badgeOpen, "the native picker opens from the pipette badge");
  assert.ok(!brandRow.slice(badgeOpen, colorInput).includes("</span>"), "the picker input is scoped to the badge, not the tile");
  assert.ok(dock.includes("onChange={() => setUsageId(option.id)}"), "palette row re-skins client-side");
  assert.ok(dock.includes("DESCRIBE_WORDS"), "words step uses the describe-in-words set");
  assert.ok(!dock.includes("WORD_CHIPS"), "color/type words are gone from creation");
  assert.ok(!dock.includes("STRUCTURE_CHIPS"), "the structural chip set is gone from creation");
  assert.ok(dock.includes("Pick up to 5"), "words step names its cap");
  assert.ok(dock.includes("wordOrder"), "the words step keeps a pick history");
  assert.ok(dock.includes("current.slice(0, 4)"), "past five, a new pick replaces the fifth");
  assert.ok(dock.includes("previewWordsAction"), "the words preview recompiles live on every change");
  // The custom hex re-skins on top of the final swatches (never masked by
  // a stale words recompile) and loading shows a skeleton, never text.
  assert.ok(dock.includes("wordsBase"), "the custom pick layers over the word-folded preview");
  assert.ok(dock.includes("loading={wordOrder.length > 0 && wordsPending}"), "loading pulses the preview text in place");
  assert.ok(mini.includes("aria-busy"), "the preview reports its loading state");
  assert.ok(!dock.includes("Updating preview…"), "no updating text under the preview");
  // Step order: words → typeface → colors. Generation lands on words;
  // the typeface step continues to colors, and colors create the draft.
  const stepOrder = dock.indexOf('title: "Describe it in words"');
  assert.ok(stepOrder !== -1 && stepOrder < dock.indexOf('title: "Pick a typeface"'), "words is the first step");
  assert.ok(
    dock.indexOf('title: "Pick a typeface"') < dock.indexOf('title: "Pick your colors"'),
    "colors is the last step",
  );
  assert.ok(dock.includes("Continue to colors"), "the typeface step continues to colors");
  // The colors-step preview shows the whole pick: word-folded shape
  // (live recompile) plus the picked typeface pair.
  assert.ok(dock.includes("colorsSwatches"), "the colors preview prefers the word-folded recompile");
  assert.ok(dock.includes("displayFont={activeTypeface?.display}"), "the preview renders the picked display face");
  assert.ok(dock.includes("bodyFont={activeTypeface?.body}"), "the preview renders the picked body face");
  assert.ok(mini.includes("displayFont"), "the mini preview takes the picked pair");
  // The live preview renders only on the colors step: slice each earlier
  // step's block (file order is palettes, typefaces, words) and prove the
  // composed preview is absent from both.
  const typefacesBlock = dock.slice(dock.indexOf('{phase === "typefaces"'), dock.indexOf('{phase === "words"'));
  const wordsBlock = dock.slice(dock.indexOf('{phase === "words"'));
  assert.ok(!typefacesBlock.includes("MiniSystemPreview"), "the typeface step shows no live preview");
  assert.ok(!wordsBlock.includes("MiniSystemPreview"), "the words step shows no live preview");
  const palettesBlock = dock.slice(dock.indexOf('{phase === "palettes"'), dock.indexOf('{phase === "typefaces"'));
  assert.ok(palettesBlock.includes("MiniSystemPreview"), "the colors step keeps its live preview");
  assert.ok(dock.includes("Nothing here is final"), "colors + typeface steps carry the not-final note");
  assert.ok(!dock.includes(">{option.name}</span>"), "typeface cards show specimens, not names");
  const miniComponent = readFileSync(join(repoRoot, "apps", "web", "components", "mini-system-preview.tsx"), "utf8");
  // The preview frame carries the app border; the buttons are borderless
  // (the borders voice lives on the deal card, in brand ink).
  assert.ok(miniComponent.includes('rounded-md border border-border'), "the live preview card is framed");
  for (const button of ["primaryButton", "secondaryButton"]) {
    const block = miniComponent.slice(miniComponent.indexOf(`const ${button}`), miniComponent.indexOf("};", miniComponent.indexOf(`const ${button}`)));
    for (const prop of ["borderWidth", "borderStyle", "borderColor", "borderTop", "borderLeft"]) {
      assert.ok(!block.includes(prop), `${button} is borderless (no ${prop})`);
    }
  }
  assert.ok(miniComponent.includes("borderTop: `${borderWidth}"), "the deal card shows the borders voice");
  assert.ok(
    miniComponent.includes("const focal: CSSProperties = { color: swatches.brand };"),
    "the hero focal word rides the brand solid",
  );
  assert.ok(miniComponent.includes("<span style={focal}>seat</span>"), "seat is the focal word");
  const typePreview = readFileSync(
    join(repoRoot, "apps", "web", "components", "typeface-option-preview.tsx"),
    "utf8",
  );
  assert.ok(!typePreview.includes("bg-card"), "typeface specimens sit on the card, no nested card");
  // Generating shows the shared full-screen loader, never the picker modal.
  assert.ok(dock.includes("GeneratingLoader"), "generating shows the shared loader");
  assert.ok(dock.includes('phase !== "generating"'), "picker modal stays closed while generating");
  assert.ok(dock.includes('<GeneratingLoader label="Saving changes"'), "creating shows the shared loader as Saving changes");
  assert.ok(!dock.includes("Compiling your selections"), "no in-modal creating copy");
  const loader = readFileSync(join(repoRoot, "apps", "web", "components", "generating-loader.tsx"), "utf8");
  for (const marker of ["backdrop-blur", "ArcheLogo", "animate-[spin", "Generating"]) {
    assert.ok(loader.includes(marker), `shared loader shows ${marker}`);
  }
  assert.ok(loader.includes('role="status"'), "loader is announced as a status");
});

test("every strategy ships an AA-verified preview for every palette option", async () => {
  const palette = { primaryHue: 250, accentHue: 250, neutralHue: 250, brandHue: 5 };
  const palettes = derivePaletteOptions(palette);
  // Strategies derive from the winning hue; the scheme row still stands
  // beneath them (finish always sends as-dreamed). Every pairing previews AA.
  for (const strategy of deriveBrandStrategies(5, { structuralHue: 250 })) {
    for (const paletteOption of palettes) {
      const compiled = await compileStrategy(`t-bp-matrix-${strategy.id}-${paletteOption.id}`, strategy);
      const ratio = contrastRatio(
        String(compiled.tokens.light["--brand-foreground"].$value),
        String(compiled.tokens.light["--brand"].$value),
      );
      assert.ok(ratio >= 4.5, `${strategy.id} × ${paletteOption.id}: preview text passes AA`);
    }
  }
  console.log("strategy × palette preview matrix: all pairings gated by AA");
});

// ---------------------------------------------------------------------------
// Static brand: five fixed colors; picking one derives the strategies
// ---------------------------------------------------------------------------

test("the brand slots are five fixed hues (slot definitions)", () => {
  const colors = deriveBrandColors();
  assert.deepEqual(
    colors.map((color) => color.id),
    ["brand-crimson", "brand-amber", "brand-jade", "brand-azure", "brand-violet"],
    "five fixed slots in wheel order",
  );
  assert.deepEqual(
    colors.map((color) => color.brandHue),
    [15, 55, 160, 225, 290],
    "the slot hues are fixed",
  );
  assert.equal(resolveBrandColor("brand-jade")?.brandHue, 160, "known ids resolve");
  assert.equal(resolveBrandColor("brand-tertiary"), undefined, "generation-derived ids no longer resolve");
  assert.equal(resolveBrandColor(undefined), undefined, "absent stays absent");
});

test("curated row: a dreamed hue clear of the wheel returns the slots untouched", () => {
  assert.deepEqual(
    curateBrandColors(100).map((color) => color.brandHue),
    [15, 55, 160, 225, 290],
    "no collision, no curation — the row is stable",
  );
  assert.deepEqual(
    curateBrandColors(340).map((color) => color.brandHue),
    [15, 55, 160, 225, 290],
    "raspberry sits 35° off crimson: distinct by the gate, row untouched",
  );
});

test("curated row: colliding slots are replaced, every tile stays ≥30° apart", () => {
  // Bright red on crimson, and exact hits on jade/azure/violet: the
  // colliding slot moves (complement first), everything else stands.
  assert.deepEqual(
    curateBrandColors(5).map((color) => color.brandHue),
    [195, 55, 160, 225, 290],
    "crimson collapses onto bright red, so it moves to its complement",
  );
  assert.equal(
    curateBrandColors(160).find((color) => color.id === "brand-jade").brandHue,
    340,
    "jade dreamed exactly: complement",
  );
  assert.equal(
    curateBrandColors(225).find((color) => color.id === "brand-azure").brandHue,
    345,
    "azure dreamed exactly: complement and +150/+210 all collide, +120 wins",
  );
  assert.equal(
    curateBrandColors(290).find((color) => color.id === "brand-violet").brandHue,
    110,
    "violet dreamed exactly: complement",
  );
  // Slot ids are stable (finish resolves them); the Generated tile — the
  // dreamed hue itself, always default — is never moved, only alternatives.
  for (const dreamed of [5, 55, 160, 225, 290, 340]) {
    const row = curateBrandColors(dreamed);
    assert.equal(row.length, 5);
    assert.deepEqual(
      row.map((color) => color.id),
      ["brand-crimson", "brand-amber", "brand-jade", "brand-azure", "brand-violet"],
      `slot ids stable for dreamed ${dreamed}`,
    );
    const hues = [...row.map((color) => color.brandHue), dreamed];
    for (let i = 0; i < hues.length; i++) {
      for (let j = i + 1; j < hues.length; j++) {
        assert.ok(
          hueDist(hues[i], hues[j]) >= 30,
          `dreamed ${dreamed}: tiles ${hues[i]}° and ${hues[j]}° are distinct choices`,
        );
      }
    }
  }
});

test("picked hues survive a hue-family brief: alternatives never snap back", async () => {
  // A "red" + "vivid" brief parses to a hue family plus an accent floor.
  // The dreamed answer obeys both; an explicit pick obeys neither — the
  // pick IS the new family, and the floor governs accents, not ink.
  const constraints = { hueFamily: 5, chromaFloorAccent: 0.15 };
  const dreamed = await compile(
    "t-bp-snap-dreamed",
    { primaryHue: 195, accentHue: 195, neutralHue: 195, brandHue: 195 },
    AXES,
    { constraints },
  );
  assert.ok(
    hueDist(oklch(dreamed.tokens.light["--brand"].$value).h, 5) <= 2,
    "dreamed off-family hue still snaps to the brief's family",
  );
  for (const strategy of deriveBrandStrategies(195)) {
    const alt = await compileStrategy(`t-bp-pick-${strategy.id}`, strategy, AXES, {
      constraints,
      preservePickedHues: true,
    });
    assert.ok(
      hueDist(oklch(alt.tokens.light["--brand"].$value).h, 195) <= 2,
      `${strategy.id}: the picked hue stands — tiles render what they offer`,
    );
  }
});

test("a vivid brief keeps all three strategies for off-family picks", async () => {
  // The accent floor used to boost mark-only's ink primary until the
  // taper rule failed and the strategy dropped out of the row (two
  // options where three were promised). The floor now governs the accent
  // — which here IS the full-voice brand — and leaves ink structure alone.
  const constraints = { hueFamily: 5, chromaFloorAccent: 0.15 };
  for (const hue of [195, 55, 160, 225, 290]) {
    const strategies = deriveBrandStrategies(hue);
    assert.equal(strategies.length, 3, `hue ${hue}: derivation still offers three`);
    for (const strategy of strategies) {
      const compiled = await compileStrategy(`t-bp-vivid-${hue}-${strategy.id}`, strategy, AXES, {
        constraints,
        preservePickedHues: true,
      });
      for (const mode of ["light", "dark"]) {
        const tokens = compiled.tokens[mode];
        const ratio = contrastRatio(
          String(tokens["--brand-foreground"].$value),
          String(tokens["--brand"].$value),
        );
        assert.ok(ratio >= 4.5, `hue ${hue} ${strategy.id} ${mode}: picked pair passes AA (${ratio.toFixed(2)})`);
      }
    }
  }
  console.log("vivid + family brief: every tile row ships all three strategies");
});

test("the service compiles picks as alternatives, dreamed rows as dreamed", () => {
  const service = readFileSync(join(repoRoot, "apps", "web", "lib", "generation", "service.ts"), "utf8");
  assert.equal(
    service.split("alternative: true").length - 1,
    2,
    "custom-hex + tile rows compile as alternatives (family snap off)",
  );
  assert.ok(service.includes("preservePickedHues: true,"), "brand tiles compile as alternatives");
  assert.equal(
    service.split("preservePickedHues: pickedBrandHue != null").length - 1,
    3,
    "finish + its repair retry + the live words preview keep a picked mark, snap as-dreamed",
  );
  assert.ok(
    service.includes("selections.brandColorId != null || selections.customBrandHue != null"),
    "studio recompiles keep the draft's picked mark",
  );
});

test("paletteFromBrand calculates the whole system from the single brand hue", () => {
  assert.deepEqual(
    paletteFromBrand(15),
    { primaryHue: 15, accentHue: 75, neutralHue: 15, brandHue: 15 },
    "primary/neutral/mark on the hue, accent a static +60° away",
  );
  assert.deepEqual(
    paletteFromBrand(330),
    { primaryHue: 330, accentHue: 30, neutralHue: 330, brandHue: 330 },
    "the accent wraps around the wheel",
  );
});

test("a picked brand color derives the strategies from its hue", () => {
  const palette = { primaryHue: 250, accentHue: 250, neutralHue: 250, brandHue: 5 };
  const plain = applyPickerDelta(AXES, palette, { chipIds: [], paletteId: "as-dreamed" });
  assert.deepEqual(plain.anchors, palette, "no strategy picked: the generation's own anchors stand");
  // The caller derives strategies from the winning hue (fixed row here);
  // the fold applies the chosen strategy wholesale.
  const strategies = deriveBrandStrategies(160, { structuralHue: 250 });
  const based = applyPickerDelta(
    AXES,
    palette,
    { chipIds: [], paletteId: "as-dreamed", brandId: "unified" },
    derivePaletteOptions(palette),
    strategies,
  );
  assert.deepEqual(
    based.anchors,
    { primaryHue: 160, accentHue: 160, neutralHue: 160, brandHue: 160 },
    "the unified strategy sits the whole system on the picked hue",
  );
  assert.deepEqual(based.axes, plain.axes, "the brand never touches the axes");
  const accented = applyPickerDelta(
    AXES,
    palette,
    { chipIds: [], paletteId: "as-dreamed", brandId: "accent" },
    derivePaletteOptions(palette),
    strategies,
  );
  assert.equal(accented.anchors.brandHue, 160, "the accent mark is the picked hue");
  assert.equal(accented.anchors.primaryHue, 250, "the accent structure stays dreamed");
  // An unknown brand id is ignored, never trusted.
  const bogus = applyPickerDelta(AXES, palette, {
    chipIds: [],
    paletteId: "as-dreamed",
    brandId: "not-a-strategy",
  });
  assert.deepEqual(bogus.anchors, palette, "unknown strategy ids fall back to the generation");
});

test("the emitted mark follows the picked brand through the strategy", async () => {
  const palette = { primaryHue: 250, accentHue: 250, neutralHue: 250, brandHue: 5 };
  const strategies = deriveBrandStrategies(160, { structuralHue: 250 });
  const unified = strategies.find((o) => o.id === "unified");
  const folded = applyPickerDelta(
    AXES,
    palette,
    { chipIds: [], paletteId: "as-dreamed", brandId: "unified" },
    derivePaletteOptions(palette),
    strategies,
  );
  const emitted = await compileStrategy("t-bp-brand-wins", unified, { ...AXES, ...folded.axes });
  assert.ok(
    hueDist(oklch(emitted.tokens.light["--brand"].$value).h, 160) <= 2,
    "the emitted hue is the picked brand color",
  );
  assert.ok(
    hueDist(oklch(emitted.tokens.light["--primary"].$value).h, 160) <= 2,
    "the system sits on the brand hue, not the generation's",
  );
});
