/**
 * @arche/registry-core — builds a deterministic shadcn-compatible registry from
 * an Arche identity (tokens + per-component knob selections).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { validateTokens, type IdentityTokens } from "@arche/foundation/contract/validate-tokens";
import tokenContract from "@arche/foundation/contract/token-contract.json" with { type: "json" };

const contractData = tokenContract as unknown as {
  contractVersion: number;
};

// Foundation is located without require.resolve (bundlers rewrite that call).
// From dist/index.js, up two levels lands on the package root's parent, so
// both the monorepo layout (packages/registry-core -> packages/foundation)
// and an installed layout (node_modules/@arche/registry-core ->
// node_modules/@arche/foundation) resolve statically.
function locateFoundation(): string {
  const distDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(distDir, "..", "..", "foundation"),
    join(distDir, "..", "..", "@arche", "foundation"),
  ];
  const found = candidates.find((dir) => existsSync(join(dir, "src", "manifests")));
  if (!found) {
    throw new Error("@arche/foundation manifests not found from registry-core");
  }
  return found;
}
const foundationDir: string = locateFoundation();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Manifest {
  name: string;
  title: string;
  description: string;
  category: string;
  manifestVersion: number;
  primitive?: { package: string; parts: string[]; propsInherited: boolean };
  native?: { element: string; parts?: string[]; propsInherited: boolean };
  slots: Array<{ name: string; part: string; required: boolean }>;
  axes: Record<string, { values: Array<string | number>; default: string | number }>;
  styleSurface: Record<string, Record<string, Record<string, unknown>>>;
  tokensUsed: string[];
  dependencies: string[];
  registryDependencies: string[];
  files: Array<{ name: string; source: string; target: string; type: string }>;
  standards: {
    purpose: string;
    useWhen: string[];
    doNotUseWhen: string[];
    rules: Array<{ id: string; severity: string; check: string }>;
  };
}

export interface ArcheIdentityFont {
  family: string;
  weights: number[];
}

export interface ArcheIdentity {
  meta: { name: string; contractVersion: number } & Record<string, unknown>;
  tokens: IdentityTokens;
  components: Record<string, Record<string, unknown>>;
  /** Optional webfont loading declaration; the emitter builds a Google Fonts @import from it. */
  fonts?: ArcheIdentityFont[];
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

// ---------------------------------------------------------------------------
// Identity validation (contract + manifest surfaces)
// ---------------------------------------------------------------------------

const FAMILY_RE = /^[A-Za-z0-9][A-Za-z0-9 \-]*$/;

const fontsSchema = z
  .array(
    z.object({
      family: z.string().min(1).max(100).regex(FAMILY_RE, "must be a URL-safe font family name"),
      weights: z.array(z.number().int().min(100).max(900)).min(1),
    }),
  )
  .min(1)
  .optional();

const identitySchema = z.object({
  meta: z.object({
    name: z.string().min(1),
    contractVersion: z.number(),
  }),
  tokens: z.unknown(),
  components: z.record(z.string(), z.record(z.string(), z.unknown())),
  fonts: fontsSchema,
});

/**
 * Builds the portable Google Fonts @import URL for an identity's font
 * declaration (families + weights). Returns null when no fonts declared.
 */
export function buildFontImport(fonts: ArcheIdentityFont[] | undefined): string | null {
  if (!fonts || fonts.length === 0) {
    return null;
  }
  const parts = fonts.map((font) => {
    const slug = font.family.trim().replace(/\s+/g, "+");
    const weights = [...new Set(font.weights)].sort((a, b) => a - b).join(";");
    return `family=${slug}:wght@${weights}`;
  });
  return `url('https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap')`;
}

function validateFonts(identity: ArcheIdentity, issues: ValidationIssue[]): void {
  const fonts = identity.fonts;
  if (fonts === undefined) {
    return;
  }
  const seen = new Set<string>();
  for (const font of fonts) {
    const key = font.family.toLowerCase();
    if (seen.has(key)) {
      issues.push({
        path: `fonts.${font.family}`,
        message: `font family '${font.family}' is declared more than once`,
      });
    }
    seen.add(key);
  }
  // Coherence: every --font-* token stack must use at least one declared family.
  const families = fonts.map((font) => font.family);
  for (const [modeName, modeSet] of Object.entries(identity.tokens ?? {})) {
    for (const [tokenName, token] of Object.entries(modeSet ?? {})) {
      if (!tokenName.startsWith("--font-")) {
        continue;
      }
      const stack = String((token as { $value?: unknown }).$value ?? "");
      if (!families.some((family) => stack.includes(family))) {
        issues.push({
          path: `${modeName}.${tokenName}`,
          message: `font stack '${stack}' uses none of the declared font families [${families.join(", ")}]`,
        });
      }
    }
  }
}

const manifestDir = join(foundationDir, "src", "manifests");
const MANIFESTS: Manifest[] = readdirSync(manifestDir)
  .filter((file) => file.endsWith(".manifest.json"))
  .sort()
  .map((file) => JSON.parse(readFileSync(join(manifestDir, file), "utf8")) as Manifest);

/** All component manifests (parsed, sorted by file). Read-only: do not mutate. */
export function getManifests(): Manifest[] {
  return MANIFESTS;
}

/** The token contract (tokens + contrast pairs) for editor UI generation. */
export function getTokenContract(): unknown {
  return tokenContract;
}

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
 * Reports undeclared knobs and failing contrast pairs by name.
 */
export function validateIdentity(identity: ArcheIdentity): ValidationResult {
  const issues: ValidationIssue[] = [];

  const parsed = identitySchema.safeParse(identity);
  if (!parsed.success) {
    issues.push({
      path: "identity",
      message: `payload malformed: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`,
    });
    return { ok: false, issues };
  }
  if (identity.meta.contractVersion !== contractData.contractVersion) {
    issues.push({
      path: "meta.contractVersion",
      message: `identity targets contract version ${JSON.stringify(identity.meta.contractVersion)}, foundation pins ${contractData.contractVersion}`,
    });
  }

  issues.push(...validateTokens(identity.tokens).issues);

  validateFonts(identity, issues);

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

  return { ok: issues.length === 0, issues };
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
        // once (root scope) and referenced by template classes
        if (modeName === "light") {
          const value = token.$value as Record<string, string>;
          for (const [key, item] of Object.entries(value ?? {})) {
            derivedRoot[`${tokenName}-${key}`] = String(item);
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
  for (const colorVar of HEX_COLOR_VARS) {
    themeVars[`color-${colorVar}`] = `var(--${colorVar})`;
  }

  // Portable font loading: the Google Fonts @import is the first entry of the
  // emitted theme CSS, built from the payload's fonts declaration. Key order
  // is explicit here; serializeStable's sort keeps '@import' first anyway.
  const css: Record<string, unknown> = {};
  const fontImport = buildFontImport(identity.fonts);
  if (fontImport !== null) {
    css["@import"] = fontImport;
  }
  css["@layer base"] = {
    ":root": derivedRoot,
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
      registryDependencies: [...MANIFESTS.map((manifest) => manifest.name), "utils", "theme"].map(
        (name) => `@arche/${name}`,
      ),
      files: [],
    }),
  );

  return items;
}
