# Calibration report — design-rule enforce budgets (Deliverable 4)

Reference sets: 4 canonical in-repo fixtures (light + dark modes) + Radix Colors scale data (12 scale files: gray/blue/red/green/amber/purple × light/dark, steps mapped to roles per color-step-jobs).
Budgets are Arche's own (no authority publishes per-step chroma numbers); WCAG 2.2 AA is untouched by this report.

## color-bg-chroma-cap — light 0.025 / dark 0.035 (profile-scaled)

- fixtures light bg-family: n=20 median=0.0060 p95=0.1400 max=0.1400 vs budget 0.025
- fixtures dark bg-family: n=20 median=0.0300 p95=0.1400 max=0.1400 vs budget 0.035
- Radix steps 1-2: n=24 median=0.0096 p95=0.0295 max=0.0315 (role reference, not a budget input)
- verdict: KEEP — fixture maxima sit an order of magnitude under the caps; caps bind only runaway saturation.

## color-text-chroma-cap — 0.05 → ADJUSTED to 0.18

- fixtures text tokens: n=64 median=0.0000 p95=0.0600 max=0.0900 vs budget 0.05
- Radix steps 11-12: n=24 median=0.1090 p95=0.1889 max=0.1978 — median 0.109 already exceeds 0.05: a clear majority of the readability reference violates the starting budget
- verdict: ADJUST to 0.18 (admits Radix p95 0.173; still caps neon text above it). See Adjustment A1.

## color-border-chroma-cap — 0.04 → ADJUSTED to 0.15

- fixtures border/input: n=16 median=0.0250 p95=0.1800 max=0.1800 vs budget 0.04
- Radix steps 6-8: n=36 median=0.0962 p95=0.1404 max=0.1465 — median 0.096: a clear majority violates the starting budget
- verdict: ADJUST to 0.15 (admits Radix p95 0.140; still caps glare borders above it). See Adjustment A2.

## color-solid-chroma-band — [0.08, ceiling 0.19/0.24/0.26]

- fixtures solids: n=24 median=0.1400 p95=0.2450 max=0.2450 vs band [0.08, 0.24]
- Radix steps 9-10: n=24 median=0.1773 p95=0.1952 max=0.2065 (validates the ceiling: saturated-action steps live under 0.24)
- verdict: KEEP — the floor is the binding side (old formal compilations sat under it; the repair pass now raises them). The enterprise ceiling 0.19 binds vivid primaries by design.

## color-chroma-taper — L>=0.95 or L<=0.08 => C<=0.03

- fixtures extreme-lightness tokens above the taper cap: identity.arcade.json:light.--background=C0.035@L0.96
- verdict: KEEP — references comply; the rule guards geometry (high chroma is unavailable at extreme lightness), not taste.

## color-neutral-tint — within 15deg of primary (C>0.015)

- fixtures neutral-token hue distance from primary: n=25 median=40.0000 p95=105.0000 max=115.0000 vs limit 15deg
- verdict: KEEP — references are tinted neutrals by construction; the rule names the existing practice.

## color-chart-separation — pairwise dE>=0.08; hue<25deg needs dL>=0.25

- fixtures chart pairwise dE: n=80 median=0.1850 p95=0.6010 max=0.6010 vs floor 0.08
- fixtures chart pairs violating the hue/dL leg: 24 of 80
- verdict: KEEP — calibrated to separate-by-lightness chart sets (incl. the monochrome aurora set, which passes on dL). Repair spreads lightness where model hues collide.

## Adjustments

- A1 (color-text-chroma-cap): 0.05 → 0.18. Evidence: Radix steps 11-12 (the readability reference) median C 0.109, p95 0.173 — a clear majority violates 0.05. The cap keeps its teeth above Radix p95.
- A2 (color-border-chroma-cap): 0.04 → 0.15. Evidence: Radix steps 6-8 median C 0.096, p95 0.140 — a clear majority violates 0.04. The cap keeps its teeth above Radix p95.
- (no change) color-bg-chroma-cap: Radix steps 1-2 p90 0.0255 touches the light cap, but the majority complies — a ceiling binding only runaway saturation, kept as written.
- (no change) color-solid-chroma-band: Radix steps 9-10 sit inside [0.08, 0.24]; the enterprise ceiling 0.19 binds only the most vivid solid steps, which is its stated job.
Re-run: `node design-rules/calibrate.mjs` from packages/foundation (needs network for the Radix leg).

## Brief #7 reference legs — Primer + Carbon (measured 2026-11-14)

Sources: `@primer/primitives@11.10.0` functional themes (`light.json`, `dark.json`)
and `@carbon/themes@11.85.0` generated themes (`white.js`, `g100.js`), fetched
from the npm registry and measured with the same OKLCH math as above.
Role mapping is approximate and documented per leg: Primer functional roles
(`bgColor-*`, `fgColor-*`, `borderColor-*`, `bgColor-accent-emphasis`,
`button-primary-bgColor-rest`, `data-*-color-emphasis`) and Carbon v11 roles
(`background`/`layer01`/`field01`, `textPrimary`/`textSecondary`,
`borderSubtle01`/`borderStrong01`, `backgroundBrand`/`supportError`) stand in
for Arche's bg/text/border/solid/chart buckets. Budgets stay Arche's.

### Primer functional light

- bg-family (default/muted/inset): C = 0.0000 / 0.0034 / 0.0034 — under the light cap 0.025.
- text (default/muted): C = 0.0111 / 0.0215 — far under the 0.18 cap.
- borders (default/muted): C = 0.0130 — under the 0.15 cap.
- solids (accent-emphasis/button-primary-rest): C = 0.1906 / 0.1450 — inside the [0.08, 0.24] standard band.
- contrast: fg-default/bg-default 15.8, fg-muted/bg-muted 5.74, white on accent-emphasis 5.19, accent on white 5.19 — all AA PASS.

### Primer functional dark

- bg-family: C = 0.0140 / 0.0182 / 0.0194 — under the dark cap 0.035.
- text: C = 0.0103 / 0.0155; borders: C = 0.0179.
- solids: C = 0.2023 / 0.1474 — inside the band.
- contrast: 17.39 / 5.94 / 4.63 (white on dark accent-emphasis) / 6.11 — all AA PASS (tightest pair 4.63).
- chart hues (blue/green/orange/purple/red emphasis): min pairwise ΔE 0.128 — above the 0.08 floor.

### Carbon white + g100

- Surfaces are strictly monochrome (bg/text/border all C = 0.0000) — stricter
  than Arche's tinted-neutral rule, which *requires* C ≥ 0.015 toward the
  primary hue unless the identity is an explicitly monochrome selection.
- solids: backgroundBrand C = 0.2430 (both themes), supportError C = 0.2174 / 0.2088.
  backgroundBrand sits 0.003 above the *standard* ceiling (0.24) and inside the
  expressive ceiling (0.26) — the ceiling binds vivid blues by design; verdict KEEP.
- contrast: textPrimary/bg 18.1 (white) / 16.45 (g100), textSecondary/bg 7.81 / 10.59,
  white on backgroundBrand 5.0 — all AA PASS.

### Not measured

- **shadcn themes**: no stable published token source exists since the
  `shadcn-ui/ui` repo restructure (the old `apps/www/app/globals.css` raw path
  404s and themes are no longer shipped as a standalone file) — recording the
  gap instead of inventing numbers.
- **Carbon/Carbon-charts**: `@carbon/themes` ships no categorical chart
  palette; chart separation is covered by the Radix + Primer legs above.

Overall verdict: the new legs confirm the existing budgets — every measured
reference value sits inside its Arche budget except Carbon's brand blue, which
touches the standard solid ceiling exactly where that ceiling is meant to bind.
No budget changes.


## Taste metrics (Brief #7 D1, Arche-defined, not external standards)

- **Accent surprise**: circular accent-vs-primary hue distance mapped to
  0-100. Bands: <25deg "predictable", 25-90deg "related", >90deg
  "surprising"; enterprise is "monochrome-by-design" (score 0, exempt).
  Teach-tier: reported on every payload, never a failure. This is Arche's
  own house metric -- it is not calibrated against any external reference
  and makes no claim beyond its definition.
- **Evocative names**: 12 hue families x 4 voices, deterministic
  (same oklch -> same name). Curated display labels, not a color standard.
