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