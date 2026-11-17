/**
 * @arche/registry-core — builds a deterministic shadcn-compatible registry from
 * an Arche identity (tokens + per-component knob selections).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { foundationDir, getBlockManifests } from "./manifests.js";
import { validateTokens, type IdentityTokens } from "@arche/foundation/contract/validate-tokens";
import {
  fontEntriesById,
  validateFontSelection,
  type ArcheIdentityFonts,
} from "@arche/foundation/fonts";
import { validateIconSelection } from "@arche/foundation/icons";
import { dnaSectionSchema, type DnaSection } from "@arche/foundation/dna";
import tokenContract from "@arche/foundation/contract/token-contract.json" with { type: "json" };

const contractData = tokenContract as unknown as {
  contractVersion: number;
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type { Manifest } from "./manifests.js";
export { getManifests, getBlockManifests, getCatalogManifests, getTokenContract } from "./manifests.js";

export type { ArcheIdentityFonts } from "@arche/foundation/fonts";
export type { DnaSection, DnaAxes, DnaEnums, DnaObject, DnaPalette, DnaDelta, DnaSource, ModelOutput, ModelDeltaOutput, GenerationProfile, PaletteVariant, TypefaceVariant } from "@arche/foundation/dna";
export { dnaSectionSchema, dnaDeltaSchema, dnaObjectSchema, dnaPaletteSchema, generationProfileSchema, deriveProfile, migrateDnaAxes, resolveBrandHue, withBrandDefault, modelOutputSchema, modelDeltaOutputSchema, paletteVariantSchema, typefaceVariantSchema, DNA_COMPILER_VERSION } from "@arche/foundation/dna";
export {
  normalizePaletteVariants,
  normalizeTypefaceVariants,
  typefaceSpec,
  assertTypefaceOverride,
  fontChoiceBlock,
  type TypefaceSpec,
  type TypefaceOptionSpec,
} from "./variants.js";
export { checkDesignRules, assertGeneratedCompliant, CLOSED_EASINGS, type DesignRuleFinding } from "./design-rules.js";
export {
  parseConstraints,
  describeConstraints,
  constraintSlots,
  enforceConstraints,
  verifyAdherence,
  retrieveExemplars,
  keywordTableVersion,
  loadKeywordTable,
  loadCorpus,
  corpusVersion,
  type PromptConstraints,
  type AdherenceReport,
  type CorpusEntry,
  type EnforcementAdjustment,
} from "./prompt-adherence.js";
export { buildPresentation, type PresentationBlock, type PresentationMotion, type PresentationContext, type TasteSummary } from "./presentation.js";
export { GENRE_BLUEPRINTS, getGenreBlueprints, type GenreBlueprint, type GenreId } from "./genres.js";
export {
  applyPickerDelta,
  derivePaletteOptions,
  EXAMPLE_RECORDS,
  WORD_CHIPS,
  type DnaAxisKey,
  type ExampleRecord,
  type PaletteOption,
  type PickerApplied,
  type PickerSelections,
  type WordChip,
} from "./picker.js";
export {
  NEUTRAL_CONTEXT,
  nextVariantAxes,
  rankedVariants,
  selectVariants,
  type AxisSource,
  type BlockVariantSelection,
  type ContentSignals,
  type MediaSignal,
  type RankedVariant,
  type ResolvedContent,
  type SelectorContext,
  type SelectorDna,
} from "./selector.js";
export {
  ART_DIRECTIONS,
  ACCENT_PLACEMENT,
  circularHueDistance,
  nameColor,
  NAMED_ROLES,
  runTasteSelfCheck,
  scoreSurprise,
  selectArtDirection,
  validateArtDirectionFonts,
  type ArtDirection,
  type DirectionSelection,
  type NamedColor,
  type SurpriseScore,
  type TasteSelfCheck,
} from "@arche/foundation/taste";
export {
  buildTeachBlock,
  designRulesVersion,
  teachStatements,
  loadDesignRules,
} from "@arche/foundation/design-rules";
export { deriveTypeScale, DISPLAY_CAP_BY_PROFILE, DISPLAY_CAP_ABSOLUTE_PX, TYPE_ROLES, type GenerationProfile as TypeProfile } from "@arche/foundation/typography";

export interface ArcheIdentity {
  meta: { name: string; contractVersion: number } & Record<string, unknown>;
  tokens: IdentityTokens;
  components: Record<string, Record<string, unknown>>;
  /** Closed-registry font ids, one per slot. */
  fonts: ArcheIdentityFonts;
  /** Closed-registry icon library id (exactly one per identity). */
  icons: string;
  /**
   * Closed-registry type-scale id. Optional so older hand-authored payloads
   * still parse (missing/unknown ids surface as design-rule lint, not a
   * contract failure); the compiler always stamps it on generated payloads.
   */
  typeScale?: string;
  /**
   * Design DNA (Brief #6). Optional: older payloads without it remain valid;
   * required for generated identities. Descriptive metadata only — the
   * compiler never reads hand-authored token sets from it.
   */
  dna?: DnaSection;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  /**
   * Design-rule findings for hand-authored payloads: informational only,
   * never affect `ok` (scope decision — hand authors are not blocked).
   * Generated payloads are held to these strictly at generation + publish.
   */
  lint: ValidationIssue[];
}

// ---------------------------------------------------------------------------
// Identity validation (contract + manifest surfaces)
// ---------------------------------------------------------------------------

const identitySchema = z.object({
  meta: z.object({
    name: z.string().min(1),
    contractVersion: z.number(),
  }),
  tokens: z.unknown(),
  components: z.record(z.string(), z.record(z.string(), z.unknown())),
  fonts: z.object({
    sans: z.string().min(1),
    display: z.string().min(1),
    mono: z.string().min(1),
  }),
  icons: z.string().min(1),
  typeScale: z.string().min(1).optional(),
  dna: dnaSectionSchema.optional(),
});

/**
 * Validates the identity's closed-registry selections: fonts (unknown ids,
 * role violations, sans weight floor, token-stack coherence) and the single
 * icon library (unknown id, per-slot coverage across every registered library).
 */
function validateRegistries(identity: ArcheIdentity, issues: ValidationIssue[]): void {
  const stacks: { sans?: string; display?: string; mono?: string } = {};
  const light = identity.tokens?.light ?? {};
  for (const [slot, token] of [
    ["sans", "--font-sans"],
    ["display", "--font-display"],
    ["mono", "--font-mono"],
  ] as const) {
    const value = (light[token] as { $value?: unknown } | undefined)?.$value;
    if (typeof value === "string") {
      stacks[slot] = value;
    }
  }
  for (const issue of validateFontSelection(identity.fonts, stacks)) {
    issues.push(issue);
  }
  for (const issue of validateIconSelection(identity.icons)) {
    issues.push(issue);
  }
}

import type { Manifest } from "./manifests.js";
import { getManifests } from "./manifests.js";
import { checkDesignRules } from "./design-rules.js";
import {
  deriveTypeScale,
  TYPE_ROLES,
  type GenerationProfile as TypographyProfile,
} from "@arche/foundation/typography";

const MANIFESTS: Manifest[] = getManifests();
const BLOCK_MANIFESTS: Manifest[] = getBlockManifests();

/** Names shared by manifest knobs and their cva implementation axes. */
const KNOB_TO_AXIS: Record<string, string> = {
  defaultVariant: "variant",
  defaultSize: "size",
  radiusFrom: "radius",
};

function findKnobSpec(
  manifest: Manifest,
  knobName: string,
): { spec: Record<string, unknown>; slot: string } | null {
  for (const [slot, surface] of Object.entries(manifest.styleSurface)) {
    if (knobName in surface) {
      return { slot, spec: surface[knobName]! };
    }
  }
  return null;
}

function validateKnob(
  manifest: Manifest,
  knobName: string,
  spec: Record<string, unknown>,
  rawValue: unknown,
  issues: ValidationIssue[],
): void {
  const type = spec.type as string;
  if (type === "enum") {
    const values = (spec.values ?? []) as Array<string | number>;
    if (!values.includes(rawValue as string | number)) {
      issues.push({
        path: `components.${manifest.name}.${knobName}`,
        message: `knob '${knobName}' of component '${manifest.name}' is set to ${JSON.stringify(rawValue)}, which is not a declared value of [${values.map(String).join(", ")}]`,
      });
    }
    return;
  }
  if (type === "token") {
    const values = (spec.values ?? spec.scale ?? []) as string[];
    if (values.length > 0 && !values.includes(rawValue as string)) {
      issues.push({
        path: `components.${manifest.name}.${knobName}`,
        message: `knob '${knobName}' of component '${manifest.name}' is not declared: token ${JSON.stringify(rawValue)} not in [${values.join(", ")}]`,
      });
    }
    return;
  }
  if (type === "range") {
    const [min, max] = (spec.values ?? []) as number[];
    if (
      typeof rawValue !== "number" ||
      min === undefined ||
      max === undefined ||
      rawValue < min ||
      rawValue > max
    ) {
      issues.push({
        path: `components.${manifest.name}.${knobName}`,
        message: `knob '${knobName}' of component '${manifest.name}' must be a number within [${min}, ${max}], got ${JSON.stringify(rawValue)}`,
      });
    }
    return;
  }
  issues.push({
    path: `components.${manifest.name}.${knobName}`,
    message: `knob '${knobName}' of component '${manifest.name}' declares unsupported surface type '${type}'`,
  });
}

/**
 * Validates an identity against the token contract and per-component manifests.
 * Reports undeclared knobs and failing contrast pairs by name. Design-rule
 * findings are appended as non-blocking `lint` (hand authors are informed,
 * not blocked — generated payloads face the strict gate elsewhere).
 */
export function validateIdentity(identity: ArcheIdentity): ValidationResult {
  const issues: ValidationIssue[] = [];

  const parsed = identitySchema.safeParse(identity);
  if (!parsed.success) {
    issues.push({
      path: "identity",
      message: `payload malformed: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`,
    });
    return { ok: false, issues, lint: [] };
  }
  if (identity.meta.contractVersion !== contractData.contractVersion) {
    issues.push({
      path: "meta.contractVersion",
      message: `identity targets contract version ${JSON.stringify(identity.meta.contractVersion)}, foundation pins ${contractData.contractVersion}`,
    });
  }

  issues.push(...validateTokens(identity.tokens).issues);

  validateRegistries(identity, issues);

  const manifestNames = new Set(MANIFESTS.map((manifest) => manifest.name));
  for (const name of Object.keys(identity.components)) {
    if (!manifestNames.has(name)) {
      issues.push({ path: `components.${name}`, message: `component '${name}' is not declared in the catalog` });
    }
  }

  for (const manifest of MANIFESTS) {
    const selections = identity.components[manifest.name];
    if (selections === undefined) {
      issues.push({
        path: `components.${manifest.name}`,
        message: `component '${manifest.name}' is missing knob selections`,
      });
      continue;
    }
    const chosenAxes = new Map<string, { name: string; value: unknown }>();
    for (const [knobName, knobValue] of Object.entries(selections)) {
      const axis = KNOB_TO_AXIS[knobName] ?? knobName;
      const existing = chosenAxes.get(axis);
      if (existing && existing.value !== knobValue) {
        issues.push({ path: `components.${manifest.name}.${knobName}`, message: `selection conflicts with '${existing.name}' for axis '${axis}'` });
      } else {
        chosenAxes.set(axis, { name: knobName, value: knobValue });
      }
      // An axis name is always declared; its value must be one of the values.
      // Knobs that are not axis names resolve against the style surface below.
      if (manifest.axes[knobName]) {
        const values = manifest.axes[knobName].values;
        if (!values.includes(knobValue as string | number)) {
          issues.push({
            path: `components.${manifest.name}.${knobName}`,
            message: `knob '${knobName}' of component '${manifest.name}' is set to ${JSON.stringify(knobValue)}, not a declared axis value of [${values.map(String).join(", ")}]`,
          });
        }
        continue;
      }
      const found = findKnobSpec(manifest, knobName);
      if (!found) {
        issues.push({
          path: `components.${manifest.name}.${knobName}`,
          message: `knob '${knobName}' of component '${manifest.name}' is not declared in the manifest; the closed style surface does not allow it`,
        });
        continue;
      }
      validateKnob(manifest, knobName, found.spec, knobValue, issues);
    }
  }

  const lint: ValidationIssue[] = checkDesignRules(identity).map((finding) => ({
    path: finding.path,
    message: `[${finding.rule}] ${finding.message}`,
  }));

  return { ok: issues.length === 0, issues, lint };
}

// ---------------------------------------------------------------------------
// Deterministic stable serialization
// ---------------------------------------------------------------------------

export function serializeStable(value: unknown): string {
  const sorted = (input: unknown): unknown => {
    if (input === null || typeof input !== "object") {
      return input;
    }
    if (Array.isArray(input)) {
      return input.map(sorted);
    }
    const record = input as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      output[key] = sorted(record[key]);
    }
    return output;
  };
  return JSON.stringify(sorted(value), null, 2) + "\n";
}

// ---------------------------------------------------------------------------
// cva defaultVariants stamping
// ---------------------------------------------------------------------------

function formatTsValue(value: unknown): string {
  if (typeof value === "string") {
    return `"${value}"`;
  }
  return JSON.stringify(value);
}

export function stampDefaultVariants(
  source: string,
  cvaName: string,
  overrides: Record<string, unknown>,
): string {
  const marker = `const ${cvaName} = cva(`;
  const cvaStart = source.indexOf(marker);
  if (cvaStart === -1) {
    throw new Error(`template does not declare ${cvaName}`);
  }
  const defIdx = source.indexOf("defaultVariants: {", cvaStart);
  if (defIdx === -1) {
    throw new Error(`cannot locate defaultVariants for ${cvaName}`);
  }
  const openBrace = source.indexOf("{", defIdx);
  let depth = 0;
  let end = -1;
  for (let i = openBrace; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) {
    throw new Error(`unbalanced braces in defaultVariants for ${cvaName}`);
  }
  const bodyText = source.slice(openBrace + 1, end);
  const existing = new Map<string, string>();
  for (const match of bodyText.matchAll(
    /(\w+):\s*("(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?|true|false|undefined)\s*,?/g,
  )) {
    existing.set(match[1]!, match[2]!);
  }

  // Template defaults are the base; identity selections override them.
  // Key order follows the template so emitted output is stable.
  const keys = [...existing.keys()];
  for (const key of Object.keys(overrides)) {
    if (!existing.has(key)) {
      keys.push(key);
    }
  }
  const lines = keys.map((key) => {
    const value = key in overrides
      ? formatTsValue(overrides[key])
      : existing.get(key)!;
    return `      ${key}: ${value},`;
  });
  const replacement = `defaultVariants: {\n${lines.join("\n")}\n    }`;
  return source.slice(0, defIdx) + replacement + source.slice(end + 1);
}

// ---------------------------------------------------------------------------
// Emission
// ---------------------------------------------------------------------------

function readTemplate(fileName: string): string {
  return readFileSync(join(foundationDir, "src", "templates", fileName), "utf8");
}

function readBlockTemplate(fileName: string): string {
  return readFileSync(join(foundationDir, "src", "blocks", fileName), "utf8");
}

function readUtils(): string {
  return readFileSync(
    join(foundationDir, "src", "templates", "lib", "utils.ts"),
    "utf8",
  );
}

const HEX_COLOR_VARS = [
  "background",
  "card",
  "popover",
  "foreground",
  "card-foreground",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "muted",
  "muted-foreground",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  // Brand Token brief: the brand family resolves to bg-brand,
  // text-brand-foreground, and bg-brand-soft utilities in consumers.
  "brand",
  "brand-foreground",
  "brand-soft",
];

interface ThemeEmission {
  cssVarsLight: Record<string, string>;
  cssVarsDark: Record<string, string>;
  themeVars: Record<string, string>;
  css: NonNullable<Record<string, unknown>>;
}

function emitTheme(identity: ArcheIdentity): ThemeEmission {
  const cssVarsLight: Record<string, string> = {};
  const cssVarsDark: Record<string, string> = {};
  const derivedRoot: Record<string, string> = {};
  const derivedTheme: Record<string, string> = {};

  for (const [modeName, cssVars] of [
    ["light", cssVarsLight],
    ["dark", cssVarsDark],
  ] as const) {
    for (const [tokenName, token] of Object.entries(identity.tokens[modeName] ?? {})) {
      const varName = tokenName.startsWith("--") ? tokenName.slice(2) : tokenName;
      if (tokenName.startsWith("--motion")) {
        // motion tokens are duration + easing pairs; derived vars are emitted
        // once (root scope) and referenced by template classes as
        // var(--motion-<pace>-<field> — strip the token dashes so the sync
        // script's `--` prefix lands on the exact consumed name.
        if (modeName === "light") {
          const value = token.$value as Record<string, string>;
          for (const [key, item] of Object.entries(value ?? {})) {
            derivedRoot[`${tokenName.replace(/^--/, "")}-${key}`] = String(item);
          }
        }
        continue;
      }
      cssVars[varName] = String(token.$value);
    }
  }

  // radius scale derived at emission (contract: only the base --radius is a token)
  // convention matches shadcn's default mapping exactly; no radius-xs (Tailwind v4's built-in xs is left untouched)
  const themeVars: Record<string, string> = {
    "radius-sm": "calc(var(--radius) - 4px)",
    "radius-md": "calc(var(--radius) - 2px)",
    "radius-lg": "var(--radius)",
    "radius-xl": "calc(var(--radius) + 4px)",
  };
  // Type scale derived at emission (Deliverable 5): the AI selects the scale
  // id only; every --text-* step is derived (base * ratio^n per role) with
  // the entry's line-height and letter-spacing per role as Tailwind v4 vars.
  const profile = (identity.dna as { profile?: unknown } | undefined)?.profile;
  const typeProfile: TypographyProfile =
    profile === "enterprise" || profile === "expressive" ? profile : "standard";
  if (typeof identity.typeScale === "string") {
    const derived = deriveTypeScale(identity.typeScale, typeProfile);
    for (const role of TYPE_ROLES) {
      const step = derived[role];
      themeVars[`text-${role}`] = `${step.sizePx}px`;
      themeVars[`text-${role}--line-height`] = String(step.lineHeight);
      themeVars[`tracking-${role}`] = step.letterSpacing;
    }
  }
  for (const colorVar of HEX_COLOR_VARS) {
    themeVars[`color-${colorVar}`] = `var(--${colorVar})`;
  }

  // No Google Fonts @import is ever emitted into CSS (it broke the Turbopack
  // build once: @import must lead the entry stylesheet). Fonts load via
  // registry:font items (next/font/google) or the fontsource npm package.
  const css: Record<string, unknown> = {
    "@layer base": {
      ":root": derivedRoot,
    },
  };

  return {
    cssVarsLight,
    cssVarsDark,
    themeVars,
    css,
  };
}

export function buildRegistry(identity: ArcheIdentity): Map<string, string> {
  const validation = validateIdentity(identity);
  if (!validation.ok) {
    throw new Error(
      `identity validation failed:\n${validation.issues.map((issue) => `- ${issue.path}: ${issue.message}`).join("\n")}`,
    );
  }

  const items = new Map<string, string>();

  // ---- utils ----
  items.set(
    "utils",
    serializeStable({
      name: "utils",
      type: "registry:lib",
      title: "Arche UI utilities",
      description: "cn() class-merging helper shared by all Arche components.",
      dependencies: ["clsx", "tailwind-merge"],
      registryDependencies: [],
      files: [
        {
          path: "lib/utils.ts",
          target: "lib/utils.ts",
          type: "registry:lib",
          content: readUtils(),
        },
      ],
    }),
  );

  // ---- theme ----
  const theme = emitTheme(identity);
  items.set(
    "theme",
    serializeStable({
      name: "theme",
      type: "registry:theme",
      title: `Arche theme · ${identity.meta.name}`,
      description:
        "DTCG token set compiled to CSS variables (light + dark) with Tailwind v4 theme mapping.",
      dependencies: [],
      registryDependencies: [],
      cssVars: {
        theme: theme.themeVars,
        light: theme.cssVarsLight,
        dark: theme.cssVarsDark,
      },
      css: theme.css,
    }),
  );

  // ---- fonts ----
  // One registry:font item per unique family across the three slots (sans,
  // display, mono). Google families load through next/font/google. Fontshare
  // families load only through the official Fontshare CSS API. The font
  // item's variable is the first slot using it.
  const byId = fontEntriesById();
  const fontItemNames: string[] = [];
  const seenFamilies = new Set<string>();
  const slotVars = { sans: "--font-sans", display: "--font-display", mono: "--font-mono" } as const;
  for (const slot of ["sans", "display", "mono"] as const) {
    const entry = byId.get(identity.fonts[slot])!;
    if (seenFamilies.has(entry.family)) {
      continue;
    }
    seenFamilies.add(entry.family);
    const itemName = `font-${entry.id}`;
    fontItemNames.push(itemName);
    const loading =
      entry.loading.kind === "google"
        ? {
            family: entry.family,
            provider: "google" as const,
            import: entry.loading.import,
            variable: slotVars[slot],
            weight: entry.weights.map(String),
            subsets: entry.loading.subsets,
          }
        : {
            family: entry.family,
            provider: "fontshare" as const,
            variable: slotVars[slot],
            weight: entry.weights.map(String),
            subsets: ["latin"],
            stylesheet: entry.loading.css,
          };
    const description =
      entry.loading.kind === "google"
        ? `Webfont loading for the ${slot} slot of ${identity.meta.name} through next/font/google.`
        : `Webfont loading for the ${slot} slot of ${identity.meta.name} through the official Fontshare CSS API.`;
    items.set(
      itemName,
      serializeStable({
        name: itemName,
        type: "registry:font",
        title: `Arche font · ${entry.family}`,
        description,
        dependencies: [],
        registryDependencies: [],
        font: loading,
      }),
    );
  }

  // ---- base ----
  // registry:base items are the only items allowed to carry iconLibrary, so
  // the identity's icon choice is pinned here for install tooling.
  items.set(
    "base",
    serializeStable({
      name: "base",
      type: "registry:base",
      title: `Arche UI · ${identity.meta.name} (base)`,
      description: `Base configuration for ${identity.meta.name}: pins iconLibrary "${identity.icons}".`,
      iconLibrary: identity.icons,
    }),
  );

  // ---- components ----
  for (const manifest of MANIFESTS) {
    const templateFile = manifest.files[0]!.source.split("/").at(-1)!;
    let content = readTemplate(templateFile);
    // Shadcn installs target lib/utils.ts; templates import it relatively so the
    // workspace package compiles on its own.
    content = content.replace('from "./lib/utils.js"', 'from "@/lib/utils"');
    const selections = identity.components[manifest.name] ?? {};
    const applied = new Set<string>();
    const cvas = [...content.matchAll(/const\s+(\w+)\s*=\s*cva\s*\(/g)];
    for (let index = cvas.length - 1; index >= 0; index--) {
      const match = cvas[index]!;
      const start = match.index!;
      const end = cvas[index + 1]?.index ?? content.length;
      const block = content.slice(start, end);
      const defaults = block.match(/defaultVariants\s*:\s*\{([^}]*)\}/)?.[1] ?? "";
      const overrides: Record<string, unknown> = {};
      for (const [knob, value] of Object.entries(selections)) {
        const axis = KNOB_TO_AXIS[knob] ?? knob;
        if (new RegExp(`\\b${axis}\\s*:`).test(defaults)) {
          overrides[axis] = value;
          applied.add(knob);
        }
      }
      content = stampDefaultVariants(content, match[1]!, overrides);
    }
    for (const name of Object.keys(selections)) {
      if (!applied.has(name)) throw new Error(`${manifest.name}: selection '${name}' cannot be stamped`);
    }

    items.set(
      manifest.name,
      serializeStable({
        name: manifest.name,
        type: "registry:ui",
        title: manifest.title,
        description: manifest.description,
        dependencies: manifest.dependencies,
        // Spec 7.7c: canonical plain-name form, copied verbatim.
        registryDependencies: [...manifest.registryDependencies],
        files: manifest.files.map((file) => ({
          path: file.source,
          target: file.target,
          type: file.type,
          content,
        })),
      }),
    );
  }

  // ---- blocks (Part 6): one registry:block item per block manifest. Blocks
  // compose catalog components, so their files land under components/blocks
  // and their component deps resolve from the same registry.
  for (const manifest of BLOCK_MANIFESTS) {
    const templateFile = manifest.files[0]!.source.split("/").at(-1)!;
    let content = readBlockTemplate(templateFile);
    // Same rewrites as components, plus catalog-component import relocation:
    // foundation cross-imports become the installed @/components/ui paths.
    content = content
      .replace('from "../templates/lib/utils.js"', 'from "@/lib/utils"')
      .replace(/from "\.\.\/templates\/([a-z-]+)\.js"/g, 'from "@/components/ui/$1"');
    items.set(
      manifest.name,
      serializeStable({
        name: manifest.name,
        type: "registry:block",
        title: manifest.title,
        description: manifest.description,
        dependencies: manifest.dependencies,
        registryDependencies: ["utils", ...manifest.registryDependencies.filter((dep) => dep !== "utils")],
        files: manifest.files.map((file) => ({
          path: file.source,
          target: file.target,
          type: file.type,
          content,
        })),
      }),
    );
  }

  // ---- all ----
  items.set(
    "all",
    serializeStable({
      name: "all",
      type: "registry:style",
      title: `Arche UI · ${identity.meta.name} (everything)`,
      description: "All registry items of this identity in one install.",
      // `all` has no manifest; its deps must be namespaced so the CLI resolves
      // them from this registry. Bare names would resolve to the official
      // shadcn registry (spec conflict vs 7.7c plain-name form, see report).
      registryDependencies: [
        ...MANIFESTS.map((manifest) => manifest.name),
        ...BLOCK_MANIFESTS.map((manifest) => manifest.name),
        "utils",
        "theme",
        "base",
        ...fontItemNames,
      ].map((name) => `@arche/${name}`),
      files: [],
    }),
  );

  return items;
}
