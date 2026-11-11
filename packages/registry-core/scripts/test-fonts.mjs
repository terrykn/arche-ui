/**
 * Acceptance tests for Arche Font Registry v2 and typography pairing.
 * Covers the closed 29-font registry, role/weight/italic restrictions,
 * incompatible pairings, generator pairing, Fontshare loading, and the
 * Satoshi application pairing.
 * Usage: pnpm test:fonts (builds first).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compileIdentity } from "../dist/compiler.js";
import {
  buildRegistry,
  validateIdentity,
} from "../dist/index.js";
import {
  expectedFontStack,
  fontCssUrl,
  fontEntriesById,
  fontSupportsWeight,
  identityFontStylesheets,
  loadFontRegistry,
  validateFontPairing,
  validateFontSelection,
  validateRequestedFontUsage,
} from "@arche/foundation/fonts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(root, "..", "..");
const readFixture = (file) => JSON.parse(readFileSync(join(repoRoot, "fixtures", file), "utf8"));
const readApp = (file) => readFileSync(join(repoRoot, "apps", "web", file), "utf8");
const base = readFixture("identity.arche.json");
const guardrails = { minContrast: "AA", respectReducedMotion: true };
const byId = fontEntriesById();

const selectionStacks = (selection) => ({
  sans: expectedFontStack(byId.get(selection.sans), "sans"),
  display: expectedFontStack(byId.get(selection.display), "display"),
  mono: expectedFontStack(byId.get(selection.mono), "mono"),
});

test("registry contains exactly the 29 specified fonts", () => {
  const registry = loadFontRegistry();
  const expected = [
    "satoshi",
    "general-sans",
    "cabinet-grotesk",
    "switzer",
    "clash-grotesk",
    "author",
    "ranade",
    "chillax",
    "excon",
    "zodiak",
    "sentient",
    "bespoke-serif",
    "clash-display",
    "pally",
    "pencerio",
    "comico",
    "melodrama",
    "space-grotesk",
    "montserrat",
    "work-sans",
    "be-vietnam-pro",
    "poppins",
    "outfit",
    "public-sans",
    "epilogue",
    "archivo",
    "manrope",
    "geist-mono",
    "jetbrains-mono",
  ];
  assert.deepEqual(
    registry.fonts.map((font) => font.id).sort(),
    [...expected].sort(),
    "Font Registry v2 must contain exactly the 29 specified fonts",
  );
  assert.equal(registry.registryVersion, 2);
});

test("slot permissions, display-only status, and sources match the specification", () => {
  const allowedSlots = {
    satoshi: ["body", "display"],
    "general-sans": ["body", "display"],
    "cabinet-grotesk": ["body", "display"],
    switzer: ["body", "display"],
    "clash-grotesk": ["body", "display"],
    author: ["body"],
    ranade: ["body", "display"],
    chillax: ["body", "display"],
    excon: ["display"],
    zodiak: ["body", "display"],
    sentient: ["body", "display"],
    "bespoke-serif": ["body", "display"],
    "clash-display": ["display"],
    pally: ["display"],
    pencerio: ["display"],
    comico: ["display"],
    melodrama: ["display"],
    "space-grotesk": ["body", "display"],
    montserrat: ["body", "display"],
    "work-sans": ["body"],
    "be-vietnam-pro": ["body"],
    poppins: ["body", "display"],
    outfit: ["body", "display"],
    "public-sans": ["body"],
    epilogue: ["body", "display"],
    archivo: ["body", "display"],
    manrope: ["body", "display"],
    "geist-mono": ["mono"],
    "jetbrains-mono": ["mono"],
  };
  const displayOnly = new Set(["excon", "clash-display", "pally", "pencerio", "comico", "melodrama"]);
  const fontshare = new Set([
    "satoshi",
    "general-sans",
    "cabinet-grotesk",
    "switzer",
    "clash-grotesk",
    "author",
    "ranade",
    "chillax",
    "excon",
    "zodiak",
    "sentient",
    "bespoke-serif",
    "clash-display",
    "pally",
    "pencerio",
    "comico",
    "melodrama",
  ]);
  for (const [id, slots] of Object.entries(allowedSlots)) {
    const entry = byId.get(id);
    assert.deepEqual(entry.slots, slots, `${id} allowed slots`);
    assert.equal(entry.displayOnly, displayOnly.has(id), `${id} display-only status`);
    assert.equal(entry.source, fontshare.has(id) ? "fontshare" : "google", `${id} source`);
    assert.equal(entry.roles.includes("display"), slots.includes("display"), `${id} legacy display role`);
    assert.equal(entry.roles.includes("sans"), slots.includes("body"), `${id} legacy body role`);
    assert.equal(entry.roles.includes("mono"), slots.includes("mono"), `${id} legacy mono role`);
  }
});

test("verified weights and italics are recorded, including limited display faces", () => {
  const pencerio = byId.get("pencerio");
  assert.deepEqual(pencerio.weights, [50], "Pencerio has one verified Hairline style");
  assert.equal(pencerio.italics, false);
  assert.equal(pencerio.variable, false);
  assert.equal(fontSupportsWeight(pencerio, 50), true);
  assert.equal(fontSupportsWeight(pencerio, 400), false);

  const melodrama = byId.get("melodrama");
  assert.deepEqual(melodrama.weights, [300, 400, 500, 600, 700]);
  assert.equal(melodrama.italics, false);

  assert.equal(byId.get("space-grotesk").italics, false);
  assert.equal(byId.get("outfit").italics, false);
  assert.equal(byId.get("manrope").italics, false);
  assert.equal(byId.get("geist-mono").italics, false);
  assert.equal(byId.get("jetbrains-mono").italics, true);
  assert.equal(byId.get("be-vietnam-pro").variable, false);
  assert.equal(byId.get("poppins").variable, false);
  assert.equal(byId.get("cabinet-grotesk").italics, false);
  assert.equal(byId.get("satoshi").italics, true);
});

test("Fontshare entries load only through the official CSS API", () => {
  for (const entry of loadFontRegistry().fonts) {
    if (entry.source !== "fontshare") continue;
    assert.equal(entry.loading.kind, "fontshare");
    assert.match(entry.loading.css, /^https:\/\/api\.fontshare\.com\/v2\/css\?/);
    assert.ok(!entry.loading.css.includes("cdn.fontsource"), "Fontshare CSS must not use vendored files");
    assert.equal(fontCssUrl(entry), entry.loading.css);
  }
  assert.equal(
    fontCssUrl(byId.get("cabinet-grotesk")),
    "https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@1&display=swap",
  );
  assert.equal(
    fontCssUrl(byId.get("satoshi")),
    "https://api.fontshare.com/v2/css?f[]=satoshi@1,2&display=swap",
  );
  assert.equal(fontCssUrl(byId.get("space-grotesk")), null);
});

test("Google entries load only through next/font/google", () => {
  const imports = {
    "space-grotesk": "Space_Grotesk",
    montserrat: "Montserrat",
    "work-sans": "Work_Sans",
    "be-vietnam-pro": "Be_Vietnam_Pro",
    poppins: "Poppins",
    outfit: "Outfit",
    "public-sans": "Public_Sans",
    epilogue: "Epilogue",
    archivo: "Archivo",
    manrope: "Manrope",
    "geist-mono": "Geist_Mono",
    "jetbrains-mono": "JetBrains_Mono",
  };
  for (const [id, name] of Object.entries(imports)) {
    const entry = byId.get(id);
    assert.equal(entry.loading.kind, "google");
    assert.equal(entry.loading.import, name);
  }
});

test("validator rejects unknown, display-only, unavailable, raw, and incompatible fonts", () => {
  const good = { sans: "satoshi", display: "cabinet-grotesk", mono: "geist-mono" };
  assert.deepEqual(validateFontSelection(good, selectionStacks(good)), []);

  const unknown = { ...good, display: "inter" };
  assert.ok(
    validateFontSelection(unknown, selectionStacks(good)).some((issue) => issue.message.includes("not in the closed font registry")),
    "legacy Inter is rejected",
  );

  const displayOnlyBody = { sans: "excon", display: "cabinet-grotesk", mono: "geist-mono" };
  assert.ok(
    validateFontSelection(displayOnlyBody, selectionStacks({ sans: "satoshi", display: "cabinet-grotesk", mono: "geist-mono" })).some((issue) =>
      issue.message.includes("display-only"),
    ),
    "display-only fonts are rejected for body text",
  );

  const raw = { ...good };
  const rawStacks = { ...selectionStacks(good), sans: "Arial, sans-serif" };
  assert.ok(
    validateFontSelection(raw, rawStacks).some((issue) => issue.message.includes("raw font stack")),
    "raw stacks are rejected",
  );

  assert.ok(
    validateRequestedFontUsage(byId.get("pencerio"), "display", { weights: [400] }).length > 0,
    "Pencerio does not offer weight 400",
  );
  assert.ok(
    validateRequestedFontUsage(byId.get("cabinet-grotesk"), "display", { italic: true }).length > 0,
    "Cabinet Grotesk does not offer italics",
  );
  assert.deepEqual(validateRequestedFontUsage(byId.get("satoshi"), "sans", { weights: [600], italic: true }), []);

  const neutralMismatch = {
    sans: "satoshi",
    display: "space-grotesk",
    mono: "geist-mono",
  };
  assert.ok(
    validateFontSelection(neutralMismatch, selectionStacks(neutralMismatch)).some((issue) =>
      issue.message.includes("distinct neutral grotesques"),
    ),
    "unregistered similar neutral grotesques are rejected",
  );
  const expressiveMismatch = {
    sans: "chillax",
    display: "excon",
    mono: "geist-mono",
  };
  const expressiveStacks = {
    sans: expectedFontStack(byId.get("chillax"), "sans"),
    display: expectedFontStack(byId.get("excon"), "display"),
    mono: expectedFontStack(byId.get("geist-mono"), "mono"),
  };
  assert.ok(
    validateFontSelection(expressiveMismatch, expressiveStacks).some((issue) =>
      issue.message.includes("unrelated expressive display faces"),
    ),
    "two unrelated expressive display faces are rejected",
  );
});

test("all nine recommended pairs validate", () => {
  for (const [display, body] of loadFontRegistry().pairing.recommended) {
    assert.deepEqual(validateFontPairing(byId.get(display), byId.get(body)), [], `${display} + ${body}`);
    const selection = { sans: body, display, mono: "geist-mono" };
    assert.deepEqual(validateFontSelection(selection, selectionStacks(selection)), [], `${display} + ${body} selection`);
  }
});

test("generator selects only registry pairs and keeps type scale separate", () => {
  const cases = [
    {
      name: "pixel",
      axes: { warmth: 0.5, energy: 0.9, playfulness: 0.9, sharpness: 0.7, density: 0.5, ornament: 0.5, retroFuturism: 0.8, formality: 0.1, material: "pixel", motionFeel: "smooth", texture: "none", ...guardrails },
      palette: { primaryHue: 300, accentHue: 100, neutralHue: 305 },
      profile: "expressive",
      expected: { sans: "general-sans", display: "clash-display", mono: "geist-mono" },
    },
    {
      name: "formal",
      axes: { warmth: 0.3, energy: 0.2, playfulness: 0.05, sharpness: 0.6, density: 0.45, ornament: 0.15, retroFuturism: 0, formality: 0.8, material: "flat", motionFeel: "stately", texture: "none", ...guardrails },
      palette: { primaryHue: 220, accentHue: 30, neutralHue: 230 },
      profile: "standard",
      expected: { sans: "switzer", display: "zodiak", mono: "jetbrains-mono" },
    },
    {
      name: "warm",
      axes: { warmth: 0.85, energy: 0.4, playfulness: 0.3, sharpness: 0.3, density: 0.5, ornament: 0.3, retroFuturism: 0.1, formality: 0.3, material: "clay", motionFeel: "smooth", texture: "grain", ...guardrails },
      palette: { primaryHue: 25, accentHue: 45, neutralHue: 60 },
      profile: "standard",
      expected: { sans: "cabinet-grotesk", display: "sentient", mono: "jetbrains-mono" },
    },
    {
      name: "neutral",
      axes: { warmth: 0.5, energy: 0.5, playfulness: 0.3, sharpness: 0.5, density: 0.5, ornament: 0.2, retroFuturism: 0.1, formality: 0.4, material: "flat", motionFeel: "smooth", texture: "none", ...guardrails },
      palette: { primaryHue: 0, accentHue: 0, neutralHue: 0 },
      profile: "standard",
      expected: { sans: "satoshi", display: "satoshi", mono: "geist-mono" },
    },
  ];
  for (const example of cases) {
    const compiled = compileIdentity({ name: example.name, source: { type: "phrase", promptText: example.name }, axes: example.axes, palette: example.palette, profile: example.profile, base });
    assert.deepEqual(compiled.fonts, example.expected);
    assert.equal(validateIdentity(compiled).ok, true, `${example.name} pairing validates`);
    assert.ok(typeof compiled.typeScale === "string" && compiled.typeScale.length > 0, "type scale remains separately selected");
  }
});

test("registry items use the correct provider and stylesheet or next/font import", () => {
  const hospital = compileIdentity({
    name: "zodiak-check",
    source: { type: "manual" },
    axes: { warmth: 0.3, energy: 0.2, playfulness: 0.05, sharpness: 0.6, density: 0.45, ornament: 0.15, retroFuturism: 0, formality: 0.8, material: "flat", motionFeel: "stately", texture: "none", ...guardrails },
    palette: { primaryHue: 220, accentHue: 30, neutralHue: 230 },
    profile: "standard",
    base,
  });
  const items = buildRegistry(hospital);
  const displayItem = JSON.parse(items.get("font-zodiak"));
  assert.equal(displayItem.font.provider, "fontshare");
  assert.equal(displayItem.font.stylesheet, "https://api.fontshare.com/v2/css?f[]=zodiak@1,2&display=swap");
  assert.equal(displayItem.font.import, undefined);
  const bodyItem = JSON.parse(items.get("font-switzer"));
  assert.equal(bodyItem.font.provider, "fontshare");
  assert.equal(bodyItem.font.stylesheet, "https://api.fontshare.com/v2/css?f[]=switzer@1,2&display=swap");

  const neutral = compileIdentity({
    name: "satoshi-check",
    source: { type: "manual" },
    axes: { warmth: 0.5, energy: 0.5, playfulness: 0.3, sharpness: 0.5, density: 0.5, ornament: 0.2, retroFuturism: 0.1, formality: 0.4, material: "flat", motionFeel: "smooth", texture: "none", ...guardrails },
    palette: { primaryHue: 0, accentHue: 0, neutralHue: 0 },
    profile: "standard",
    base,
  });
  const monoItem = JSON.parse(buildRegistry(neutral).get("font-geist-mono"));
  assert.equal(monoItem.font.provider, "google");
  assert.equal(monoItem.font.import, "Geist_Mono");
  assert.equal(monoItem.font.stylesheet, undefined);
});

test("Arche application uses Satoshi for display and body and loads Fontshare from the root layout", () => {
  const app = readFixture("identity.arche.json");
  assert.deepEqual(app.fonts, { sans: "satoshi", display: "satoshi", mono: "jetbrains-mono" });
  assert.equal(app.tokens.light["--font-display"].$value, expectedFontStack(byId.get("satoshi"), "display"));
  assert.equal(app.tokens.light["--font-sans"].$value, expectedFontStack(byId.get("satoshi"), "sans"));
  assert.deepEqual(validateFontSelection(app.fonts, {
    sans: app.tokens.light["--font-sans"].$value,
    display: app.tokens.light["--font-display"].$value,
    mono: app.tokens.light["--font-mono"].$value,
  }), []);

  const layout = readApp("app/layout.tsx");
  assert.ok(layout.includes("https://api.fontshare.com/v2/css?f[]=satoshi@1,2&display=swap"));
  assert.ok(!layout.includes("cabinet-grotesk"), "the application no longer loads Cabinet Grotesk");
  assert.ok(!readApp("app/theme.css").includes("Cabinet Grotesk"), "the application display token is not Cabinet Grotesk");
  assert.ok(!layout.includes("cdn.fontshare.com/wf/"), "the application must not vendor Fontshare files");

  const generated = readApp("app/fonts.generated.ts");
  assert.ok(generated.includes('export const fontSans = { variable: "--font-sans" } as const;'));
  // Satoshi fills both slots, so the generator aliases display to the same loader.
  assert.ok(
    generated.includes('export const fontDisplay = { variable: "--font-display" } as const;') ||
      generated.includes("export const fontDisplay = fontSans;"),
    "display slot is bound to the Satoshi loader",
  );
  assert.ok(generated.includes('import { JetBrains_Mono } from "next/font/google";'));
  assert.ok(!generated.includes("@import"), "Google Fonts must not load through CSS @import");
  assert.deepEqual(identityFontStylesheets(app.fonts), [
    "https://api.fontshare.com/v2/css?f[]=satoshi@1,2&display=swap",
  ]);
  const googleGenerated = readApp("app/google-fonts.generated.ts");
  for (const name of [
    "Archivo",
    "Be_Vietnam_Pro",
    "Epilogue",
    "Geist_Mono",
    "JetBrains_Mono",
    "Manrope",
    "Montserrat",
    "Outfit",
    "Poppins",
    "Public_Sans",
    "Space_Grotesk",
    "Work_Sans",
  ]) {
    assert.ok(googleGenerated.includes(name), `all Google families load through next/font (${name})`);
  }
  assert.ok(googleGenerated.includes("export const googleFontVariables"));
  assert.ok(layout.includes("googleFontVariables"), "the root layout applies every Google registry family");
  for (const page of [
    "app/kitchen-sink/page.tsx",
    "app/preview/[name]/page.tsx",
    "app/p/[user]/[identity]/page.tsx",
    "app/dashboard/identities/[id]/edit/editor.tsx",
  ]) {
    assert.ok(readApp(page).includes("<IdentityFontLinks"), `${page} loads its identity fonts`);
  }
});
