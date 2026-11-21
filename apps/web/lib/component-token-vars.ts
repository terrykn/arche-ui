const CSS_VALUE = /^\d*\.?\d+(rem|px|ms|s|%)?$/;
const kebab = (value: string) => value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/** Maps component knob selections to namespaced CSS variables. */
export function componentTokenVars(
    manifests: Array<{ name: string; styleSurface: Record<string, Record<string, unknown>> }>,
    components: Record<string, Record<string, unknown>>,
): Record<string, string> {
    const vars: Record<string, string> = {};
    for (const manifest of manifests) {
        for (const knobs of Object.values(manifest.styleSurface)) {
            for (const knob of Object.keys(knobs)) {
                const value = components[manifest.name]?.[knob];
                if (typeof value === "string" && CSS_VALUE.test(value)) {
                    vars[`--${manifest.name}-${kebab(knob)}`] = value;
                }
            }
        }
    }
    return vars;
}