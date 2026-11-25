/**
 * Brief #7 Deliverable 0 — verification suite: color design standards, enforced.
 *
 * Runs in CI (`pnpm test:verification`, builds first). Covers:
 *  1. Every contract contrast pair (text on bg, text on solid) meets WCAG AA
 *     in both modes, on all canonical fixtures AND 10 deterministic
 *     random-DNA compilations. Per-pair ratios are reported; any pair below
 *     AA fails the suite.
 *  2. Enforce-tier pass/fail per rule id across all fixtures (reported
 *     matrix; hand-authored findings stay lint, generated payloads must be
 *     clean post-repair).
 *  3. Clamp audit: every meta.adjustments entry on the 10 compilations is
 *     explainable — a design-repair entry carries its rule id, an AA-pass
 *     entry carries its pair and before/after ratios.
 *  4. Border audit (advisory): --border/--input on --background/--card ratios
 *     are computed and reported in both modes. Structural borders are
 *     intentionally subtle and are NOT gated at 3:1 — the report records the
 *     numbers instead of inventing a gate the design language cannot meet.
 *  5. Negative control: broken contrast must fail.
 *
 * Usage: pnpm test:verification (builds first).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contrastRatio } from "@arche-ui/foundation/contract/validate-tokens";
import { compileValidIdentity } from "../dist/compiler.js";
import {
  ART_DIRECTIONS,
  buildRegistry,
  checkDesignRules,
  getTokenContract,
  loadDesignRules,
  nameColor,
  runTasteSelfCheck,
  scoreSurprise,
  selectArtDirection,
  validateArtDirectionFonts,
  validateIdentity,
} from "../dist/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(root, "..", "..");
const readFixture = (file) => JSON.parse(readFileSync(join(repoRoot, "fixtures", file), "utf8"));

const FIXTURES = ["identity.default.json"];

const PAIRS = getTokenContract().contrastPairs;
const BORDER_AUDIT = [
  { fg: "--border", bg: "--background" },
  { fg: "--border", bg: "--card" },
  { fg: "--input", bg: "--background" },
  { fg: "--input", bg: "--card" },
];

const ratioOf = (identity, mode, fg, bg) =>
  contrastRatio(
    String(identity.tokens[mode]?.[fg]?.$value ?? ""),
    String(identity.tokens[mode]?.[bg]?.$value ?? ""),
  );

const GUARDRAILS = { minContrast: "AA", respectReducedMotion: true };
const MATERIALS = ["flat", "paper", "glass", "metal", "marble", "pixel", "clay"];
const MOTIONS = ["snappy", "smooth", "bouncy", "stately", "glitchy"];
const TEXTURES = ["none", "grain", "scanlines", "grid", "marble-vein", "halftone"];
const PROFILES = ["standard", "expressive", "enterprise"];

/** Deterministic PRNG (mulberry32) — the 10 DNA corners are reproducible. */
function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomDna(seed) {
  const rand = prng(seed);
  const axis = () => Math.round(rand() * 100) / 100;
  const pick = (list) => list[Math.floor(rand() * list.length)];
  return {
    axes: {
      warmth: axis(),
      energy: axis(),
      playfulness: axis(),
      sharpness: axis(),
      density: axis(),
      ornament: axis(),
      formality: axis(),
      chroma: axis(),
      material: pick(MATERIALS),
      motionFeel: pick(MOTIONS),
      texture: pick(TEXTURES),
      ...GUARDRAILS,
    },
    palette: {
      primaryHue: Math.floor(rand() * 360),
      accentHue: Math.floor(rand() * 360),
      neutralHue: Math.floor(rand() * 360),
    },
    profile: pick(PROFILES),
  };
}

test("contract pairs meet AA on every fixture, both modes (ratios reported)", () => {
  const minima = new Map();
  for (const file of FIXTURES) {
    const identity = readFixture(file);
    const result = validateIdentity(identity);
    assert.equal(result.ok, true, `${file} must validate (AA gate is absolute)`);
    for (const mode of ["light", "dark"]) {
      for (const pair of PAIRS) {
        const ratio = ratioOf(identity, mode, pair.fg, pair.bg);
        assert.ok(!Number.isNaN(ratio), `${file} ${mode} ${pair.fg}/${pair.bg} computable`);
        assert.ok(
          ratio >= pair.minRatio,
          `${file} ${mode} ${pair.fg} on ${pair.bg}: ${ratio} < AA ${pair.minRatio}`,
        );
        const key = `${mode} ${pair.fg}/${pair.bg}`;
        minima.set(key, Math.min(minima.get(key) ?? Infinity, ratio));
      }
    }
  }
  console.log("\nFixture AA minima (worst ratio across all fixtures, both modes):");
  for (const [key, min] of [...minima.entries()].sort()) {
    console.log(`  ${min}  ${key}`);
  }
});

test("10 random-DNA compilations: zero AA failures, zero enforce findings, clamps logged", async () => {
  const base = readFixture("identity.default.json");
  const minima = new Map();
  let totalAdjustments = 0;
  const clampRules = new Set();
  for (let i = 0; i < 10; i++) {
    const dna = randomDna(7000 + i);
    // compileValidIdentity throws on any AA/contract failure: a throw here IS
    // the suite catching a sub-AA generation (never saved as a draft).
    const compiled = await compileValidIdentity(
      {
        name: `verify-dna-${i}`,
        source: { type: "phrase", promptText: `verification corner ${i}` },
        axes: dna.axes,
        palette: dna.palette,
        profile: dna.profile,
        base,
      },
      validateIdentity,
    );
    const findings = checkDesignRules(compiled);
    assert.deepEqual(
      findings,
      [],
      `corner ${i} (${dna.profile}): no enforce findings post-repair, got ${JSON.stringify(findings)}`,
    );
    for (const mode of ["light", "dark"]) {
      for (const pair of PAIRS) {
        const ratio = ratioOf(compiled, mode, pair.fg, pair.bg);
        assert.ok(
          ratio >= pair.minRatio,
          `corner ${i} ${mode} ${pair.fg}/${pair.bg}: ${ratio} < AA ${pair.minRatio}`,
        );
        const key = `${mode} ${pair.fg}/${pair.bg}`;
        minima.set(key, Math.min(minima.get(key) ?? Infinity, ratio));
      }
    }
    const adjustments = compiled.meta.adjustments ?? [];
    totalAdjustments += adjustments.length;
    for (const entry of adjustments) {
      const isRepair = entry.ruleId !== undefined;
      const isAaPass = entry.pair !== undefined && entry.ratioBefore !== undefined;
      assert.ok(
        isRepair || isAaPass,
        `corner ${i} adjustment on ${entry.token} is unexplained: ${JSON.stringify(entry)}`,
      );
      if (isRepair) clampRules.add(entry.ruleId);
    }
  }
  console.log("\nRandom-DNA AA minima (worst ratio across 10 corners, both modes):");
  for (const [key, min] of [...minima.entries()].sort()) {
    console.log(`  ${min}  ${key}`);
  }
  console.log(`\nClamp audit: ${totalAdjustments} adjustments, rule ids seen: [${[...clampRules].sort()}]`);
});

test("enforce-tier pass/fail matrix per rule id across fixtures", () => {
  const ruleIds = loadDesignRules().rules.filter((r) => r.tier === "enforce").map((r) => r.id);
  const matrix = new Map(ruleIds.map((id) => [id, []]));
  for (const file of FIXTURES) {
    for (const finding of checkDesignRules(readFixture(file))) {
      matrix.get(finding.rule)?.push(`${file}:${finding.path}`);
    }
  }
  console.log("\nEnforce-tier matrix (hand-authored findings are lint, not failures):");
  for (const [id, hits] of matrix) {
    console.log(`  ${hits.length === 0 ? "PASS" : `lint×${hits.length}`}  ${id}${hits.length ? ` — ${hits.slice(0, 3).join(", ")}${hits.length > 3 ? "…" : ""}` : ""}`);
  }
});

test("border audit (advisory): structural border ratios reported, both modes", () => {
  const minima = new Map();
  for (const file of FIXTURES) {
    const identity = readFixture(file);
    for (const mode of ["light", "dark"]) {
      for (const { fg, bg } of BORDER_AUDIT) {
        const ratio = ratioOf(identity, mode, fg, bg);
        assert.ok(!Number.isNaN(ratio), `${file} ${mode} ${fg}/${bg} computable`);
        const key = `${mode} ${fg}/${bg}`;
        minima.set(key, Math.min(minima.get(key) ?? Infinity, ratio));
      }
    }
  }
  console.log("\nBorder audit minima (advisory — structural borders are intentionally subtle):");
  for (const [key, min] of [...minima.entries()].sort()) {
    console.log(`  ${min}  ${key}${min < 3 ? "  ← under 3:1" : ""}`);
  }
});

test("registry theme emission derives live vars from tokens", () => {
  const theme = JSON.parse(buildRegistry(readFixture("identity.default.json")).get("theme"));
  // Radius scale derives from the base token (shadcn convention, no radius-xs).
  assert.equal(theme.cssVars.theme["radius-lg"], "var(--radius)");
  assert.equal(theme.cssVars.theme["radius-md"], "calc(var(--radius) - 2px)");
  assert.equal(theme.cssVars.theme["radius-sm"], "calc(var(--radius) - 4px)");
  assert.equal(theme.cssVars.theme["radius-xl"], "calc(var(--radius) + 4px)");
  // Motion pairs emit the exact names the component templates consume
  // (var(--motion-<pace>-<field>); a doubled dash broke every dialog).
  // (sync-theme prefixes `--` on write, so theme.css carries --motion-*.)
  const base = theme.css?.["@layer base"]?.[":root"] ?? {};
  assert.equal(base["motion-fast-duration"], "150ms");
  assert.equal(base["motion-normal-easing"], "cubic-bezier(0.4, 0, 0.2, 1)");
  assert.ok(
    !Object.keys(base).some((name) => name.startsWith("-")),
    `no dashed motion keys (the writer owns the dashes): ${Object.keys(base).join(", ")}`,
  );
});

test("taste system: 8 art directions, valid font pairs, deterministic selection", () => {
  assert.equal(ART_DIRECTIONS.length, 8);
  assert.equal(
    new Set(ART_DIRECTIONS.map((d) => d.id)).size,
    8,
    "direction ids are unique (registry order is the deterministic tiebreak)",
  );
  assert.deepEqual(validateArtDirectionFonts(), [], "every direction pair resolves to slotted registry fonts");
  const formal = {
    warmth: 0.2, energy: 0.3, playfulness: 0.1, sharpness: 0.5, density: 0.9,
    ornament: 0.2, formality: 0.9,
    material: "flat", motionFeel: "stately", texture: "none",
    minContrast: "AA", respectReducedMotion: true,
  };
  assert.equal(selectArtDirection(formal, "enterprise").id, "boardroom-red");
  const pixel = { ...formal, formality: 0.2, material: "pixel", motionFeel: "glitchy" };
  assert.equal(selectArtDirection(pixel, "standard").id, "crt-hardware");
  const again = selectArtDirection(formal, "enterprise");
  assert.equal(again.id, "boardroom-red", "selection is deterministic");
  assert.ok(again.reason.length > 0, "selection records a reason");
});

test("taste system: surprise bands + evocative names are deterministic", () => {
  assert.deepEqual(scoreSurprise({ primaryHue: 210, accentHue: 210, neutralHue: 0 }, "standard"), {
    score: 0,
    band: "predictable",
    hueDistance: 0,
  });
  const surprising = scoreSurprise({ primaryHue: 210, accentHue: 30, neutralHue: 0 }, "standard");
  assert.equal(surprising.band, "surprising");
  assert.deepEqual(scoreSurprise({ primaryHue: 0, accentHue: 120, neutralHue: 0 }, "enterprise"), {
    score: 0,
    band: "monochrome-by-design",
    hueDistance: 0,
  });
  assert.equal(nameColor("oklch(0.7 0.2 350)"), "Sakura Pink");
  assert.equal(nameColor("oklch(0.7 0.2 95)"), "Neon Pear");
  assert.equal(nameColor("oklch(0.985 0.002 17.5)"), "Paper White");
  assert.equal(nameColor("transparent"), "Unnamed");
});

test("taste system: every compilation stamps direction, names, placement, self-check", async () => {
  const base = readFixture("identity.default.json");
  for (let seed = 1; seed <= 10; seed++) {
    const { axes, palette, profile } = randomDna(seed);
    const compiled = await compileValidIdentity(
      { name: `taste-${seed}`, source: { type: "fixture" }, axes, palette, profile, base },
      validateIdentity,
    );
    const taste = compiled.meta.taste;
    assert.ok(taste?.artDirection?.id, `seed ${seed}: direction selected`);
    assert.ok(
      ART_DIRECTIONS.some((d) => d.id === taste.artDirection.id),
      `seed ${seed}: direction is a registry entry`,
    );
    assert.equal(taste.palette.length, 7, `seed ${seed}: seven named colors (Brand Token brief adds Brand)`);
    assert.ok(
      taste.palette.some((entry) => entry.role === "brand" && entry.token === "--brand"),
      `seed ${seed}: the plan names the brand role, not a second primary`,
    );
    for (const entry of taste.palette) {
      assert.ok(entry.name && entry.name !== "Unnamed", `seed ${seed}: every role named`);
    }
    assert.deepEqual(taste.accentPlacement, ["primary-cta", "focal-word"]);
    assert.ok(["pass", "revised"].includes(compiled.meta.selfCheck?.verdict), `seed ${seed}: self-check verdict`);
  }
});

test("taste self-check runs in fix order with page-only tells deferred", () => {
  const identity = readFixture("identity.default.json");
  const check = runTasteSelfCheck({
    tokens: identity.tokens,
    axes: identity.dna.axes,
    profile: "standard",
    primaryHue: identity.dna.palette.primaryHue,
    accentHue: identity.dna.palette.accentHue,
    typeScale: identity.typeScale,
  });
  assert.deepEqual(
    check.steps.map((s) => s.order),
    [1, 2, 3, 4, 5, 6],
    "fix order: layout, contrast, typography, spacing, accent, decoration",
  );
  assert.ok(check.pendingPageChecks.includes("slop-hero-viewport"), "page tells deferred to D3");
  assert.ok(check.notes.length <= 500, "notes fit the model self-check schema");
});

test("negative control: broken contrast fails validation", () => {
  const broken = JSON.parse(JSON.stringify(readFixture("identity.default.json")));
  broken.tokens.light["--primary-foreground"] = broken.tokens.light["--primary"];
  broken.tokens.dark["--primary-foreground"] = broken.tokens.dark["--primary"];
  const result = validateIdentity(broken);
  assert.equal(result.ok, false, "broken contrast must fail");
  assert.ok(
    result.issues.some((i) => /contrast/i.test(i.message)),
    "the broken payload must fail on a contrast pair",
  );
});
