/**
 * @arche/registry-core — builds a deterministic shadcn-compatible registry from
 * an Arche identity (tokens + per-component knob selections).
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { z } from "zod";
import { validateTokens, type IdentityTokens } from "@arche/foundation/contract/validate-tokens";
import buttonManifest from "@arche/foundation/manifests/button" with { type: "json" };
import dialogManifest from "@arche/foundation/manifests/dialog" with { type: "json" };
import tokenContract from "@arche/foundation/contract/token-contract.json" with { type: "json" };

const contractData = tokenContract as unknown as {
  contractVersion: number;
};

const require = createRequire(import.meta.url);
const foundationDir = dirname(
  require.resolve("@arche/foundation/package.json"),
);

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

export interface ArcheIdentity {
  meta: { name: string; contractVersion: number } & Record<string, unknown>;
  tokens: IdentityTokens;
  components: Record<string, Record<string, unknown>>;
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

const identitySchema = z.object({
  meta: z.object({
    name: z.string().min(1),
    contractVersion: z.number(),
  }),
  tokens: z.unknown(),
  components: z.record(z.string(), z.record(z.string(), z.unknown())),
});

const MANIFESTS: Manifest[] = [buttonManifest, dialogManifest].map(
  (manifest) => manifest as unknown as Manifest,
);

/** identity knob name -> template axis name, per component (emission logic) */
const KNOB_TO_AXIS: Record<string, Record<string, string>> = {
  button: {
    defaultVariant: "variant",
    defaultSize: "size",
    shadow: "shadow",
    fontWeight: "fontWeight",
  },
  dialog: {
    size: "size",
    overlayBackground: "overlayBackground",
    overlayOpacity: "overlayOpacity",
    backdropBlur: "backdropBlur",
    shadow: "shadow",
    border: "border",
    radiusFrom: "radius",
    motion: "motion",
  },
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
    const values = (spec.values ?? []) as string[];
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

  for (const manifest of MANIFESTS) {
    const selections = identity.components[manifest.name];
    if (selections === undefined) {
      issues.push({
        path: `components.${manifest.name}`,
        message: `component '${manifest.name}' is missing knob selections`,
      });
      continue;
    }
    for (const [knobName, knobValue] of Object.entries(selections)) {
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
    /(\w+):\s*("(?:[^"\\]|\\.)*"|\d+(?:\.\d+)?|true|false|undefined|-?\d+(?:\.\d+)?),/g,
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

  return {
    cssVarsLight,
    cssVarsDark,
    themeVars,
    css: {
      "@layer base": {
        ":root": derivedRoot,
      },
    },
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
    const knobAliases = KNOB_TO_AXIS[manifest.name] ?? {};

    let content = readTemplate(templateFile);
    // Shadcn installs target lib/utils.ts; templates import it relatively so the
    // workspace package compiles on its own.
    content = content.replace('from "./lib/utils.js"', 'from "@/lib/utils"');
    if (manifest.name === "dialog") {
      const overlayOverrides: Record<string, unknown> = {};
      const contentOverrides: Record<string, unknown> = {};
      for (const [knobName, knobValue] of Object.entries(identity.components[manifest.name] ?? {})) {
        const axis = knobAliases[knobName];
        if (!axis) {
          continue;
        }
        if (["overlayBackground", "overlayOpacity", "backdropBlur"].includes(axis)) {
          overlayOverrides[axis] = knobValue;
        } else {
          contentOverrides[axis] = knobValue;
        }
      }
      content = stampDefaultVariants(content, "dialogOverlayVariants", overlayOverrides);
      content = stampDefaultVariants(content, "dialogContentVariants", contentOverrides);
    } else {
      const overrides: Record<string, unknown> = {};
      for (const [knobName, knobValue] of Object.entries(identity.components[manifest.name] ?? {})) {
        const axis = knobAliases[knobName];
        if (axis) {
          overrides[axis] = knobValue;
        }
      }
      content = stampDefaultVariants(content, "buttonVariants", overrides);
    }

    items.set(
      manifest.name,
      serializeStable({
        name: manifest.name,
        type: "registry:ui",
        title: manifest.title,
        description: manifest.description,
        dependencies: manifest.dependencies,
        // Bare names resolve to shadcn's built-ins; this registry ships under
        // its own namespace, so dependency addresses are namespaced at emission.
        registryDependencies: manifest.registryDependencies.map(
          (dependency) => (dependency.startsWith("@") || /^https?:/.test(dependency) ? dependency : `@arche/${dependency}`),
        ),
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
      registryDependencies: ["@arche/button", "@arche/dialog", "@arche/utils", "@arche/theme"],
      files: [],
    }),
  );

  return items;
}
