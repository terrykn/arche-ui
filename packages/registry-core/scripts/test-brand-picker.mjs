/* global console */
/**
 * Acceptance battery for the palette + brand picker (3 palette + up to 5
 * brand options on one step).
 *
 * Deterministic: no model calls. The model is replaced by hand-authored DNA +
 * palette anchors, and the code path under test is schema → derive options →
 * fold the selection → compile → validate, with the network stubbed out.
 *
 * Covers: the brand row's option types and their reasons, the
 * distinctness/dedup gate (ΔH ≥ 30° OR ΔE₀₀ ≥ 15 OR ΔL ≥ 0.15), the
 * Verizon-style red-brand/ink-primary case, the monochrome collapse (C = 0,
 * no pink), enterprise brand exemption from the accent-collapse rule, AA on
 * every shown brand option in both modes (measured on emitted tokens), the
 * recorded draft fields, and the zero-model-call / determinism contract.
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
  deriveBrandOptions,
  derivePaletteOptions,
  validateIdentity,
} = require("./dist/index.js");
const { compileValidIdentity } = require("./dist/compiler.js");

const base = JSON.parse(readFileSync(join(repoRoot, "fixtures", "identity.arche.json"), "utf8"));
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

// ---------------------------------------------------------------------------
// 1. Row shape: three palettes, up to five brand options, all from one set
// ---------------------------------------------------------------------------

test("palette row keeps its 3 options; brand row offers 1–5, all hue-only", () => {
  const palette = { primaryHue: 250, accentHue: 250, neutralHue: 250, brandHue: 5 };
  const palettes = derivePaletteOptions(palette);
  assert.equal(palettes.length, 3, "palette row is unchanged: exactly 3 options");
  const brands = deriveBrandOptions(palette);
  assert.ok(brands.length >= 1 && brands.length <= 5, `brand row is 1–5 options (got ${brands.length})`);
  assert.equal(brands[0].id, "as-dreamed");
  assert.equal(brands[0].brandHue, 5, "As Generated is the model's own brandHue, untouched");
  for (const option of brands) {
    assert.ok(option.name && option.name !== String(option.brandHue), "evocative name, never a bare hue");
    assert.ok(option.roleLabel && option.roleLabel.length > 0, "each option carries its role label");
    assert.ok(option.reason.length > 0, "each option records its reason");
    assert.ok(option.brandHue >= 0 && option.brandHue <= 360, "hue in range");
  }
  // The palette row's own anchors are never mutated by brand derivation.
  assert.deepEqual(palettes[0].anchors, { ...palette });
});

test("both rows differ only in the brand hue: the brand row never re-tints the system", async () => {
  const palette = { primaryHue: 250, accentHue: 250, neutralHue: 250, brandHue: 5 };
  const palettes = derivePaletteOptions(palette);
  const brands = deriveBrandOptions(palette);
  const chosenPalette = palettes.find((o) => o.id === "quiet-ground");
  const result = await compile("t-bp-brand-only", {
    ...chosenPalette.anchors,
    brandHue: brands[brands.length - 1].brandHue,
  });
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
// 2. Distinctness gate + dedup (ΔH, ΔE₀₀, ΔL)
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

test("verizon-style: red brand, ink primary, bold alternative distinct from both", async () => {
  // 'bold red brand, black action buttons'
  const palette = { primaryHue: 250, accentHue: 250, neutralHue: 250, brandHue: 5 };
  const brands = deriveBrandOptions(palette);
  const dreamed = brands.find((o) => o.id === "as-dreamed");
  const primary = brands.find((o) => o.id === "brand-primary");
  const bold = brands.find((o) => o.id === "bold-alternative");
  assert.ok(dreamed && primary && bold, "the three named choices ship");
  assert.equal(brands.length, 5, "the verizon case offers all five brand colors");
  assert.equal(dreamed.brandHue, 5, "As Generated is the red brand");
  assert.equal(primary.brandHue, 250, "Brand = Primary is the ink/primary hue");
  assert.ok(hueDist(bold.brandHue, 5) >= 30, "bold is distinct from the dreamed brand");
  assert.ok(hueDist(bold.brandHue, 250) >= 30, "bold clears the gate against primary");
  assert.ok(["bold-accentHue", "bold-rotated-60", "bold-rotated-120"].includes(bold.reason));
  // Emitted values agree with the choices, and each ships AA in both modes.
  for (const option of brands) {
    const compiled = await compile(`t-bp-verizon-${option.id}`, {
      ...palette,
      brandHue: option.brandHue,
    });
    const set = compiled.tokens.light;
    assert.ok(hueDist(oklch(set["--brand"].$value).h, option.brandHue) <= 2, `${option.id}: emitted brand hue`);
    assert.ok(hueDist(oklch(set["--primary"].$value).h, 250) <= 2, `${option.id}: primary stays the ink hue`);
    for (const mode of ["light", "dark"]) {
      const tokens = compiled.tokens[mode];
      const ratio = contrastRatio(String(tokens["--brand-foreground"].$value), String(tokens["--brand"].$value));
      assert.ok(ratio >= 4.5, `${option.id} ${mode}: brand text passes AA (${ratio.toFixed(2)})`);
    }
  }
});

test("dedup: a generation whose brand sits on primary shows 4 brand options", () => {
  const brands = deriveBrandOptions({ primaryHue: 210, accentHue: 20, neutralHue: 210, brandHue: 214 });
  assert.equal(brands.length, 4, "Brand = Primary is hidden instead of shown identical");
  assert.ok(!brands.some((o) => o.id === "brand-primary"), "no duplicate of As Generated");
  const hues = brands.map((o) => o.brandHue);
  assert.equal(new Set(hues).size, hues.length, "no two options share a hue");
});

test("bold falls back to +60 then +120 when the accent collapses onto primary", () => {
  // Accent 10° is inside 30° of primary 0°, dreamed+60 lands exactly on
  // primary, so only dreamed+120 clears the gate.
  const brands = deriveBrandOptions({ primaryHue: 0, accentHue: 10, neutralHue: 0, brandHue: 300 });
  const bold = brands.find((o) => o.id === "bold-alternative");
  assert.ok(bold, "a bold option still ships");
  assert.equal(bold.reason, "bold-rotated-120");
  assert.equal(bold.brandHue, 60);
  // Accent clear of primary is used directly.
  const accentWins = deriveBrandOptions({ primaryHue: 210, accentHue: 100, neutralHue: 210, brandHue: 210 });
  const accentBold = accentWins.find((o) => o.id === "bold-alternative");
  assert.equal(accentBold.reason, "bold-accentHue");
  assert.equal(accentBold.brandHue, 100);
});

// ---------------------------------------------------------------------------
// 3. Monochrome: every option is C = 0, no pink
// ---------------------------------------------------------------------------

test("monochrome brief: every brand option emits C = 0 and the hues collapse", async () => {
  const palette = { primaryHue: 220, accentHue: 222, neutralHue: 221, brandHue: 0 };
  const constraints = { chromaCap: 0.02, hueSpreadMax: 10 };
  const brands = deriveBrandOptions(palette, { achromatic: true });
  assert.equal(brands.length, 1, "hue-only options collapse to one gray: only As Generated ships");
  for (const option of brands) {
    const compiled = await compile(
      `t-bp-mono-${option.id}`,
      { ...palette, brandHue: option.brandHue },
      { ...AXES, chroma: 0.8 },
      { constraints },
    );
    for (const mode of ["light", "dark"]) {
      for (const token of ["--brand", "--brand-foreground", "--brand-soft"]) {
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
// 4. Enterprise: brand stays exempt from the accent-collapse rule
// ---------------------------------------------------------------------------

test("enterprise: brand keeps its own hue while the accent collapses to primary", async () => {
  const enterpriseAxes = { ...AXES, formality: 0.85, chroma: 0.3 };
  const palette = { primaryHue: 250, accentHue: 200, neutralHue: 250, brandHue: 5 };
  const brands = deriveBrandOptions(palette, { profile: "enterprise" });
  const bold = brands.find((o) => o.id === "bold-alternative");
  assert.ok(bold, "enterprise still offers a bold mark");
  assert.ok(bold.reason !== "bold-accentHue", "enterprise has no accent family to borrow from");
  for (const option of brands) {
    const compiled = await compile(
      `t-bp-enterprise-${option.id}`,
      { ...palette, brandHue: option.brandHue },
      enterpriseAxes,
    );
    assert.equal(compiled.dna.profile, "enterprise");
    const brand = oklch(compiled.tokens.light["--brand"].$value);
    const accent = oklch(compiled.tokens.light["--accent"].$value);
    const primary = oklch(compiled.tokens.light["--primary"].$value);
    // The brand is exempt from the accent-collapse rule: it keeps the chosen
    // hue exactly (Brand = Primary is the one option that lands on primary).
    assert.ok(hueDist(brand.h, option.brandHue) <= 2, `${option.id}: the brand hue is used exactly as chosen`);
    if (option.id !== "brand-primary") {
      assert.ok(hueDist(brand.h, primary.h) > 25, `${option.id}: the brand is not collapsed into primary`);
    }
    assert.ok(hueDist(accent.h, primary.h) <= 1, `${option.id}: the accent family is collapsed`);
  }
});

// ---------------------------------------------------------------------------
// 5. AA across a hue sweep, measured on emitted tokens (both modes)
// ---------------------------------------------------------------------------

test("every shown brand option passes 4.5:1 for its foreground, light and dark", async () => {
  for (const hue of [0, 25, 55, 100, 120, 180, 210, 250, 300, 340]) {
    const palette = { primaryHue: (hue + 140) % 360, accentHue: (hue + 200) % 360, neutralHue: 220, brandHue: hue };
    for (const option of deriveBrandOptions(palette)) {
      const compiled = await compile(`t-bp-aa-${hue}-${option.id}`, { ...palette, brandHue: option.brandHue });
      for (const mode of ["light", "dark"]) {
        const tokens = compiled.tokens[mode];
        const solidPair = contrastRatio(
          String(tokens["--brand-foreground"].$value),
          String(tokens["--brand"].$value),
        );
        const softPair = contrastRatio(
          String(tokens["--foreground"].$value),
          String(tokens["--brand-soft"].$value),
        );
        assert.ok(solidPair >= 4.5, `hue ${hue} ${option.id} ${mode}: solid pair ${solidPair.toFixed(2)}`);
        assert.ok(softPair >= 4.5, `hue ${hue} ${option.id} ${mode}: soft pair ${softPair.toFixed(2)}`);
      }
    }
  }
});

// ---------------------------------------------------------------------------
// 6. Recording + determinism + zero model calls
// ---------------------------------------------------------------------------

test("the draft records both choices, the resulting brand hue and each reason", async () => {
  const palette = { primaryHue: 250, accentHue: 250, neutralHue: 250, brandHue: 5 };
  const palettes = derivePaletteOptions(palette);
  const brands = deriveBrandOptions(palette);
  const paletteChoice = palettes.find((o) => o.id === "quiet-ground");
  const brandChoice = brands.find((o) => o.id === "brand-primary");
  const applied = applyPickerDelta(
    AXES,
    palette,
    { chipIds: [], paletteId: paletteChoice.id, brandId: brandChoice.id },
    palettes,
    brands,
  );
  assert.equal(applied.anchors.brandHue, brandChoice.brandHue, "brand row owns brandHue alone");
  assert.equal(applied.anchors.primaryHue, paletteChoice.anchors.primaryHue, "palette row owns the system");
  const compiled = await compile("t-bp-record", applied.anchors, { ...AXES, ...applied.axes });
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
  assert.equal(record.brandReason, "brand-equals-primary");
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
  const a = applyPickerDelta(AXES, palette, { chipIds: [], paletteId: "surprising", brandId: "bold-alternative" }, palettes, brands);
  const b = applyPickerDelta(AXES, palette, { chipIds: [], brandId: "bold-alternative", paletteId: "surprising" }, palettes, brands);
  assert.deepEqual(a, b);
});

// ---------------------------------------------------------------------------
// 7. Step UI: one step, two rows, one shared live preview
// ---------------------------------------------------------------------------

test("the picker step renders both rows on one screen under one live preview", () => {
  const dock = readFileSync(join(repoRoot, "apps", "web", "app", "dashboard", "creation-dock.tsx"), "utf8");
  assert.ok(dock.includes('data-testid="live-preview"'), "one shared live preview");
  assert.ok(dock.includes('data-testid="brand-row"'), "row 1: brand");
  assert.ok(dock.includes('data-testid="palette-row"'), "row 2: palette");
  assert.ok(
    dock.indexOf('data-testid="brand-row"') < dock.indexOf('data-testid="palette-row"'),
    "the brand section renders before the palette section",
  );
  assert.equal(
    (dock.match(/<MiniSystemPreview/g) ?? []).length >= 1,
    true,
    "the shared live preview uses the mini component",
  );
  assert.ok(
    dock.includes('data-testid="palette-swatches"'),
    "the palette row previews plain color swatches, not the composed UI",
  );
  assert.ok(
    dock.includes('data-testid="brand-swatch"'),
    "the brand row previews its single brand color",
  );
  assert.ok(/>Brand</.test(dock), "row 1 is labeled Brand");
  assert.ok(/>Palette</.test(dock), "row 2 is labeled Palette");
  const mini = readFileSync(join(repoRoot, "apps", "web", "components", "mini-system-preview.tsx"), "utf8");
  for (const marker of ["Acme", "seat", "Reserve", "About Us", "Limited Time Deal", "20% off", "Check availability"]) {
    assert.ok(mini.includes(marker), `mini component shows ${marker} (wordmark, focal word, buttons, brand deal card)`);
  }
  assert.ok(!mini.includes(">New<"), "mini component has no New badge");
  assert.ok(!mini.includes("preview-role-key"), "mini component does not list a color key");
  // Selecting in either row only moves local state: no action round-trip.
  assert.ok(dock.includes("onChange={() => setPaletteId(option.id)}"), "palette row re-skins client-side");
  assert.ok(dock.includes("onChange={() => setBrandId(option.id)}"), "brand row re-skins client-side");
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
      const compiled = await compile(`t-bp-matrix-${brand.id}-${paletteOption.id}`, {
        ...paletteOption.anchors,
        brandHue: brand.brandHue,
      });
      const ratio = contrastRatio(
        String(compiled.tokens.light["--brand-foreground"].$value),
        String(compiled.tokens.light["--brand"].$value),
      );
      assert.ok(ratio >= 4.5, `${brand.id} × ${paletteOption.id}: preview text passes AA`);
    }
  }
  console.log("brand × palette preview matrix: all pairings gated by AA");
});
