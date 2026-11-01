# Arche UI — Library Creation Spec

**Version:** 1.2 (amended: §7.7(c) permits namespaced emitted dependency addresses and §8.1 allows documented accessibility adjustments to Arche Default). (v1.2 adds §4.4 Radix-exact behavior fidelity, §7.7 manifest authoring rules from the Button/Dialog review, §7.8 legal-value richness, §8.1 the two canonical identities, and §12.1 the dual-preview standard. v1.1 added §7.4–§7.6 — axes vs. knobs, the knob lifecycle, and manifest↔template agreement — and pinned the radius derivation in §5.2 to shadcn's convention)
**Date:** 2026-11-01
**Status:** Active foundation spec. This document replaces the 2026-10-28 product spec for everything concerning how a component library is structured, created, published, and installed. Earlier documents (2026-10-28 spec, Addendum A1) are reference material only.

**Scope of this document:** the library-creation layer only — components, tokens, templates, manifests, the registry, and the CLI. It defines the interfaces that AI generation, the web app, and MCP build on later; it does not spec those layers.

---

## 1. Decisions this spec is built on

| # | Decision | Notes |
|---|----------|-------|
| D1 | **React / web only for now.** React Native is a later phase. | Resolves the long-open platform question for v1. |
| D2 | **Behavior comes from Radix Primitives** (30 documented component primitives, §4). Arche never writes behavior code. | Primitives own focus, keyboard, ARIA, portals, dismissal. |
| D3 | **Distribution is a shadcn-compatible registry** served over HTTP, per user, per library. | Identical JSON shape to `shadcn build` output; stock shadcn tooling can consume it. |
| D4 | **One Arche CLI, distributed via npm, with user login.** v1 is a thin wrapper over the shadcn CLI; a later version may swap in Arche's own install engine behind the same commands. | Libraries are an argument to the CLI, never separate packages per library. |
| D5 | **Design tokens are stored in DTCG format** — the W3C Design Tokens Community Group specification (first stable version 2025.10, Oct 2025): JSON with `$value` / `$type` / `$description`, `{path.to.token}` aliases, theming support, modern color spaces (OKLCH, Display P3). | This is the format the Figma ecosystem speaks (Figma Variables and Tokens Studio import/export DTCG JSON), which keeps a future Figma integration open. Reference tooling: Style Dictionary, Terrazzo. Pin the DTCG draft the chosen toolchain actually implements. |
| D6 | **Token architecture is the industry-standard three tiers** (§5): primitives → semantics → component values. The semantic vocabulary is shadcn's variable names; palette generation follows Radix Colors' 12-step scale methodology. | Arche invents no token names and no color logic of its own. |
| D7 | **Styling is a closed surface.** Every component has a hand-written template and a machine-readable manifest declaring a fixed set of style knobs. AI (and any future editor UI) may only choose values the manifest allows. | The manifest is the single source of truth consumed by validation, codegen, docs, MCP, and the standards checker. |
| D8 | **Design standards are part of the product.** Each manifest carries machine-readable usage rules for its component, enforced through MCP, the Studio, and a check command (§11). | Whether enforcement is strict (fails) or advisory (warns) is an open decision (§13). |

## 2. Core principles

1. **Primitives own behavior; Arche owns styling only.** No Arche code implements focus management, keyboard interaction, or ARIA behavior.
2. **Data is the source of truth.** A library is data (tokens + knob selections, §8). Component files and registry JSON are generated artifacts derived from that data, deterministically.
3. **Closed surfaces, validated outputs.** Any value an identity supplies is validated against the token contract (§5) or a manifest (§7) before it can affect generated output. Out-of-set values are structurally impossible, not merely discouraged.
4. **Reuse industry standards over invention.** shadcn registry schema for distribution, DTCG for tokens, Radix for behavior, Radix Colors step semantics for palettes, shadcn's semantic token names for vocabulary.
5. **Users own the installed code.** Installation copies component source files into the user's project (the shadcn model). A library is never an npm dependency of the user's app.
6. **Command-surface stability.** The CLI's commands and their meaning must survive the v1→v2 engine swap unchanged.

## 3. System overview

```
FOUNDATION (built once, versioned, Arche-owned)
  Token contract ......... fixed semantic vocabulary + value rules        (§5)
  Templates .............. one .tsx per component, styled, token-only     (§6)
  Manifests .............. one .json per component: knobs, tokens, rules  (§7)

IDENTITY (per user library, stored as data)
  DTCG token set ......... values for every contract token, light + dark
  Knob selections ........ per-component choices within manifest limits
  Overrides .............. user token overrides, recorded, never silent

GENERATION (deterministic, no AI at this layer)
  Validate → stamp templates with knob selections → emit theme CSS (DTCG → CSS vars)
           → emit one registry item JSON per component + theme item + "all" item
           → store as an immutable, versioned snapshot

DISTRIBUTION
  Registry server ........ serves item JSON at /r/<user>/<library>/<name>.json,
                           entitlement-checked for private libraries        (§9)
  Arche CLI .............. login + init + add/install (shadcn engine in v1) (§10)
  User project ........... files copied in, Radix packages npm-installed,
                           theme variables merged into globals.css
```

## 4. Component catalog

### 4.1 Radix-based components (30)

The 30 documented Radix Primitives are Arche's behavior ceiling on web. Each is an independently versioned, unstyled, accessible package.

Accordion, Alert Dialog, Aspect Ratio, Avatar, Checkbox, Collapsible, Context Menu, Dialog, Dropdown Menu, Form, Hover Card, Label, Menubar, Navigation Menu, One-Time Password Field, Password Toggle Field, Popover, Progress, Radio Group, Scroll Area, Select, Separator, Slider, Switch, Tabs, Toast, Toggle, Toggle Group, Toolbar, Tooltip.

Non-component Radix utilities (Slot, Portal, Visually Hidden, Direction) are used inside templates as needed; they are not catalog items.

Consequences of the ceiling, accepted for v1: Radix has no date picker, data table, or chart behavior. Such components, if added later, are compositions or another behavior source, and require a spec amendment.

### 4.2 Presentational components

A shadcn-style catalog is larger than Radix's list. Components with no behavior needs are styled native HTML elements under the same template + manifest system, with the manifest's behavior source recorded as a native element:

Button, Input, Textarea, Card, Badge, Skeleton, Table (presentational markup), and typography/layout helpers as needed.

### 4.3 Division of labor per component

| Piece | Source | Arche writes |
|---|---|---|
| Behavior + props API | Radix package (npm dependency) | Nothing. Wrappers accept all primitive props and forward them; manifests record inheritance, they do not redefine props. |
| Styling code | Template `.tsx` (§6) | Once per component. Starting point is shadcn/ui's open-source implementation, normalized to Arche's anatomy (§6.2). Includes all state styling via `data-*` attributes (`data-[state=open]`, `data-[disabled]`, checked/indeterminate, etc.). |
| Contract / metadata | Manifest `.json` (§7) | Once per component. Declares slots, knob surface, tokens used, dependencies, standards. |

### 4.4 Behavior fidelity: exactly what Radix offers, nothing more, nothing less

For every Radix-based component, the behavior surface is **identical to the Radix package's** — the same parts, props, event handlers, state attributes (`data-state`, `data-disabled`, orientation, checked/indeterminate, …), keyboard interaction, focus management, dismissal rules, and ARIA wiring. This is a hard equality, not a guideline:

- Arche code never reimplements, extends, restricts, or wraps behavior. No custom focus, keyboard, scroll-lock, portal, or dismissal logic exists anywhere in a template. If raw Radix does it, the Arche component does it identically; if raw Radix does not do it, the Arche component does not do it either.
- Templates may do exactly two things: **compose** parts into convenient exports (the shadcn pattern — e.g. one `DialogContent` that internally renders Portal + Overlay + Content + Close), and **attach token-based styling**, including styling driven by Radix's own state attributes. Composition is assembly, not logic.
- The style surface of a component is **bounded by its primitive**: knobs and axes (§7) may only expose choices the primitive's parts and states can actually express. A look that would require behavior Radix does not offer is outside the surface — it is spec-amendment territory (§4.1), never a template workaround.
- Presentational components (§4.2) follow the same rule against the native element: behavior and semantics are exactly the HTML element's (plus Radix Slot composition for `asChild` where shadcn uses it); Arche adds styling only.

## 5. Token contract

### 5.1 Format and tiers

Tokens are authored and stored as **DTCG JSON** (D5). Three tiers:

1. **Primitives** — raw scales with no purpose: color ramps, spacing scale, radius steps, font stacks, shadow definitions, motion durations/easings. Never referenced by component templates directly.
2. **Semantics** — purpose-named tokens aliasing primitives, mode-aware (light and dark resolve to different primitives). **This tier is the contract**: the fixed list in §5.2.
3. **Component values** — per-component styling values. In Arche these are not separate token files; they live in the manifest style surface (§7) and in identity knob selections (§8).

### 5.2 The semantic contract (v1)

Colors are supplied per mode (light values under the default set, dark values under the dark set), in OKLCH. `-foreground` tokens are contrast pairs with their base token.

```
Surfaces   --background          --card               --popover
On-surface --foreground          --card-foreground    --popover-foreground
Actions    --primary / --primary-foreground
           --secondary / --secondary-foreground
           --accent / --accent-foreground
           --destructive / --destructive-foreground
Quiet UI   --muted / --muted-foreground
Structure  --border    --input    --ring
Data       --chart-1 … --chart-5
```

Shape, type, depth, motion:

```
--radius                 base corner radius; derived scale follows shadcn's convention
                         exactly: sm = calc(var(--radius) - 4px), md = calc(var(--radius) - 2px),
                         lg = var(--radius), xl = calc(var(--radius) + 4px),
                         so one value re-shapes the whole system
--font-sans  --font-display  --font-mono
--shadow-sm … --shadow-xl        (token values, not fixed utilities)
--motion-fast  --motion-normal   durations + easing curves
```

### 5.3 Palette generation (Radix Colors methodology)

When a palette is generated from source hues, it follows Radix Colors' 12-step scale semantics — each step has an assigned job:

- Steps 1–2: app and subtle backgrounds
- Steps 3–5: component backgrounds (normal / hover / active)
- Steps 6–8: borders (subtle / strong / hover)
- Steps 9–10: solid fills (normal / hover)
- Steps 11–12: text (low-contrast / high-contrast)

Steps are then mapped onto the semantic contract names. Arche does not invent its own color-step logic.

### 5.4 Contract rules

- **Token-only templates.** Component templates may reference contract tokens only. Raw hex or px values in component files fail lint, except explicitly whitelisted structural constants (e.g. a 1px border width).
- **Complete coverage.** An identity must supply a value for every contract token, for both modes. Partial themes are invalid.
- **Contrast pairs.** The contract names the pairs that must meet WCAG AA (each base/`-foreground` pair, `foreground` on `background`, `muted-foreground` on `muted`, etc.). Identity values are validated against these pairs at publish (§12). If an adjustment is needed, it may change lightness only, never hue.
- **Append-only versioning.** The contract is versioned. Names are never renamed or removed in a published version — every installed library in the wild depends on them. New tokens may be added in a new contract version.

### 5.5 Storage and emission

An identity's token set is stored as DTCG JSON, e.g.:

```json
{
  "color": {
    "$type": "color",
    "primary": {
      "$value": { "colorSpace": "oklch", "components": [0.55, 0.14, 250] },
      "$description": "Primary action surface"
    }
  }
}
```

At generation time, the token set compiles to CSS variables (the `:root` and `.dark` blocks) which ship inside the registry's **theme item** (§9.3) and are merged into the user's `globals.css` on install. DTCG remains the storage/interchange form — including for a future Figma sync — and CSS variables are a derived output, never the source.

---

## 6. Component templates

### 6.1 What a template is

One `.tsx` file per catalog component: a thin wrapper composing a Radix primitive's parts (or native elements for presentational components) with complete styling. Templates are written **once**, versioned, and identical for every library. An identity never edits a template; it supplies tokens (§5) and knob selections (§8) that the template reads.

### 6.2 The standard anatomy (every template, every time)

1. Compose the primitive's parts (Root, Trigger, Portal, Content, …). Behavior untouched.
2. Accept and forward **all** primitive props (`...props` spread onto the corresponding part). Arche adds no behavior props of its own except the declared variant axes.
3. Variants defined with `class-variance-authority` (cva); variant axes and value lists come from the manifest (§7) and nowhere else.
4. All color, radius, shadow, and motion values referenced through contract tokens (`bg-primary`, `rounded-md` deriving from `--radius`, …) — never raw values (§5.4).
5. State styling via the primitive's `data-*` attributes (`data-[state=open]:animate-in`, `data-[disabled]:opacity-50`, etc.).
6. Classes merged with `cn()` (clsx + tailwind-merge); a `className` passthrough on every exported part so end users keep an escape hatch in their own projects.
7. Every part tagged with a `data-slot` attribute (e.g. `data-slot="dialog-content"`) so CSS, tooling, and the standards checker can target parts reliably.

Example (Button, abbreviated):

```tsx
const buttonVariants = cva("inline-flex items-center justify-center …", {
  variants: {
    variant: {
      default:     "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary:   "bg-secondary text-secondary-foreground",
      destructive: "bg-destructive text-white",
      outline:     "border border-input bg-background",
      ghost:       "hover:bg-accent",
      link:        "text-primary underline-offset-4 hover:underline",
    },
    size: { sm: "h-8 px-3", default: "h-9 px-4", lg: "h-10 px-6", icon: "h-9 w-9" },
  },
  defaultVariants: { variant: "default", size: "default" },
})
```

Note that even variant class strings are written in tokens (`bg-primary`, not `bg-blue-600`), so the template itself is identity-neutral.

### 6.3 Sourcing

Templates start from shadcn/ui's open-source component implementations (nearly all 30 primitives are covered there), then are normalized to §6.2: token-only values, `data-slot` on every part, variant axes and knob wiring matched to the manifest, state classes verified. Building a template = forking and standardizing, not authoring from a blank page.

## 7. Component manifests

### 7.1 Role

One JSON manifest per component, written once, versioned per component. The manifest contains **no code and no props** — it describes the template and declares the closed control surface around it. It is the single source read by:

- the **validation schema** for identity knob selections (generated from the manifests, e.g. as Zod schemas — an undeclared knob is unrepresentable, not just rejected)
- **codegen**, which stamps templates into registry items
- **documentation** (component pages render from manifests)
- the **MCP server**, which answers agent questions (props inheritance, knobs, tokens, rules) from manifests
- the **standards checker** (§11)

### 7.2 Full manifest structure

Eight sections. Dialog shown as the worked example:

```jsonc
{
  // 1. IDENTITY — what this is
  "name": "dialog",
  "title": "Dialog",
  "description": "A modal window overlaid on the main content.",
  "category": "overlays",             // one of: actions | forms | overlays | navigation | feedback | layout | data
  "manifestVersion": 1,

  // 2. BEHAVIOR SOURCE — where behavior and props come from (never Arche-written)
  "primitive": {
    "package": "@radix-ui/react-dialog",
    "parts": ["Root", "Trigger", "Portal", "Overlay", "Content", "Title", "Description", "Close"],
    "propsInherited": true            // all Radix props pass through (§4.3)
  },
  // presentational components instead use: "native": { "element": "div" }

  // 3. ANATOMY — the slots styling and standards can target
  "slots": [
    { "name": "overlay", "part": "Overlay", "required": true },
    { "name": "content", "part": "Content", "required": true },
    { "name": "title",   "part": "Title",   "required": false },
    { "name": "close",   "part": "Close",   "required": false }
  ],

  // 4. PUBLIC API — variant axes consumers and generators can choose from
  "axes": {
    "size": { "values": ["sm", "default", "lg", "full"], "default": "default" }
  },

  // 5. STYLE SURFACE — the closed set of knobs an identity may set, per slot.
  //    Each knob is typed: enum, range, or token reference. Nothing outside this exists.
  "styleSurface": {
    "overlay": {
      "background":   { "type": "token", "value": "background", "opacity": [0.4, 0.6, 0.8] },
      "backdropBlur": { "type": "enum", "values": ["none", "sm", "md"], "default": "sm" }
    },
    "content": {
      "radiusFrom": { "type": "token", "value": "radius", "scale": ["lg", "xl"] },
      "shadow":     { "type": "enum", "values": ["lg", "xl"], "default": "lg" },
      "border":     { "type": "enum", "values": ["none", "border"], "default": "border" },
      "motion":     { "type": "token", "value": "motion-normal" }
    }
  },

  // 6. TOKENS USED — lets the system verify a token set covers this component
  "tokensUsed": ["background", "foreground", "border", "ring", "radius", "shadow-lg", "motion-normal"],

  // 7. DEPENDENCIES — npm dependencies copied verbatim; registry names translated to addresses at publish
  "dependencies": ["@radix-ui/react-dialog"],
  "registryDependencies": [],           // e.g. a form field would list "label", "button"
  "files": [{ "source": "templates/dialog.tsx", "target": "components/ui/dialog.tsx" }],

  // 8. STANDARDS — the usage law for this component (§11)
  "standards": {
    "purpose": "Present focused content or a single decision that interrupts the current task.",
    "useWhen": ["confirming an action", "editing one object without leaving the page"],
    "doNotUseWhen": ["content is long-form reading (use a page)",
                      "the action is destructive without confirmation (use alert-dialog)"],
    "rules": [
      { "id": "dialog-requires-title", "severity": "error",
        "check": "Dialog.Content must contain Dialog.Title (may be visually hidden)" },
      { "id": "dialog-no-nesting", "severity": "error",
        "check": "a dialog may not open another dialog" }
    ]
  }
}
```

### 7.3 Versioning

Manifests are versioned individually (`manifestVersion`). Adding a knob or a rule creates a new manifest version; previously published identities keep validating against the version they were generated with.

### 7.4 Two kinds of legal values: axes vs. style-surface knobs

A manifest declares legal values in two distinct places, enforced at different moments. Confusing them is a defect.

- **Axes** (§7.2 section 4) declare the legal values of the component's *public variant API* — what a consumer may pass as props (e.g. Button `variant` ∈ [default, secondary, destructive, outline, ghost, link], `size` ∈ [default, sm, lg, icon]). Enforced twice: the template's cva implements exactly these values, so TypeScript rejects out-of-set values in consumer apps via `VariantProps`; and the manifest publishes the same list to docs, MCP, and standards tooling, so an agent using an installed library can be told the legal values without reading code.
- **Style-surface knobs** (§7.2 section 5) declare the legal values for *identity-level* choices — made once per library, stored in the identity payload (e.g. "this identity's buttons default to the secondary variant"). Enforced at identity validation and emission time; an out-of-set selection is invalid by construction.

Knob declarations may reference axis values (e.g. a `defaultVariant` knob whose legal values are a subset of the `variant` axis). An identity may default to any declared variant, but it can never invent a new one: axes define the component's vocabulary; knobs define which parts of that vocabulary an identity may configure.

Token-typed knobs come in exactly two shapes, and schemas must distinguish them:

- **Token-fixed:** `{ "type": "token", "value": "--radius", "scale": [...], "default": ... }` — the knob always reads one named token; the identity may only choose where on its derived scale it lands.
- **Token-choice:** `{ "type": "token", "values": ["--foreground", "--primary", "--muted"], "default": ... }` — the identity chooses which one of the listed tokens the knob reads.

### 7.5 The knob lifecycle: declared → selected → implemented → stamped

Every knob exists in four places with four different jobs. (Worked example: Dialog's overlay opacity.)

1. **Declared** in the manifest (§7.4): the menu — which knobs exist, their legal values, their defaults. No choice is made here.
2. **Selected** in the identity payload (§8): the order — the actual value this library chose (e.g. overlay opacity 0.4, background token `--primary`, blur `md`). This payload is the *only* place a selection lives, and it is the only styling artifact an AI generator (or any other producer) ever writes.
3. **Implemented** in the template (§6): the machinery — cva variants/compound variants containing an implementation for every legal value (e.g. `bg-(--primary)/40`). The template selects nothing itself.
4. **Stamped** at emission (§9): codegen reads the selection (2), validates it against the declaration (1), and bakes it into the generated registry item (e.g. as cva `defaultVariants`).

Where custom styles are physically defined follows from this: the identity payload holds token values and selections (the look); templates hold class recipes written in tokens (the styling code); the emitted theme item compiles token values to CSS variables, which land in a consumer project's `globals.css` on install. Nothing else anywhere defines styling.

**Defined once vs. manipulated:** the contract, templates, manifests, emitter, and Radix behavior are defined once, are Arche-owned, and are versioned as a foundation. The per-identity payload — token values × both modes, plus knob selections — is the entire surface any producer (human editor, GUI, or AI) manipulates. There is no input channel by which a producer can write a class, invent a token, add a variant, or alter behavior.

**Stamped defaults are selections, not manifest defaults.** An emitted item's stamped `defaultVariants` show the *identity's selections* (§7.5 step 2), which may legitimately differ from the manifest's declared defaults when an identity deliberately overrides them. Reports and previews must never describe stamped values as "the defaults" without saying whose: manifest default, or this identity's selection. For the Arche Default identity (§8.1) the two coincide exactly, by construction.

### 7.6 Manifest ↔ template agreement

The manifest declares; the template implements; **the two must match exactly.** Both mismatch directions are defects:

- a value declared in the manifest with no implementation in the template (a dead option), and
- a value implemented in the template's cva that the manifest does not declare (an undocumented backdoor: invisible to AI and tooling, usable by hand).

The same agreement applies to `tokensUsed`: it must list exactly the contract tokens the template references. An automated cross-check (parse each template's cva axes/values and token references; diff against its manifest) is required as part of the test suite — it becomes mandatory at catalog scale-out, where manual comparison across 30+ components is not viable.

### 7.7 Manifest authoring rules (learned from the Button/Dialog review, 2026-11-01)

The first two manifests were reviewed line by line; these rules exist so every later manifest is written correctly the first time instead of re-discovering the same issues 30 times:

- **(a) Category comes from the taxonomy, verbatim.** `category` is exactly one of: `actions | forms | overlays | navigation | feedback | layout | data`. No singular/plural drift, no invented categories. (Button = `actions`, Dialog = `overlays` are the reference examples.)
- **(b) Slot `part` typing.** A slot's `part` names either a Radix part (`"Overlay"`, `"Content"`, …) or a native sub-element (Dialog's `header` / `footer` divs). Native sub-element slots must be marked as such (e.g. `"partType": "native"` alongside `part`), so tooling, docs, and agents never mistake a plain div for a primitive part.
- **(c) `registryDependencies` has one canonical internal form.** A manifest declares each internal registry dependency by its plain item name (e.g. `"utils"`). At publication the emitter deterministically converts each such name to an `@arche/<name>` address, because the stock shadcn CLI resolves bare names against its own registry. The published `all` item uses the same addresses for each included Arche item. The consumer configures `@arche` in `components.json` to point to the chosen library's registry URL template, including authentication headers when required. Npm `dependencies` remain copied verbatim. Checks compare the emitted addresses against the manifest names after this documented conversion, preserving order and membership.
- **(d) A knob may not contradict the component's own standards.** A knob's legal values must never let an identity configure the component into a state its own `standards` section forbids. Reference case: Button's `defaultVariant` knob excludes `link` from its legal values, even though `link` is a legal `variant` axis value — a button defaulting to a navigation-looking style contradicts the `button-no-navigation` rule. Apply this check to every knob at authoring time: legal-to-select must also mean legal-to-use.
- **(e) Rule ids are permanent — write them carefully.** A rule `id` is referenced by tooling and the standards checker once published, so renaming later is costly. Ids are `<component>-<plain-words>` describing the rule itself (e.g. `dialog-destructive-use-alert-dialog`, not `dialog-native-alert-on-destructive`). Proofread ids at authoring time as if they were public API — they are.

### 7.8 Legal-value richness: bounded surface, unbounded personality

The closed surface (§7.4) is not meant to be a small surface. When authoring a manifest, declare the **full useful range** of legal values at every point:

- Every axis value the primitive and template genuinely support (all real variants and sizes — no arbitrary narrowing).
- Knob enums spanning every meaningful step of the underlying scale (e.g. shadow `none | sm | md | lg | xl` where the template implements them all; opacity and blur in fine steps; every radius step; all motion tokens).
- Token-choice knobs listing every semantically plausible contract token for that role, not just the default one.
- Defaults that are the plain, expected choice (usually shadcn's), so richness never costs predictability.

The personality space is the *product* of these choices: full token sets × both modes × per-component knob selections across the whole catalog — combinatorially, effectively unlimited identities. The boundary is equally explicit: **no declared value may exceed what the Radix primitive (or native element) supports** (§4.4), and no declared value may exist without an exact template implementation (§7.6). Richness inside the boundary, never invention outside it. This declared menu — complete, exact, machine-readable — is what a future AI agent (or editor UI) adjusts; its job is choosing well from the list, and the list is Arche's design work.

## 8. The identity payload (what a library is, as data)

A user's library ("identity") is exactly three data payloads, stored server-side as the source of truth:

1. **Token set** — DTCG JSON supplying values for every token in the contract (§5.2), both modes.
2. **Knob selections** — per component, chosen values for the axes and style-surface knobs its manifest declares. Any selection outside the manifest is invalid by construction.
3. **Overrides** — user-level token overrides layered on top of generated values. Overrides are recorded explicitly and are never silently discarded by regeneration.

Everything else — component files, theme CSS, registry JSON — is derived from this payload by deterministic generation (§3). Same payload, same output, byte for byte.

### 8.1 The two canonical identities

Two named identities are maintained as fixtures and living references. Every catalog delivery (§12.1) renders both.

**Arche Default** — the un-themed library.
- **Token values are derived from shadcn's stock neutral theme** — taken from shadcn's published defaults at build time, not re-typed from memory. Preserve stock values except where necessary to satisfy the contract and WCAG AA: adjust only the lightness of any failing foreground pair, and explicitly supply contract tokens missing from the stock theme, including `--destructive-foreground` in each mode. Record each such deviation and its contrast ratio. The look is monochrome: every UI color token has zero chroma — whites, grays, and blacks only (light: white background, near-black text and primary; dark: the same scale inverted) — with `--radius: 0.625rem`, shadcn's default font stacks, and Tailwind's standard shadow shapes. Exactly two stock exceptions ship as shadcn ships them: `--destructive` (the red signal color) and `--chart-1…5` (the data palette). Everything else is grayscale in both modes.
- **Knob selections are exactly the manifest defaults** for every component — no overrides, no selections that merely coincide with defaults by accident (§7.5). What the Default preview shows is what an un-customized library is.
- Purpose: the baseline every customization is measured against, and the proof that the foundation reproduces "default shadcn" faithfully before any personality is applied.

**90s Arcade** — the customized exemplar.
- A fully authored identity exercising the surface: a vivid neon token set (both modes, all contrast pairs passing §5.4 — personality never excuses a failed pair) **and** deliberately non-default knob selections across many components (radius extremes, overlay blur/opacity, shadows, motion, default variants), so the customization shows in component *behavior of the surface*, not just in colors.
- Purpose: the demonstration that one foundation produces radically different libraries from data alone — the same templates, the same Radix behavior, a different payload.

Both are hand-authored test data until AI generation exists; both must validate clean through the same pipeline as any user identity.

Out of scope for this spec (interface noted only): *how* the payload is produced — manual editing, GUI controls, or AI generation from a description or image. All producers write the same payload and pass the same validation.

## 9. The registry

### 9.1 What a registry is

A registry is JSON served over HTTP, conforming to the shadcn registry and registry-item schemas. Each item is self-contained: component source inlined in `files[]`, plus `dependencies` (npm packages, e.g. the Radix primitive) and `registryDependencies` (other items). Installing an item = fetch JSON → resolve dependencies → write files to the project's configured paths → npm-install the packages → merge CSS variables.

### 9.2 How Arche's registry is produced

A shadcn registry is normally authored as one catalog file (`registry.json`) and compiled with `shadcn build` into one JSON file per item (default output `public/r/<name>.json`), then hosted anywhere that serves JSON over HTTP.

Arche's variant: because every library is generated per user, item JSON is produced **at publish time from the identity payload** (§8) — either emitted as static files or served by dynamic route handlers returning the identical payloads. Both are schema-identical to `shadcn build` output; consumers cannot tell the difference. Serving route shape:

```
https://arche-ui.dev/r/<user>/<library>/<component>.json
```

### 9.3 Registry contents per library

- One item per component in the library (from its template + manifest, §6–7).
- One **theme item** carrying the compiled token set as CSS variables (`cssVars` + CSS for `:root` / `.dark`), plus the `cn()` utility and any global styles — everything a project needs beyond individual components.
- One **"all" item** whose `registryDependencies` list every component, enabling whole-library installation in one command.

### 9.4 Public and private

Public libraries are served openly. Private libraries are entitlement-checked on the server before any item JSON is returned; requests must carry the user's token (§10.3). The registry JSON for a private library is never present in any public bundle or page.

### 9.5 Versioning

Publishing creates an **immutable snapshot** of the derived registry JSON. Edits to the identity payload produce a new version on the next publish; previously published versions remain servable, so an install performed yesterday is reproducible today.

---

## 10. The CLI

### 10.1 Distribution and naming

The CLI is a single npm package installed on demand (`npx`) or globally. There is **one** CLI for all users and all libraries; a library is identified by argument (`<user>/<library>`), never by a dedicated package.

Naming constraint: the bare `arche` package name on npm is already actively published by a third party. The package is therefore expected to be scoped (e.g. `@arche-ui/cli`); the installed **command name remains `arche`** (package name and binary name are independent on npm).

### 10.2 Command surface (v1)

```
arche login                 sign in (browser flow); stores a token locally
arche logout                remove the local token
arche whoami                show the signed-in account
arche init <user>/<library> wire this project to a library (see §10.3)
arche add <component>       install one component from the wired library
arche install               install the whole library (the "all" item, §9.3)
arche list                  list the wired library's components
arche check                 run the standards checker over this project (§11)
```

`arche doctor` (project-setup validation) may be added without changing any of the above.

### 10.3 How login and installation work in v1 (thin wrapper)

The CLI v1 **delegates installation mechanics to the shadcn CLI** and adds the account layer shadcn lacks:

1. `arche login` opens the browser sign-in flow; the CLI receives and stores the account token in a local config file (the pattern used by `gh`, `vercel`, `supabase`).
2. `arche init <user>/<library>` writes the library's namespace into the project's `components.json`, pointing at the Arche registry route (§9.2) **with the authorization header wired to the login token**. (Raw shadcn supports auth headers in `components.json`, e.g. `Authorization: Bearer ${REGISTRY_TOKEN}` — the CLI's job is to make this invisible: no user ever edits a header or an environment variable by hand.)
3. `arche add <component>` invokes the shadcn CLI against that namespace. The server checks the token's entitlement before serving private item JSON. shadcn performs dependency resolution, file writes, npm installs, and CSS merging.

The user experience is entirely Arche; the file-writing mechanics are shadcn's proven engine. Explicitly avoided: smuggling component installation into an npm `postinstall` script — fragile and treated as hostile by the ecosystem's security tooling.

Components-as-npm-packages (publishing each library as a private scoped npm package installed into `node_modules`) was considered and **rejected**: it deletes the copy-and-own model (Principle 5).

### 10.4 v2: own install engine (planned, not in v1 scope)

A later CLI version may replace the shadcn delegation with Arche's own installer, enabling install-time standards enforcement and independence from shadcn's format evolution. The migration is invisible to users **provided** Principle 6 holds: v1 commands must not leak shadcn-specific quirks into Arche's UX or project files beyond the standard `components.json` the ecosystem already uses.

## 11. Standards layer

An identity is three layers: **tokens** (the look, §5), **components** (the parts, §4), and **standards** (the laws of use). Standards live **inside each component's manifest** (§7.2, section 8) — purpose, `useWhen` / `doNotUseWhen`, and checkable rules — so a component can never drift away from its own rules, and all enforcement surfaces read one source.

Representative rule classes:

- Function fit: a component may only be used where its declared purpose criteria are met (navigation is a Link's job; a Button acts).
- Composition: e.g. exactly one primary action per view region; a dialog requires a title and may not nest.
- Safety: destructive actions require the destructive variant plus a confirmation pattern.
- Accessibility: icon-only buttons require an accessible label and a minimum target size.
- Token discipline: no hardcoded colors or spacing where a contract token exists.

Enforcement surfaces (staged):

1. **MCP pre-placement checks** — an agent asking to place a component receives the rules, and a violation returns "no, with reason" before code is written.
2. **Editor/Studio flags** — violations surfaced where identities and screens are edited.
3. **`arche check`** — scans a codebase against the manifests; suitable for CI.

Strict vs. advisory enforcement is an open decision (§13).

## 12. Library creation flow and publish gates

End-to-end, creating and shipping a library:

1. **Choose components** from the catalog (§4).
2. **Supply the token set** — values for the full contract, both modes (produced by any means; §8).
3. **Set knobs** — per component, within each manifest's declared surface.
4. **Validate** — token set covers every component's `tokensUsed`; knob selections validate against the manifest-generated schemas; contrast pairs pass (§5.4).
5. **Generate** — templates stamped with selections; token set compiled to theme CSS; registry items + theme item + "all" item emitted (§9.3). Deterministic: same payload → byte-identical output.
6. **Verify** — generated files typecheck; a preview render of the library succeeds. A library that fails verification cannot publish.
7. **Publish** — the derived registry JSON is stored as an immutable versioned snapshot (§9.5); the install route (§9.2) and CLI wiring (§10.3) go live.

No step in this flow requires AI. Generation of the payload itself (§8) is a separate layer that plugs into step 2–3.

### 12.1 The preview standard: two scratch apps, comprehensive and minimal

Step 6's "preview render" is made concrete as **two separate scratch apps**, one per canonical identity (§8.1). Separate apps — not a theme toggle inside one app — because each must show a real end-user install of one library, produced by the stock install path (serve registry → `add` → render).

- **Preview A — Arche Default.** A scratch app with the Default identity installed: monochrome, manifest-default knobs.
- **Preview B — 90s Arcade.** A *separate* scratch app with the 90s Arcade identity installed: the same components and test page, visibly different in tokens **and** knob selections.

Both apps render the **same single test page**, which is:

- **Comprehensive:** every catalog component appears, with its principal variants and states exercised (all button variants/sizes, an openable dialog and alert dialog, form controls in default/checked/disabled states, menus, tabs, tooltip, etc.), and both light and dark modes reachable via the `.dark` class.
- **Minimal:** one page, one section per component, labeled with the component's name and nothing else — no marketing chrome, no extra pages, no decorative layout beyond what the components themselves need to be seen and used.

A preview is a **snapshot**, not a live view: it renders the installed copies. Refreshing a preview means re-running the pipeline (edit payload → emit → `add` → refresh), never hand-editing the scratch app's installed files. Both scratch apps are kept as the standing regression harness: every future catalog or foundation change is re-installed into both and compared.

## 13. Open decisions

| # | Question | Status |
|---|----------|--------|
| O1 | Standards enforcement: strict (violation fails `arche check` / placement) vs. advisory (warnings, overridable)? | Open |
| O2 | Final npm package name / scope for the CLI (bare `arche` is taken). | Open — command name is `arche` regardless |
| O3 | Registry emission: static files at publish vs. dynamic route handlers (payloads identical either way). | Open — implementation detail, decide at build |
| O4 | DTCG toolchain pin: which Style Dictionary / Terrazzo version and which DTCG draft it implements. | Open — decide at build |
| O5 | Theme item delivery of fonts: self-hosted font files vs. system/Google fonts references. | Open |

## 14. Explicit non-goals for this spec

- React Native (later phase; the token contract and manifest design must not preclude it, but nothing here specs it).
- The CLI's own install engine (v2, §10.4).
- AI generation of identities (word/phrase/image → payload), the DNA layer, and remixing — these produce the §8 payload and will be specced separately.
- The public website, dashboard, gallery, pricing/billing, and hosted MCP service.
- Catalog growth beyond §4 (date pickers, data tables, charts) — requires a spec amendment per §4.1.

---

*End of spec v1.2. Amendments are made by editing this document and bumping the version; decisions D1–D8 change only with Terry's explicit direction.*
