interface TokenManifest {
    name: string;
    styleSurface: Record<string, Record<string, unknown>>;
}

type TokenSpec = { cssVar?: unknown; default?: unknown };

/** True when a knob is delivered as a CSS variable rather than a cva default. */
export function isTokenKnob(manifest: TokenManifest, knob: string): boolean {
    return Object.values(manifest.styleSurface).some(
        (surface) => typeof (surface[knob] as TokenSpec | undefined)?.cssVar === "string",
    );
}

const RADIUS = { sm: "calc(var(--radius) - 4px)", md: "calc(var(--radius) - 2px)", lg: "var(--radius)", xl: "calc(var(--radius) + 4px)" };
const SHADOW = { none: "0 0 transparent", sm: "var(--shadow-sm)", md: "var(--shadow-md)", lg: "var(--shadow-lg)", xl: "var(--shadow-xl)" };
const FONT_WEIGHT = { normal: "400", medium: "500", semibold: "600" };
const NAMED = { radiusFrom: RADIUS, cornerShape: RADIUS, shadow: SHADOW, fontWeight: FONT_WEIGHT };
const LENGTH = /^\d*\.?\d+(rem|px|%)$/;
/** Resolve enum names to CSS, or null when not a CSS token. */
export function resolveKnobValue(knob: string, value: unknown): string | null {
    if (typeof value !== "string") return null;
    const named: Record<string,string> | undefined = (NAMED as Record<string, Record<string,string>>)[knob];
    if (named) return named[value] ?? null;
    return LENGTH.test(value) ? value : null;
}
/** Token name without leading dashes. */
export function componentTokenName(component: string, knob: string): string {
    return component + "-" + knob.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
/* ------------------------------------------------------------------ */
/* Brand gradient ramp (brand-from/via/to). Derived at emission from   */
/* the --brand solid so every gradient/aurora utility resolves: from   */
/* is deeper, via is the brand itself, to is lighter and airier. Same  */
/* input renders byte-identical output; unparseable input falls back   */
/* to the brand solid for every stop.                                  */
/* ------------------------------------------------------------------ */

const OKLCH_RE = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.%]+)?\s*\)$/;

function fmt3(n: number): string {
  return String(Math.round(n * 1000) / 1000);
}

/** `{ "--brand-from": ..., "--brand-via": ..., "--brand-to": ... }` from a brand solid. */
export function brandRampVars(brand: unknown): Record<string, string> {
  const match = typeof brand === "string" ? brand.match(OKLCH_RE) : null;
  if (!match) {
    const fallback = typeof brand === "string" && brand.length > 0 ? brand : "var(--brand)";
    return { "--brand-from": fallback, "--brand-via": fallback, "--brand-to": fallback };
  }
  const l = Number(match[1]);
  const c = Number(match[2]);
  const h = Number(match[3]);
  const clamp01 = (n: number): number => Math.min(1, Math.max(0, Math.round(n * 1000) / 1000));
  return {
    "--brand-from": `oklch(${fmt3(clamp01(l - 0.1))} ${fmt3(Math.max(0, c + 0.015))} ${fmt3(h)})`,
    "--brand-via": `oklch(${fmt3(clamp01(l))} ${fmt3(Math.max(0, c))} ${fmt3(h)})`,
    "--brand-to": `oklch(${fmt3(clamp01(l + 0.14))} ${fmt3(Math.max(0, c - 0.04))} ${fmt3(h)})`,
  };
}

/** `{ "--button-height": "2.25rem" }` for every token knob, falling back to manifest defaults. */
export function componentTokenVars(
    manifests: TokenManifest[],
    components: Record<string, Record<string, unknown>>,
): Record<string, string> {
    const vars: Record<string, string> = {};
    for (const manifest of manifests) {
        for (const surface of Object.values(manifest.styleSurface)) {
            for (const [knob, raw] of Object.entries(surface)) {
                const spec = raw as TokenSpec;
                if (typeof spec.cssVar !== "string") continue;
                const value = components[manifest.name]?.[knob] ?? spec.default;
                if (typeof value !== "string") continue;
                const resolved = resolveKnobValue(knob, value) ?? value;
                vars[spec.cssVar] = resolved;
            }
        }
    }
    return vars;
}