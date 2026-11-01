# Arche UI — Agent Build Brief #2: Full Catalog + Canonical Identities + Dual Preview

**Audience:** an AI coding agent (or developer) working inside the Arche monorepo.
**Prerequisite (already done — do not redo):** Brief #1 is complete and verified. The monorepo contains `packages/foundation` (token contract, Button + Dialog templates and manifests, token-only lint), `packages/registry-core` (the emitter), a fixture identity, and a scratch install-proof app. If the actual tree differs, adapt paths, keep the package boundaries, and note the deviation in your final report.
**Governing spec:** "Arche UI — Library Creation Spec v1.2" (2026-11-01). This brief implements its §4–§9 and §12.1 at full catalog scale. Where this brief and the spec disagree, the spec wins and you must flag the conflict rather than silently choosing.

---

## 1. Product context (minimum you need)

Arche UI generates complete, installable React component libraries ("identities") from data. A library is **data**: a design-token set plus per-component style selections. Deterministic codegen turns that data into a **shadcn-compatible registry** (JSON over HTTP); users install components into their own projects as copied source files. Behavior comes exclusively from **Radix Primitives** — exactly the behavior Radix ships, no more, no less (spec §4.4); Arche code styles and composes, it never implements behavior. The manifest for each component declares the closed set of legal style values (axes + knobs) that an identity may choose from; that declared menu is the product's control surface.

## 2. Scope of this brief

Five deliverables, in this order:

0. **Cleanup pass** on Button + Dialog applying the five findings from their manifest review (§4).
1. **Catalog scale-out:** templates + manifests for the remaining 35 components (§5).
2. **Catalog-scale tooling:** the automated manifest↔template cross-check and full lint coverage (§6).
3. **The two canonical identities** (spec §8.1): Arche Default and 90s Arcade (§7).
4. **The emitter at catalog scale**, per identity (§8).
5. **The dual previews** (spec §12.1): two separate scratch apps, one per canonical identity, rendering the same full-catalog test page (§9).

**Explicitly out of scope — do not build:** any catalog component beyond spec §4; the web app's features, database, or auth; the Arche CLI package; AI generation of identities; MCP; billing; React Native. Do not scaffold placeholders for these.

## 3. Non-negotiable rules

Rules 1–6 from Brief #1 carry forward unchanged (Radix owns behavior; token-only styling; closed style surface; deterministic output; standards formats, not inventions; stop-and-report on spec conflicts). In addition:

7. **Radix-exact behavior (spec §4.4).** Each component's parts, props, state attributes, keyboard/focus/dismissal behavior, and ARIA wiring are exactly what its Radix package provides. No reimplementation, no extension, no behavioral wrapper logic. Composition in the shadcn pattern is assembly, not logic.
8. **Manifest authoring rules (spec §7.7).** Category from the taxonomy verbatim; native sub-element slots marked as native; `registryDependencies` in the one canonical (plain-name) form, copied verbatim by the emitter; no knob whose legal values contradict the component's own standards; rule ids written as permanent public API.
9. **Legal-value richness (spec §7.8).** Declare the full useful range at every axis and knob — every real variant/size, every meaningful scale step, every semantically plausible token choice — bounded strictly by what the primitive supports and the template implements exactly. A narrow menu is a defect; an unimplementable value is a defect.
10. **Defaults discipline (spec §8.1, §7.5).** Manifest defaults are the plain expected choice (shadcn's, where shadcn has one). The Arche Default identity selects exactly the manifest defaults for every component; stamped values in reports are always labeled as manifest defaults or as an identity's selections, never blurred.

## 4. Deliverable 0 — Cleanup of Button + Dialog (the five review findings)

Apply all five, then re-run Brief #1's full acceptance list (any change to manifests, templates, or the emitter invalidates earlier passes until re-run):

1. **Categories** — confirm `button` = `actions`, `dialog` = `overlays` (already correct; the v1.2 taxonomy in spec §7.7a ratifies these values — no change expected, verify and report).
2. **Dialog slots** — mark the `header` and `footer` slots as native sub-elements per spec §7.7b (`partType: "native"`); Radix-part slots stay unmarked/Radix-typed per the schema you implement.
3. **Canonical `registryDependencies`** — the emitter must copy manifest strings verbatim. Fix emission so the emitted items say `"utils"` exactly as the manifests declare (today the emitter rewrites it to `"@arche/utils"`). If the stock shadcn CLI then fails to resolve `utils` in the install proof, stop and report that as a spec conflict — do not silently re-namespace.
4. **Button `defaultVariant` knob** — remove `link` from its legal values (spec §7.7d). `link` remains a legal `variant` axis value for direct consumer use; an identity may not *default* to it.
5. **Dialog rule id** — rename `dialog-native-alert-on-destructive` to `dialog-destructive-use-alert-dialog`, and update every reference (manifest, docs strings, tests) in the same change.

Also: where the Brief #1 fixture's dialog selections (blur `md`, shadow `lg`, overlay token `--primary`) differ from manifest defaults, leave the selections as they are — they are legitimate fixture choices — but the report must describe them as the fixture's selections, not as defaults (spec §7.5). The fixture itself is superseded as a named identity by Deliverable 3; keep the file if useful as a third test payload.

## 5. Deliverable 1 — Catalog scale-out (35 components)

**Radix-based (29 remaining of 30):** Accordion, Alert Dialog, Aspect Ratio, Avatar, Checkbox, Collapsible, Context Menu, Dropdown Menu, Form, Hover Card, Label, Menubar, Navigation Menu, One-Time Password Field, Password Toggle Field, Popover, Progress, Radio Group, Scroll Area, Select, Separator, Slider, Switch, Tabs, Toast, Toggle, Toggle Group, Toolbar, Tooltip.

**Presentational (6 remaining of 7):** Input, Textarea, Card, Badge, Skeleton, Table.

With Button and Dialog, the finished catalog is 37 components. For **each** component, the work is identical to Brief #1's pattern:

- [ ] Template forked from shadcn/ui's implementation and normalized to the standard anatomy (spec §6.2): parts composed, all primitive props forwarded, cva axes from the manifest only, token-only classes, state styling via Radix `data-*` attributes, `cn()` merging, `className` passthrough, `data-slot` on every part.
- [ ] Manifest with all 8 sections (spec §7.2), authored under rules §7.7–§7.8: taxonomy category; behavior source (`primitive` or `native`) with parts/props inheritance recorded, never redefined; slots with native sub-elements marked; axes + style surface declaring the full legal range; `tokensUsed` exactly matching the template; dependencies in canonical form; standards (purpose, useWhen, doNotUseWhen, checkable rules with permanent-quality ids).
- [ ] The component emits, validates, and installs through the same pipeline as Button/Dialog — no per-component special cases in the emitter.

**Behavior-source conflicts — stop and report, per component.** Where shadcn's current implementation gets its behavior from something other than the Radix primitive the spec names (known examples to check: Toast, where shadcn has moved to a non-Radix implementation; Form, which composes additional form-state machinery), do **not** silently substitute the behavior source and do not invent behavior. Build the component on the Radix primitive per spec D2/§4.4 if a faithful Radix-based styling exists; if it does not, mark that one component blocked in your report with the exact conflict and continue with the rest of the catalog. The same applies if a Radix package named in spec §4.1 does not resolve on npm under its expected name.

**Batching.** Work in batches of roughly 6–8 components. After each batch: root build/typecheck/lint, token-only lint, and the cross-check (Deliverable 2) must pass for that batch before you start the next. Record batch status in your report as you go; a blocked component never blocks a batch.

## 6. Deliverable 2 — Catalog-scale tooling

Brief #1's checks were per-component and partly manual. At 37 components they must be automated (spec §7.6):

- **`scripts/check-manifest-template.ts`** (in `packages/foundation`): for every component, parse the template's cva axes and values and its contract-token references, and diff against the manifest — axes, knob implementations, `tokensUsed`. Both mismatch directions fail (declared-but-unimplemented; implemented-but-undeclared), naming the component and the value.
- **Dependency agreement:** the same check (or the emitter's tests) verifies that emitted `dependencies` / `registryDependencies` strings equal the manifest strings verbatim for every item (spec §7.7c).
- **`check-token-only`** extended to run over all templates.
- Identity validation schemas cover all 37 manifests (an undeclared knob for any component is unrepresentable, per spec §7.1).

## 7. Deliverable 3 — The two canonical identities (spec §8.1)

Replace the anonymous fixture as the project's named test identities. Both are complete payloads (full contract token set, light + dark; knob selections for all 37 components) and both must validate clean, contrast pairs included.

**`fixtures/identity.default.json` — "Arche Default".**
- Token values = shadcn's stock neutral theme, taken from shadcn's published defaults at build time (e.g. the CSS variables a fresh stock `shadcn init` writes) — cite the exact source in your report; do not re-type values from memory or from this brief.
- Monochrome check: every color token's OKLCH chroma is 0, **except** `--destructive` (and its foreground pairing as shadcn defines it) and `--chart-1…5`, which keep shadcn's stock values. `--radius` is `0.625rem`; fonts and shadows are shadcn/Tailwind defaults.
- Knob selections: **exactly the manifest defaults for all 37 components**, recorded explicitly in the payload (not omitted-and-assumed).

**`fixtures/identity.arcade.json` — "90s Arcade".**
- A vivid neon identity of your design: full token set in both modes, every §5.4 contrast pair passing (adjust lightness only where a pair fails — never ship a failing pair for the sake of the look).
- Knob selections deliberately non-default for **at least 10 components** (radius steps, overlay blur/opacity, shadows, motion, default variants/sizes), all within declared legal values. The customization must be visible in the components, not only in colors.

**Keep `fixtures/identity.invalid.json`** working against the full catalog: one knob set to an undeclared value and one broken contrast pair, rejected with both named (Brief #1 criterion 4, unchanged).

## 8. Deliverable 4 — Emitter at catalog scale

- `buildRegistry(identity)` emits one item per catalog component (37) + `utils` + theme + `all`, for any valid identity, schema-conformant and deterministic (Brief #1 rules 4–5 apply to every item).
- The emit script takes the identity as an argument and writes to a per-identity output directory (e.g. `packages/registry-core/out/default/`, `out/arcade/`). Never hand-edit emitted JSON.

## 9. Deliverable 5 — Dual previews (spec §12.1)

Two **separate** scratch apps (e.g. `.scratch/preview-default` and `.scratch/preview-arcade`), each created fresh (`create-next-app`, Tailwind on), each installing **its** identity's `all` item through the stock path: serve that identity's `out/` over local HTTP → `shadcn init` → `add` the `all` item by URL.

Both apps render **the same test page** (`src/app/page.tsx`, or the existing proof page extended):

- Every one of the 37 components rendered once, in a labeled section bearing only the component's name — comprehensive.
- Principal variants and states exercised: all Button variants/sizes; Dialog and Alert Dialog openable; form controls in default, checked/selected, and disabled states; Accordion expanded; Tabs with multiple panels; menus, Select, Popover, Tooltip, Hover Card functional; Slider/Switch/Toggle interactive.
- Light and dark both reachable via the `.dark` class on `<html>` (a small toggle in the page scaffolding is fine — scaffolding is the app's, not a component's).
- Nothing else: no extra pages, no marketing chrome, no decorative layout — minimal.

Previews are snapshots of installed copies: never hand-edit their installed component files or `globals.css` to "fix" a look. The refresh procedure is always: edit payload → emit → `add` → refresh. Keep both apps; they are the standing regression harness for all later briefs. Document each app's location and the exact serve/add/dev commands in your report.

## 10. Acceptance criteria (all must pass; report each with evidence)

1. Root `pnpm build`, `pnpm typecheck`, and `pnpm lint` pass.
2. `check-token-only` passes on all 37 templates.
3. `check-manifest-template` passes on all 37 components (axes, knob implementations, `tokensUsed` — both mismatch directions).
4. Cleanup verified: Button `defaultVariant` legal values exclude `link`; Dialog `header`/`footer` slots are marked native; the rule id `dialog-destructive-use-alert-dialog` is in place with no stale references; every emitted item's `registryDependencies` equal its manifest's strings verbatim.
5. Both canonical identities validate clean, including all contrast pairs; the invalid fixture is rejected, naming the undeclared knob and the failing contrast pair.
6. Default identity audit (scripted, not eyeballed): chroma = 0 for every color token except `--destructive` / `--chart-1…5`; `--radius` = `0.625rem`; knob selections for all 37 components equal the manifest defaults (scripted diff against the manifests).
7. Emit produces schema-valid items for all 37 components + `utils` + `theme` + `all`, for **both** identities; re-emitting either identity is byte-identical.
8. Install proof ×2: each preview app installs its identity's `all` item via the stock shadcn CLI with no unresolved-dependency errors.
9. Preview completeness: the test page renders all 37 components in both apps (include the per-component checklist in your report); toggling `.dark` re-skins both apps from their dark token sets; the two apps are visibly different identities (tokens **and** knob selections).
10. Behavior spot-checks in the preview apps: Dialog and Alert Dialog trap focus and close on Escape with focus returning to the trigger; Dropdown Menu and Context Menu open and keyboard-navigate; Select opens and selects; Tabs respond to arrow keys; Slider responds to arrow keys; Accordion expands/collapses; Checkbox, Switch, and Toggle show correct pressed/checked state styling. No template contains Arche-written behavior (grep templates for `onKeyDown`, `focus()`, `addEventListener`, manual portal/scroll-lock code — expected: none beyond what shadcn's original composition contains).
11. Stamped-defaults check: in the Default identity's emitted items, every stamped `defaultVariants` equals the manifest defaults; in the Arcade identity's emitted items, at least 10 components' stamped defaults differ from manifest defaults, matching the arcade payload's selections exactly.

## 11. Final report format

End with a short report containing: the file tree you created/changed; per-batch status for Deliverable 1 (including any component blocked under §5's behavior-source rule, with the exact conflict); the exact source you took the Arche Default token values from; the exact commands run for §10 with pass/fail per criterion; any deviation from this brief or the governing spec and why; anything you had to decide that the brief left open. Do not claim a criterion passed without having run it.

---

*End of Brief #2. Brief #3 (web app + database + registry serving, then the CLI) will follow once these acceptance criteria pass.*
