/**
 * Unit tests for the design-rules enforcement (Deliverable 2 + acceptance 1/5/6).
 * Every enforce-tier rule gets a pass case and a violation case naming the
 * rule id; scope (lint vs block), compiler repair, and type emission covered.
 * Usage: pnpm test:rules (builds first).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compileIdentity, compileValidIdentity } from "../dist/compiler.js";
import {
  assertGeneratedCompliant,
  buildTeachBlock,
  checkDesignRules,
  deriveTypeScale,
  designRulesVersion,
  loadDesignRules,
  teachStatements,
  validateIdentity,
  buildRegistry,
} from "../dist/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(root, "..", "..");
const readFixture = (file) => JSON.parse(readFileSync(join(repoRoot, "fixtures", file), "utf8"));

const color = (l, c, h) => ({ $type: "color", $value: `oklch(${l} ${c} ${h})` });
const withToken = (payload, mode, name, value) => {
  const next = JSON.parse(JSON.stringify(payload));
  next.tokens[mode][name] = value;
  return next;
};

const rulesFor = (payload) => checkDesignRules(payload).map((f) => f.rule);
const hasRule = (payload, rule) => rulesFor(payload).includes(rule);

test("teach block is registry-built and byte-stable", () => {
  const a = buildTeachBlock();
  assert.equal(a, buildTeachBlock(), "teach block must be byte-identical across builds");
  for (const rule of teachStatements()) {
    assert.ok(a.includes(`[${rule.id}]`), `teach block must contain [${rule.id}]`);
    assert.ok(a.includes(rule.statement), `teach block must contain the statement of ${rule.id}`);
  }
  assert.ok(a.includes(`v${designRulesVersion()}`), "teach block carries the rules version");
  assert.equal(
    new Set(loadDesignRules().rules.map((r) => r.id)).size,
    loadDesignRules().rules.length,
    "rule ids are unique",
  );
});

test("compiled payloads pass every enforce-tier check post-repair", async () => {
  const base = readFixture("identity.arche.json");
  const guardrails = { minContrast: "AA", respectReducedMotion: true };
  const cases = [
    { name: "balanced", profile: "standard", axes: { warmth: 0.5, energy: 0.5, playfulness: 0.5, sharpness: 0.5, density: 0.5, ornament: 0.5, retroFuturism: 0.2, formality: 0.4, material: "metal", motionFeel: "smooth", texture: "grain", ...guardrails }, palette: { primaryHue: 210, accentHue: 280, neutralHue: 220 } },
    { name: "ent", profile: "enterprise", axes: { warmth: 0.3, energy: 0.2, playfulness: 0.05, sharpness: 0.6, density: 0.45, ornament: 0.15, retroFuturism: 0, formality: 1, material: "flat", motionFeel: "stately", texture: "none", ...guardrails }, palette: { primaryHue: 220, accentHue: 30, neutralHue: 230 } },
    { name: "exp", profile: "expressive", axes: { warmth: 0.9, energy: 1, playfulness: 0.9, sharpness: 0.1, density: 0.2, ornament: 0.8, retroFuturism: 0.9, formality: 0, material: "clay", motionFeel: "bouncy", texture: "grain", ...guardrails }, palette: { primaryHue: 320, accentHue: 180, neutralHue: 40 } },
  ];
  for (const c of cases) {
    const compiled = await compileValidIdentity(
      { name: `t-${c.name}`, source: { type: "phrase", promptText: c.name }, axes: c.axes, palette: c.palette, profile: c.profile, base },
      validateIdentity,
    );
    assert.deepEqual(rulesFor(compiled), [], `${c.name}: no enforce findings post-repair`);
    assert.equal(compiled.dna.profile, c.profile, "profile recorded on the payload");
    assert.ok(typeof compiled.typeScale === "string", "typeScale stamped");
  }
});

test("repair records rule ids in meta.adjustments", () => {
  const base = readFixture("identity.arche.json");
  // Low-voice formal DNA: solids start under the 0.08 floor → repair raises them.
  const compiled = compileIdentity({
    name: "t-repair", source: { type: "manual" },
    axes: { warmth: 0.3, energy: 0.1, playfulness: 0.05, sharpness: 0.6, density: 0.45, ornament: 0.15, retroFuturism: 0, formality: 1, material: "flat", motionFeel: "stately", texture: "none", minContrast: "AA", respectReducedMotion: true },
    palette: { primaryHue: 220, accentHue: 220, neutralHue: 230 },
    profile: "standard", base,
  });
  const ids = new Set(compiled.meta.adjustments.map((a) => a.ruleId).filter(Boolean));
  assert.ok(ids.has("color-solid-chroma-band"), `expected a solid-band repair, got [${[...ids]}]`);
  // Sharp pixel DNA under expressive compiles to 3px border width (recorded, compliant).
  const sharp = compileIdentity({
    name: "t-borderwidth", source: { type: "manual" },
    axes: { warmth: 0.2, energy: 0.9, playfulness: 0.9, sharpness: 0.95, density: 0.6, ornament: 0.7, retroFuturism: 0.8, formality: 0.1, material: "pixel", motionFeel: "glitchy", texture: "scanlines", minContrast: "AA", respectReducedMotion: true },
    palette: { primaryHue: 300, accentHue: 100, neutralHue: 305 },
    profile: "expressive", base,
  });
  assert.equal(sharp.tokens.light["--border-width"].$value, "3px", "sharp pixel expressive DNA maps to 3px");
  assert.deepEqual(rulesFor(sharp), [], "3px expressive payload has no enforce findings");
  // Same DNA under enterprise caps at 1px.
  const sharpEnt = compileIdentity({
    name: "t-borderwidth-ent", source: { type: "manual" },
    axes: { warmth: 0.2, energy: 0.9, playfulness: 0.9, sharpness: 0.95, density: 0.6, ornament: 0.7, retroFuturism: 0.8, formality: 0.1, material: "pixel", motionFeel: "glitchy", texture: "scanlines", minContrast: "AA", respectReducedMotion: true },
    palette: { primaryHue: 300, accentHue: 100, neutralHue: 305 },
    profile: "enterprise", base,
  });
  assert.equal(sharpEnt.tokens.light["--border-width"].$value, "1px", "enterprise caps border width at 1px");
});

test("per-rule pass + violation cases", () => {
  const base = readFixture("identity.default.json");
  const ent = (p) => ({ ...p, dna: { ...p.dna, profile: "enterprise" } });

  // color-bg-chroma-cap
  assert.ok(!hasRule(base, "color-bg-chroma-cap"));
  assert.ok(hasRule(withToken(base, "light", "--background", color(0.9, 0.2, 220)), "color-bg-chroma-cap"));

  // color-text-chroma-cap
  assert.ok(!hasRule(base, "color-text-chroma-cap"));
  assert.ok(hasRule(withToken(base, "light", "--foreground", color(0.2, 0.25, 250)), "color-text-chroma-cap"));

  // color-border-chroma-cap
  assert.ok(!hasRule(base, "color-border-chroma-cap"));
  assert.ok(hasRule(withToken(base, "light", "--border", color(0.7, 0.2, 100)), "color-border-chroma-cap"));

  // color-solid-chroma-band (floor + ceiling)
  assert.ok(hasRule(withToken(base, "light", "--primary", color(0.6, 0.02, 220)), "color-solid-chroma-band"));
  assert.ok(hasRule(withToken(base, "light", "--primary", color(0.6, 0.3, 220)), "color-solid-chroma-band"));

  // color-chroma-taper
  assert.ok(hasRule(withToken(base, "light", "--card", color(0.99, 0.1, 220)), "color-chroma-taper"));

  // color-neutral-tint
  const tinted = withToken(withToken(base, "light", "--primary", color(0.6, 0.2, 20)), "light", "--background", color(0.95, 0.05, 200));
  assert.ok(hasRule(tinted, "color-neutral-tint"));

  // color-enterprise-accent (standard payload with far accent is fine; enterprise is not)
  const farAccent = withToken(withToken(base, "light", "--primary", color(0.6, 0.2, 20)), "light", "--accent", color(0.6, 0.2, 200));
  assert.ok(!hasRule({ ...farAccent, dna: { ...farAccent.dna, profile: "standard" } }, "color-enterprise-accent"));
  assert.ok(hasRule(ent(farAccent), "color-enterprise-accent"));

  // color-chart-separation (identical charts collide)
  const colliding = withToken(base, "light", "--chart-2", JSON.parse(JSON.stringify(base.tokens.light["--chart-1"])));
  assert.ok(hasRule(colliding, "color-chart-separation"));

  // type-scale-only (unknown id; enterprise + editorial)
  assert.ok(hasRule({ ...base, typeScale: "nope" }, "type-scale-only"));
  assert.ok(hasRule({ ...base, typeScale: "editorial-1.5", dna: { ...base.dna, profile: "enterprise" } }, "type-scale-only"));
  assert.ok(!hasRule(base, "type-scale-only"));

  // radius-profile-bounds
  assert.ok(!hasRule(base, "radius-profile-bounds"));
  assert.ok(hasRule(ent(withToken(base, "light", "--radius", { $type: "dimension", $value: "2rem" })), "radius-profile-bounds"));

  // border-width-profile-bounds (default fixture carries 1px: fine everywhere;
  // 2px violates enterprise only; out-of-set values fail at the contract)
  assert.ok(!hasRule(base, "border-width-profile-bounds"));
  const w2 = { $type: "dimension", $value: "2px" };
  assert.ok(hasRule(ent(withToken(base, "light", "--border-width", w2)), "border-width-profile-bounds"));
  assert.ok(!hasRule(withToken(base, "light", "--border-width", w2), "border-width-profile-bounds"));
  const w3exp = { ...withToken(base, "light", "--border-width", { $type: "dimension", $value: "3px" }) };
  w3exp.dna = { ...w3exp.dna, profile: "expressive" };
  assert.ok(!hasRule(w3exp, "border-width-profile-bounds"));
  const w4 = withToken(base, "light", "--border-width", { $type: "dimension", $value: "4px" });
  assert.equal(validateIdentity(w4).ok, false, "out-of-set border width fails the contract");

  // motion-bounds (duration + closed easing set)
  assert.ok(!hasRule(base, "motion-bounds"));
  const slow = withToken(base, "light", "--motion-normal", { $type: "motion", $value: { duration: "2000ms", easing: "cubic-bezier(0.4, 0, 0.2, 1)" } });
  assert.ok(hasRule(slow, "motion-bounds"));
  const odd = withToken(base, "light", "--motion-fast", { $type: "motion", $value: { duration: "150ms", easing: "ease" } });
  assert.ok(hasRule(odd, "motion-bounds"));
});

test("scope: hand-authored violations are lint, generated ones are blocked", () => {
  // --border carries no contrast pair: a chroma-only violation that leaves AA intact.
  const bad = withToken(readFixture("identity.default.json"), "light", "--border", color(0.7, 0.2, 100));
  delete bad.dna;
  const hand = validateIdentity(bad);
  assert.equal(hand.ok, true, "hand-authored payload is not blocked");
  assert.ok(hand.lint.some((i) => i.message.includes("color-border-chroma-cap")), "violation surfaces as lint");

  const generated = withToken(readFixture("identity.default.json"), "light", "--border", color(0.7, 0.2, 100));
  assert.throws(() => assertGeneratedCompliant(generated), /color-border-chroma-cap/, "strict gate names the rule");
});

test("type emission equals the derived steps; display cap holds", async () => {
  const { DISPLAY_CAP_ABSOLUTE_PX } = await import("../dist/index.js");
  assert.equal(DISPLAY_CAP_ABSOLUTE_PX, 96);
  for (const scale of ["compact-1.2", "standard-1.25", "expressive-1.333", "editorial-1.5"]) {
    for (const profile of ["enterprise", "standard", "expressive"]) {
      const derived = deriveTypeScale(scale, profile);
      assert.ok(derived.display.sizePx <= 96, `${scale}/${profile} display <= 96px`);
      assert.ok(derived.display.sizePx <= { enterprise: 48, standard: 64, expressive: 80 }[profile], `${scale}/${profile} profile multiple`);
    }
  }
  // Registry line heights sit inside the enforcement bands.
  const bands = { display: [1.0, 1.15], heading: [1.15, 1.3], body: [1.45, 1.65], label: [1.2, 1.4] };
  const { loadTypeScaleRegistry } = await import("@arche/foundation/typography");
  for (const entry of loadTypeScaleRegistry().scales) {
    for (const [group, [lo, hi]] of Object.entries(bands)) {
      const lh = entry.lineHeights[group];
      assert.ok(lh >= lo && lh <= hi, `${entry.id} ${group} line-height ${lh} in [${lo}, ${hi}]`);
    }
  }
  // End-to-end: theme item vars equal the derivation.
  const base = readFixture("identity.arche.json");
  const compiled = compileIdentity({
    name: "t-emit", source: { type: "manual" },
    axes: base.dna.axes, palette: base.dna.palette, profile: "standard", base,
  });
  const theme = JSON.parse(buildRegistry(compiled).get("theme"));
  const derived = deriveTypeScale(compiled.typeScale, "standard");
  assert.equal(theme.cssVars.theme["text-display"], `${derived.display.sizePx}px`);
  assert.equal(theme.cssVars.theme["text-body--line-height"], String(derived.body.lineHeight));
});
