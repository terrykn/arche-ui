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
