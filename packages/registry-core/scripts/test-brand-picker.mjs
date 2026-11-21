/* global console */
/**
 * Acceptance battery for the palette + brand picker (3 palette + up to 5
 * Material 3 brand options on step 1).
 *
 * Deterministic: no model calls. The model is replaced by hand-authored DNA +
 * palette anchors, and the code path under test is schema → derive options →
 * fold the selection → compile → validate, with the network stubbed out.
 *
 * Covers the eight acceptance criteria: (1) 3 + up-to-5 on one screen under
 * one live preview, instant client-side re-skin, zero model calls;
 * (2) the lede discloses only the dreamed choices are the model's answers;
 * (3) the Verizon-style case (red dreamed, ink primary, muted secondary,
 * tertiary distinct from both, neutral ink); (4) Material 3 derivation
 * (tertiary = accent else +60/+120, secondary ≈ 0.45× chroma, ink C = 0);
 * (5) monochrome collapses to one C = 0 option, no pink; (6) dedup hides
 * Brand = Primary when the brand sits on primary (4 options, not 5);
 * (7) AA on every shown brand option in both modes, measured on emitted
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
  deriveBrandColors,
  deriveBrandOptions,
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
/** Compile exactly like the service: the brand option's voice rides along. */
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
const compileBrand = (name, palette, option, axes = AXES, extra = {}) =>
  compile(name, { ...palette, brandHue: option.brandHue }, axes, {
    ...extra,
    brandChromaScale: option.chromaScale,
  });

// ---------------------------------------------------------------------------
// 1. Row shape: three palettes, up to five brand options, one screen
// ---------------------------------------------------------------------------

test("palette derivation keeps 3 scheme options; the 5 brand usages ship in fixed order", () => {
  const palette = { primaryHue: 250, accentHue: 250, neutralHue: 250, brandHue: 5 };
  const palettes = derivePaletteOptions(palette);
  assert.equal(palettes.length, 3, "palette row is unchanged: exactly 3 options");
  const brands = deriveBrandOptions(palette);
  assert.deepEqual(
    brands.map((o) => o.id),
    ["as-dreamed", "brand-primary", "brand-secondary", "brand-tertiary", "brand-ink"],
    "the five Material 3 slots ship in fixed order",
  );
  assert.deepEqual(
    brands.map((o) => o.reason),
    ["as-dreamed", "brand-equals-primary", "secondary-muted", "tertiary-rotated-60", "ink"],
    "each slot records its reason (accent sat on primary, so tertiary rotates)",
  );
  assert.equal(brands[0].brandHue, 5, "As Dreamed is the model's own brandHue, untouched");
  for (const option of brands) {
    assert.ok(option.name && option.name !== String(option.brandHue), "evocative name, never a bare hue");
    assert.ok(option.roleLabel && option.roleLabel.length > 0, "each option carries its role label");
    assert.ok(option.brandHue >= 0 && option.brandHue <= 360, "hue in range");
  }
  // The palette row's own anchors are never mutated by brand derivation.
  assert.deepEqual(palettes[0].anchors, { ...palette });
});

test("both rows differ only in the mark color: the brand row never re-tints the system", async () => {
  const palette = { primaryHue: 250, accentHue: 250, neutralHue: 250, brandHue: 5 };
  const palettes = derivePaletteOptions(palette);
  const brands = deriveBrandOptions(palette);
  const chosenPalette = palettes.find((o) => o.id === "quiet-ground");
  const ink = brands.find((o) => o.id === "brand-ink");
  const result = await compileBrand("t-bp-brand-only", chosenPalette.anchors, ink);
  const resultBare = await compile("t-bp-brand-only", chosenPalette.anchors);
  for (const token of ["--primary", "--accent", "--background", "--card", "--foreground", "--ring"]) {
    assert.equal(
      result.tokens.light[token].$value,
      resultBare.tokens.light[token].$value,
      `${token} is untouched by the brand row`,
    );
  }
  assert.notEqual(result.tokens.light["--brand"].$value, resultBare.tokens.light["--brand"].$value);
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
// 3. Verizon-style: red dreamed brand, ink primary, muted secondary,
//    distinct tertiary, neutral ink
// ---------------------------------------------------------------------------

test("verizon-style: red brand, ink primary, muted secondary, distinct tertiary, ink", async () => {
  // 'bold red brand, black action buttons'
  const palette = { primaryHue: 250, accentHue: 250, neutralHue: 250, brandHue: 5 };
  const brands = deriveBrandOptions(palette);
  assert.equal(brands.length, 5, "the verizon case offers all five brand colors");
  const dreamed = brands.find((o) => o.id === "as-dreamed");
  const primary = brands.find((o) => o.id === "brand-primary");
  const secondary = brands.find((o) => o.id === "brand-secondary");
  const tertiary = brands.find((o) => o.id === "brand-tertiary");
  const ink = brands.find((o) => o.id === "brand-ink");
  assert.ok(dreamed && primary && secondary && tertiary && ink, "all five slots ship");
  assert.equal(dreamed.brandHue, 5, "As Dreamed is the red brand");
  assert.equal(primary.brandHue, 250, "Brand = Primary is the ink/primary hue");
  assert.equal(secondary.brandHue, 250, "Brand = Secondary shares the primary hue");
  assert.ok(Math.abs(secondary.chromaScale - 0.45) < 1e-9, "secondary mutes to ~0.45× voice chroma");
  assert.ok(hueDist(tertiary.brandHue, 5) >= 30, "tertiary is distinct from the dreamed brand");
  assert.ok(hueDist(tertiary.brandHue, 250) >= 30, "tertiary clears the gate against primary");
  assert.equal(ink.chromaScale, 0, "ink carries no chroma");
  assert.equal(ink.brandHue, 250, "ink's hue anchor rests on primary");
  // Emitted values agree with the choices, and each ships AA in both modes.
  const emitted = {};
  for (const option of brands) {
    const compiled = await compileBrand(`t-bp-verizon-${option.id}`, palette, option);
    emitted[option.id] = compiled;
    const set = compiled.tokens.light;
    assert.ok(hueDist(oklch(set["--brand"].$value).h, option.brandHue) <= 2, `${option.id}: emitted brand hue`);
    assert.ok(hueDist(oklch(set["--primary"].$value).h, 250) <= 2, `${option.id}: primary stays the ink hue`);
    for (const mode of ["light", "dark"]) {
      const tokens = compiled.tokens[mode];
      const ratio = contrastRatio(String(tokens["--brand-foreground"].$value), String(tokens["--brand"].$value));
      assert.ok(ratio >= 4.5, `${option.id} ${mode}: brand text passes AA (${ratio.toFixed(2)})`);
    }
  }
  // Material 3 relations hold on emitted values: secondary is the primary
  // hue at ~0.45× chroma, ink is C = 0 on every brand role.
  const primaryBrand = oklch(emitted["brand-primary"].tokens.light["--brand"].$value);
  const secondaryBrand = oklch(emitted["brand-secondary"].tokens.light["--brand"].$value);
  assert.ok(hueDist(secondaryBrand.h, primaryBrand.h) <= 2, "secondary shares the primary hue");
  assert.ok(
    Math.abs(secondaryBrand.c / primaryBrand.c - 0.45) < 0.05,
    `secondary emits ~0.45× chroma (got ${(secondaryBrand.c / primaryBrand.c).toFixed(3)})`,
  );
  for (const mode of ["light", "dark"]) {
    for (const token of ["--brand", "--brand-foreground"]) {
      assert.equal(
        oklch(emitted["brand-ink"].tokens[mode][token].$value).c,
        0,
        `ink ${mode}.${token} is C = 0`,
      );
    }
  }
});

// ---------------------------------------------------------------------------
// 4. Material 3 derivation: tertiary cascade, secondary voice, ink
// ---------------------------------------------------------------------------

test("tertiary takes the accent when it clears the gate, else +60, else +120", () => {
  // Accent 10° sits inside 30° of primary 0° and dreamed+60 is primary, so
  // the cascade lands on primary + 60°.
  const brands = deriveBrandOptions({ primaryHue: 0, accentHue: 10, neutralHue: 0, brandHue: 300 });
  const tertiary = brands.find((o) => o.id === "brand-tertiary");
  assert.ok(tertiary, "a tertiary option still ships");
  assert.equal(tertiary.reason, "tertiary-rotated-60");
  assert.equal(tertiary.brandHue, 60);
  // Accent clear of primary is used directly.
  const accentWins = deriveBrandOptions({ primaryHue: 210, accentHue: 100, neutralHue: 210, brandHue: 210 });
  const accentTertiary = accentWins.find((o) => o.id === "brand-tertiary");
  assert.equal(accentTertiary.reason, "tertiary-accentHue");
  assert.equal(accentTertiary.brandHue, 100);
});

// ---------------------------------------------------------------------------
// 6. Dedup: brand on primary hides Brand = Primary (4 options, not 5)
// ---------------------------------------------------------------------------

test("dedup: a generation whose brand sits on primary shows 4 brand options", () => {
  const brands = deriveBrandOptions({ primaryHue: 210, accentHue: 20, neutralHue: 210, brandHue: 214 });
  assert.deepEqual(
    brands.map((o) => o.id),
    ["as-dreamed", "brand-secondary", "brand-tertiary", "brand-ink"],
    "Brand = Primary is hidden instead of shown identical; the muted mark survives by chroma",
  );
  assert.equal(brands.find((o) => o.id === "brand-tertiary").reason, "tertiary-accentHue");
});

// ---------------------------------------------------------------------------
// 5. Monochrome: every option is C = 0, no pink
// ---------------------------------------------------------------------------

test("monochrome brief: every brand option emits C = 0 and the hues collapse", async () => {
  const palette = { primaryHue: 220, accentHue: 222, neutralHue: 221, brandHue: 0 };
  const constraints = { chromaCap: 0.02, hueSpreadMax: 10 };
  const brands = deriveBrandOptions(palette, { achromatic: true });
  assert.equal(brands.length, 1, "hue-only options collapse to one gray: only As Dreamed ships");
  for (const option of brands) {
    const compiled = await compile(
      `t-bp-mono-${option.id}`,
      { ...palette, brandHue: option.brandHue },
      { ...AXES, chroma: 0.8 },
      { constraints },
    );
    for (const mode of ["light", "dark"]) {
      for (const token of ["--brand", "--brand-foreground"]) {
        assert.equal(
          oklch(compiled.tokens[mode][token].$value).c,
          0,
          `${mode}.${token} is achromatic — brand never breaks monochrome`,
        );
      }
    }
  }
});

// ---------------------------------------------------------------------------
// Enterprise: brand stays exempt from the accent-collapse rule
// ---------------------------------------------------------------------------

test("enterprise: brand keeps its own hue while the accent collapses to primary", async () => {
  const enterpriseAxes = { ...AXES, formality: 0.85, chroma: 0.3 };
  const palette = { primaryHue: 250, accentHue: 200, neutralHue: 250, brandHue: 5 };
  const brands = deriveBrandOptions(palette, { profile: "enterprise" });
  const tertiary = brands.find((o) => o.id === "brand-tertiary");
  assert.ok(tertiary, "enterprise still offers a tertiary mark");
  assert.ok(tertiary.reason !== "tertiary-accentHue", "enterprise has no accent family to borrow from");
  assert.equal(tertiary.reason, "tertiary-rotated-60");
  const secondary = brands.find((o) => o.id === "brand-secondary");
  assert.equal(secondary.reason, "secondary-muted");
  for (const option of brands) {
    const compiled = await compileBrand(
      `t-bp-enterprise-${option.id}`,
      palette,
      option,
      enterpriseAxes,
    );
    assert.equal(compiled.dna.profile, "enterprise");
    const brand = oklch(compiled.tokens.light["--brand"].$value);
    const accent = oklch(compiled.tokens.light["--accent"].$value);
    const primary = oklch(compiled.tokens.light["--primary"].$value);
    // The brand is exempt from the accent-collapse rule: it keeps the chosen
    // hue exactly (primary/secondary/ink share the primary hue by design).
    assert.ok(hueDist(brand.h, option.brandHue) <= 2, `${option.id}: the brand hue is used exactly as chosen`);
    if (option.id === "as-dreamed" || option.id === "brand-tertiary") {
      assert.ok(hueDist(brand.h, primary.h) > 25, `${option.id}: the brand is not collapsed into primary`);
    }
    if (option.id === "brand-secondary") {
      assert.ok(
        Math.abs(brand.c / primary.c - 0.45) < 0.05,
        `${option.id}: the muted mark emits ~0.45× chroma`,
      );
    }
    assert.ok(hueDist(accent.h, primary.h) <= 1, `${option.id}: the accent family is collapsed`);
  }
});

// ---------------------------------------------------------------------------
// 7. AA across a hue sweep, measured on emitted tokens (both modes)
// ---------------------------------------------------------------------------

test("every shown brand option passes 4.5:1 for its foreground, light and dark", async () => {
  for (const hue of [0, 25, 55, 100, 120, 180, 210, 250, 300, 340]) {
    const palette = { primaryHue: (hue + 140) % 360, accentHue: (hue + 200) % 360, neutralHue: 220, brandHue: hue };
    for (const option of deriveBrandOptions(palette)) {
      const compiled = await compileBrand(`t-bp-aa-${hue}-${option.id}`, palette, option);
      for (const mode of ["light", "dark"]) {
        const tokens = compiled.tokens[mode];
        const solidPair = contrastRatio(
          String(tokens["--brand-foreground"].$value),
          String(tokens["--brand"].$value),
        );
        assert.ok(solidPair >= 4.5, `hue ${hue} ${option.id} ${mode}: solid pair ${solidPair.toFixed(2)}`);
      }
    }
  }
});

// ---------------------------------------------------------------------------
// Recording + determinism + zero model calls
// ---------------------------------------------------------------------------

test("the draft records both choices, the resulting brand hue and each reason", async () => {
  const palette = { primaryHue: 250, accentHue: 250, neutralHue: 250, brandHue: 5 };
  const palettes = derivePaletteOptions(palette);
  const brands = deriveBrandOptions(palette);
  const paletteChoice = palettes.find((o) => o.id === "quiet-ground");
  const brandChoice = brands.find((o) => o.id === "brand-secondary");
  const applied = applyPickerDelta(
    AXES,
    palette,
    { chipIds: [], paletteId: paletteChoice.id, brandId: brandChoice.id },
    palettes,
    brands,
  );
  assert.equal(applied.anchors.brandHue, brandChoice.brandHue, "brand row owns brandHue alone");
  assert.equal(applied.anchors.primaryHue, paletteChoice.anchors.primaryHue, "palette row owns the system");
  const compiled = await compileBrand("t-bp-record", applied.anchors, brandChoice, { ...AXES, ...applied.axes });
  assert.equal(compiled.dna.palette.brandHue, brandChoice.brandHue, "compiled DNA carries the chosen hue");
  assert.equal(compiled.meta.brand.hue, brandChoice.brandHue, "the brand record agrees");
  // Recording shape the draft/log writes (reasons are stable ids).
  const record = {
    paletteChoiceId: paletteChoice.id,
    paletteReason: paletteChoice.reason,
    brandChoiceId: brandChoice.id,
    brandHue: compiled.dna.palette.brandHue,
    brandReason: brandChoice.reason,
  };
  assert.deepEqual(Object.keys(record).sort(), [
    "brandChoiceId",
    "brandHue",
    "brandReason",
    "paletteChoiceId",
    "paletteReason",
  ]);
  assert.equal(record.brandReason, "secondary-muted");
  assert.ok(
    hueDist(oklch(compiled.tokens.light["--brand"].$value).h, 250) <= 2,
    "the muted mark compiles on the primary hue",
  );
});

let fetchCalls = 0;
globalThis.fetch = (...args) => {
  fetchCalls += 1;
  throw new Error(`brand picker must not touch the network (attempt #${fetchCalls}: ${args[0]})`);
};

test("brand selection recompiles with zero model calls and is deterministic", async () => {
  const palette = { primaryHue: 250, accentHue: 250, neutralHue: 250, brandHue: 5 };
  const first = await compile("t-bp-determinism", { ...palette, brandHue: 65 });
  const second = await compile("t-bp-determinism", { ...palette, brandHue: 65 });
  assert.equal(JSON.stringify(first), JSON.stringify(second), "same anchors → byte-identical payload");
  assert.equal(fetchCalls, 0, "no model call for either row");
});

test("option derivation is pure: same palette → same options, any order of use", () => {
  const palette = { primaryHue: 250, accentHue: 250, neutralHue: 250, brandHue: 5 };
  assert.deepEqual(deriveBrandOptions(palette), deriveBrandOptions(palette));
  // Fold order never changes the outcome: brand then palette == palette then brand.
  const palettes = derivePaletteOptions(palette);
  const brands = deriveBrandOptions(palette);
  const a = applyPickerDelta(AXES, palette, { chipIds: [], paletteId: "surprising", brandId: "brand-secondary" }, palettes, brands);
  const b = applyPickerDelta(AXES, palette, { chipIds: [], brandId: "brand-secondary", paletteId: "surprising" }, palettes, brands);
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
  // the usage's emitted colors, the brand row shows one swatch per option.
  // The composed mini component belongs to the shared live preview above
  // them, which is what the pick is judged on.
  const brandRow = dock.slice(
    dock.indexOf('data-testid="brand-row"'),
    dock.indexOf('data-testid="palette-row"'),
  );
  const paletteRow = dock.slice(dock.indexOf('data-testid="palette-row"'));
  assert.ok(paletteRow.includes("SwatchStrip"), "palette options are plain color strips");
  assert.ok(!paletteRow.includes("MiniSystemPreview"), "the palette row composes nothing");
  assert.ok(!brandRow.includes("MiniSystemPreview"), "the brand row composes nothing");
  assert.ok(brandRow.includes("backgroundColor: color.swatch"), "brand options are one swatch each");
  assert.ok(/>Brand</.test(dock), "brand section is labeled Brand");
  assert.ok(/>Palette</.test(dock), "palette section is labeled Palette");
  const mini = readFileSync(join(repoRoot, "apps", "web", "components", "mini-system-preview.tsx"), "utf8");
  for (const marker of ["Acme", "seat", "Reserve", "About Us", "Limited Time Deal", "20% off", "Check availability"]) {
    assert.ok(mini.includes(marker), `mini component shows ${marker} (wordmark, focal word, buttons, brand deal card)`);
  }
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
  assert.ok(dock.includes("onChange={() => setBrandColorId(color.id)}"), "brand pick moves local state only");
  assert.ok(dock.includes("onChange={() => setUsageId(option.id)}"), "palette row re-skins client-side");
  // Generating shows the shared full-screen loader, never the picker modal.
  assert.ok(dock.includes("GeneratingLoader"), "generating shows the shared loader");
  assert.ok(dock.includes('phase !== "generating"'), "picker modal stays closed while generating");
  const loader = readFileSync(join(repoRoot, "apps", "web", "components", "generating-loader.tsx"), "utf8");
  for (const marker of ["backdrop-blur", "ArcheLogo", "animate-[spin", "Generating"]) {
    assert.ok(loader.includes(marker), `shared loader shows ${marker}`);
  }
  assert.ok(loader.includes('role="status"'), "loader is announced as a status");
});

test("every brand option ships an AA-verified preview for every palette option", async () => {
  const palette = { primaryHue: 250, accentHue: 250, neutralHue: 250, brandHue: 5 };
  const palettes = derivePaletteOptions(palette);
  for (const brand of deriveBrandOptions(palette)) {
    for (const paletteOption of palettes) {
      const compiled = await compileBrand(`t-bp-matrix-${brand.id}-${paletteOption.id}`, paletteOption.anchors, brand);
      const ratio = contrastRatio(
        String(compiled.tokens.light["--brand-foreground"].$value),
        String(compiled.tokens.light["--brand"].$value),
      );
      assert.ok(ratio >= 4.5, `${brand.id} × ${paletteOption.id}: preview text passes AA`);
    }
  }
  console.log("brand × palette preview matrix: all pairings gated by AA");
});

// ---------------------------------------------------------------------------
// Static brand: five fixed colors; picking one rebuilds the palettes
// ---------------------------------------------------------------------------

test("the brand row is exactly five fixed colors, independent of any generation", () => {
  const colors = deriveBrandColors();
  assert.deepEqual(
    colors.map((color) => color.id),
    ["brand-crimson", "brand-amber", "brand-jade", "brand-azure", "brand-violet"],
    "five fixed options in wheel order",
  );
  assert.deepEqual(
    colors.map((color) => color.brandHue),
    [15, 55, 160, 225, 290],
    "the hues are fixed, never derived",
  );
  for (const color of colors) {
    assert.ok(color.name && !/^\d/.test(color.name), "fixed evocative name, never a bare hue");
  }
  assert.deepEqual(deriveBrandColors(), colors, "no palette in, same row out � independent by construction");
  assert.equal(resolveBrandColor("brand-jade")?.brandHue, 160, "known ids resolve");
  assert.equal(resolveBrandColor("tertiary"), undefined, "generation-derived ids no longer resolve");
  assert.equal(resolveBrandColor(undefined), undefined, "absent stays absent");
});

test("paletteFromBrand calculates the whole system from the single brand hue", () => {
  assert.deepEqual(
    paletteFromBrand(15),
    { primaryHue: 15, accentHue: 75, neutralHue: 15, brandHue: 15 },
    "primary/neutral/mark on the hue, accent a static +60� away",
  );
  assert.deepEqual(
    paletteFromBrand(330),
    { primaryHue: 330, accentHue: 30, neutralHue: 330, brandHue: 330 },
    "the accent wraps around the wheel",
  );
});

test("a picked brand color re-bases the anchors on its static palette", () => {
  const palette = { primaryHue: 250, accentHue: 250, neutralHue: 250, brandHue: 5 };
  const plain = applyPickerDelta(AXES, palette, { chipIds: [], paletteId: "as-dreamed" });
  assert.deepEqual(plain.anchors, palette, "no brand picked: the generation's own anchors stand");
  const based = applyPickerDelta(AXES, palette, {
    chipIds: [],
    paletteId: "as-dreamed",
    brandColorId: "brand-jade",
  });
  assert.deepEqual(
    based.anchors,
    { primaryHue: 160, accentHue: 220, neutralHue: 160, brandHue: 160 },
    "the brand color's static palette wins over the generation",
  );
  assert.deepEqual(based.axes, plain.axes, "the brand never touches the axes");
  // The usage still applies within the brand-derived system: tertiary pins
  // the mark to the static accent while the system stays on the brand hue.
  // (Callers pass usages derived from the same brand base — the service
  // re-derives them for finish and recompile, exactly like the preview.)
  const tertiary = applyPickerDelta(
    AXES,
    palette,
    {
      chipIds: [],
      paletteId: "as-dreamed",
      brandId: "brand-tertiary",
      brandColorId: "brand-jade",
    },
    derivePaletteOptions(palette),
    deriveBrandOptions(paletteFromBrand(160)),
  );
  assert.equal(tertiary.anchors.brandHue, 220, "usage pins the hue inside the brand palette");
  assert.equal(tertiary.anchors.primaryHue, 160, "the system stays on the brand hue");
  // An unknown brand id is ignored, never trusted.
  const bogus = applyPickerDelta(AXES, palette, {
    chipIds: [],
    paletteId: "as-dreamed",
    brandColorId: "not-a-color",
  });
  assert.deepEqual(bogus.anchors, palette, "unknown brand ids fall back to the generation");
});

test("the emitted mark follows the picked brand through the usage's voice", async () => {
  const palette = { primaryHue: 250, accentHue: 250, neutralHue: 250, brandHue: 5 };
  const brands = deriveBrandOptions(paletteFromBrand(160));
  const muted = brands.find((o) => o.id === "brand-secondary");
  const folded = applyPickerDelta(
    AXES,
    palette,
    { chipIds: [], paletteId: "as-dreamed", brandId: "brand-secondary", brandColorId: "brand-jade" },
    derivePaletteOptions(palette),
    brands,
  );
  const emitted = await compile("t-bp-brand-wins", folded.anchors, AXES, {
    brandChromaScale: muted.chromaScale,
  });
  assert.ok(
    hueDist(oklch(emitted.tokens.light["--brand"].$value).h, 160) <= 2,
    "the emitted hue is the picked brand color",
  );
  assert.ok(
    hueDist(oklch(emitted.tokens.light["--primary"].$value).h, 160) <= 2,
    "the system sits on the brand hue, not the generation's",
  );
});
