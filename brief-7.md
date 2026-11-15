# Arche UI — Agent Build Brief #7: The Invisible Blocks Layer

**Audience:** an AI coding agent (or developer) working inside the Arche monorepo.
**Prerequisites (already done — do not redo):** Briefs #1–#6 complete; the combined polish prompt (Parts 1–7) implemented; the design-rules registry (`design-rules.json`, teach + enforce tiers) live in foundation; Font Registry v2 (29 fonts) decided; the 20-block base from Part 6 exists as hand-authored, token-only blocks. If the actual tree differs, adapt paths, keep the package boundaries, and note the deviation in your final report.
**Governing specs:** Library Creation Spec v1.4 (§5 token contract, §5.4 absolute AA gate, §7 manifests); Product Spec §12 (pricing/create-apply split); Brief #6 Shapeshift (DNA + deterministic style compiler); the design-rules prompt; the font-registry prompt (2026-11-10); the combined prompt Part 6 (blocks) and Part 7 (preview + real-time editing). Where specs and this brief disagree, the spec wins — flag the conflict, never silently choose.

---

## 1. Product context — what this brief is

Everything before this brief made identities *generatable* (Shapeshift) and *installable* (blocks). This brief makes pages *generatable without ever showing the machinery*: the user describes what they want, picks from staged options, and receives a complete page that feels spontaneously designed. The block library is the mechanism; it is never the interface.

> **Genres × skeletons × identity.** A genre (page type) selects a block sequence. Each block is a family of hand-authored layout variants (skeletons). The identity supplies everything visible — background, typography, radius, containers, effects. The AI selects; the user never picks a block.

The three systems this brief wires together:

1. **Verified color standards** — the guarantee that every generated identity is clean, not just pretty.
2. **The taste system** — the rules that make output feel designed, not default.
3. **Curated fonts** — the closed registry that makes typography beautiful by construction.

---

## 2. Non-negotiable rules

1. **The AA gate is absolute** (Spec §5.4). No identity, page, or variant ships unless it passes WCAG AA: text ≥ 4.5:1 (large ≥ 3:1), non-text ≥ 3:1. A failure is a failed generation — surfaced as an error, never saved as a draft.
2. **The AI never writes tokens, classes, or component code.** It outputs DNA + palette anchors only (Brief #6). The deterministic style compiler maps DNA → payload. Same DNA + anchors + `compilerVersion` → byte-identical payload.
3. **The block layer is invisible in generation.** No block catalog UI, no block picker, no block names in the generation flow. The user describes intent; the system selects genre, block sequence, and per-block variant. A user may ask for an alternative ("try a different hero") — that swaps the variant behind the scenes, never by naming a variant.
4. **Blocks are skeletons only.** Structure + typed content slots, zero hardcoded values. Every color, font, radius, spacing, and effect derives from the identity's tokens. A block that contains a raw hex, a raw font size, or a raw spacing value fails lint.
5. **Closed registries stay closed.** Fonts come only from Font Registry v2 (29 fonts, IDs only); colors only from the design-rules budgets; type sizes only from the closed type-scale registry. Generation never extends a registry.
6. **One model call per generation.** The staged picker (Deliverable 3) is UI over one structured generation response — options are sections of that response, not separate generations. Picker selections are DNA deltas; recompilation is deterministic and free of model calls.
7. **Generation lands as drafts; publishing stays explicit** (Brief #5/6). Variants, picker choices, and generation logs are recorded per draft.

---

## 3. Deliverable 0 — Verification: color design standards, enforced

Build the verification suite that proves the guarantee instead of asserting it. Sources: WCAG 2.2 (the only hard standard); Radix Colors' 12-step role rules (step 1 app bg, 2 subtle bg, 3–5 component bg, 6–8 borders, 9 solid/highest chroma, 10 hover, 11/12 text); Material 3 HCT tonal roles; the design-rules prompt's Arche-set OKLCH budgets.

- **Enforce-tier checks in the validator** (already in `design-rules.json` — wire them into a runnable suite with pass/fail per rule id): background chroma cap C ≤ 0.025 light / 0.035 dark; text ≤ 0.05; borders ≤ 0.04; solids in the 0.08–0.24 chroma band; chroma taper at lightness extremes; neutrals tinted to the brand hue (±15°); one primary hue family + at most one accent family (enterprise profile: no accent family); chart ΔE separation.
- **Contrast verification:** every token pair that can meet (text on bg, text on solid, border on bg) computed in OKLCH and checked against AA, in both modes, for Arche Default, 90s Arcade, the aurora identity, and every generated fixture. Report per-pair ratios; any pair below AA fails the suite.
- **Calibration report:** run the budgets against reference token sets (Radix, Carbon, Primer, shadcn themes) and record where Arche's budgets are stricter or looser, with the numbers. Do not invent numbers — if a reference cannot be measured, say so.
- **Compiler clamp-repair:** any generated value outside a budget is clamped into it by the compiler (lightness-only for contrast), logged in `meta.adjustments[]`. Manual edits get findings, never silent clamps (Brief #6 rule 6).
- **Acceptance:** the suite runs in CI against all fixtures + 10 generated identities from random DNA corners; zero AA failures; every clamp logged and explainable by rule id.

## 4. Deliverable 1 — The taste system

The taste system is a registry of named, teachable rules — the layer that makes output feel designed. Sources: the Niki Aroca digest (`arche-design-standards-digest-niki.md` — 45 reels, 20 teaching reels), Pierre Delcour's reel (2026-11-11), the Hallmark tell list, Anthropic's frontend-design skill.

- **Two quiet, one loud (enforce + teach).** Already enforced by the chroma budgets (Deliverable 0). Add the missing teach-tier rules: accent **surprise** (accent hue family must contrast with the base pair — blue-on-blue is "predictable" and scores low; the compiler's palette step reports a surprise score), accent **placement** (accent lands on the primary CTA and the focal word only, never on backgrounds or body text), and **evocative names** (every generated palette's 4–6 colors get names persisted into payload metadata and shown in Studio/specimens — e.g. Sakura Pink, Neon Pear — never bare hexes in the user-facing surface).
- **Art directions as first-class registry entries.** A direction = base + treatment = named style, each with palette philosophy, font pair (from the 29), imagery treatment, motion feel, and layout grammar. Seed with these, each mapped to DNA ranges so the compiler can land on one: **Glassmorphism** (material: glass, translucency, soft borders), **Swiss Poster** (sharpness + formality high, grid layout, grotesque type), **Typographic Maximalism** (display type scale at max, oversized wordmarks, sharpness high), **Tactilism** (texture: grain/scanlines, tactile surfaces), **2000s Futurism** (retroFuturism high, chrome/glitch motion), **Soft Spa** (warmth high, mist backgrounds, pill radius — the dental-clinic direction), **CRT Hardware** (pixel material, scanlines, chunky borders — the retro game shop direction), **Boardroom Red** (formality high, signal red reserved for wordmark/CTA/key numbers — the enterprise direction). The generator selects a direction from genre + content + DNA; the direction is stored on the identity and shown in Studio. Directions are data, not code — adding one is a registry entry, never a code change.
- **Anti-slop tell list (teach-tier).** Hallmark's tells mapped onto Arche's tiers: eyebrow above every heading, tracked-capital labels, one coloured word in a headline, hero that misses its screen, email sign-up at the end of every page, untouched default shadcn look, purple→blue gradients, three feature cards in a row, generic 3-tier pricing. Each tell is a named check in the generation self-check section; a generated page that trips one must revise before compiling.
- **Imagery rules (block Standards candidates, permanent ids).** Full-bleed imagery over filler stock; product-as-background; photo-forward cards; boring stock imagery is a website killer. Imagery treatment derives from the identity (duotone/tint from palette; grain overlay 0.04–0.08 opacity via SVG `feTurbulence`, never a baked hero image). Headline discipline: 11 words max as a checkable block standard.
- **Fix order (teach-tier).** Layout → contrast → typography → spacing/clutter → accent. Decoration last. The generation self-check follows this order.
- **Do NOT import:** Niki's literal hexes (frequent WCAG failures — the AA gate is the differentiator); Hue's prose-skill output as a payload format (study-only, Brief #6 stays a deterministic compiled payload).

## 5. Deliverable 2 — Curated fonts, wired into generation

Font Registry v2 is decided (29 fonts: 17 Fontshare + 12 Google). This deliverable wires it into the generation path — it does not re-decide the list.

- **Registry entries** (ID, family, source, classification, allowed slots, verified weights/italics, display-only flag, loading method, fallback). Load Fontshare faces via Fontshare's own CSS API; Google faces via `next/font`; never CSS `@import`; never vendor Fontshare files (ITF license forbids redistribution).
- **Two-font pairing model.** The generator selects a *pair*, never independent fonts: display (personality/headings) first by DNA/profile, body (readability/UI) for compatibility. Max two non-mono families per identity; mono is a functional third (code/data/labels). Rules: expressive display + quiet body; serif display + clean sans body; single family may fill both slots; never two unrelated expressive displays; display-only fonts never in body; body must ship regular/medium/semibold/bold. Seed pairs: Cabinet Grotesk + Satoshi; Clash Display + General Sans; Zodiak + Switzer; Sentient + Cabinet Grotesk; Bespoke Serif + Satoshi; Melodrama + General Sans; Space Grotesk + Work Sans; Archivo + Public Sans.
- **Validator rejects:** unregistered font, raw stack, display-only in body, unavailable weight/italic, >2 non-mono families, incompatible pair.
- **App identity:** apps/web uses Cabinet Grotesk headings + Satoshi body, keeping JetBrains Mono. Do not change the Arche Default library fixture (Inter/Geist Mono).
- **Acceptance:** computed-style verification across landing/dashboard/Studio/kitchen-sink/preview in light + dark; registry = exactly 29; generator cannot select a legacy font.

## 6. Deliverable 3 — The invisible blocks layer

**The block base (Part 6, already decided — wire it, do not re-decide it).** 20 blocks: marketing 11 (site-header, hero, logo-cloud, features, stats-band, testimonials, pricing, faq, cta, newsletter-signup, site-footer) + application 9 (app-shell, dashboard-home, stats-row, data-table-page, settings-page, activity-feed, empty-state, auth-login, auth-signup). Each block is a family of layout variants — hero: center / split / bento; features: grid / bento / split; pricing: 3-tier / 4-tier / comparison. Target ~3 variants per block (~60 skeletons). Block manifest = component manifest + `composition` (typed contentSlots with cardinality, childComponents = catalog only, layoutAxes, Standards with permanent ids, e.g. `hero-one-primary-cta`, `pricing-max-four-tiers`, `testimonials-no-fabricated-quotes`). Full pipeline parity: emitter, publish-gate AA, `arche add` install, MCP `list_blocks`/`get_block` + `check_placement` (incl. the two-hero/one-h1 heading-role rule), docs/gallery pages. Shapeshift does not generate blocks — they are hand-authored Arche assets; identities skin them.

**Variant selection (the new work).** A deterministic selector in registry-core, keyed to genre + content + identity:

- Input: genre (page type), content signals (product category, audience, media available, tone words), DNA, art direction.
- Output: per-block variant id + the reason (recorded on the draft: genre, content signal, direction). The same block yields different variants per context by design — a mobile product page gets the app-store hero; a construction company gets the big-imagery, left-aligned, bold-type hero. Background shape and title placement are variant properties, not user choices.
- "Try a different hero" swaps to the next-ranked variant for the same block — behind the scenes, never by naming variants.
- **Style-proofing:** every variant is rendered against Arche Default, 90s Arcade, aurora, and extreme DNA corners at three widths (the kitchen sink is the test harness). A variant that overflows or breaks contrast under any identity fails. Type-scale-aware skeletons flex with the scale; loud display type must not break quiet layouts.

**Skeleton sources — study and adapt, with the legal line drawn.** MIT-safe to adapt structurally: **Tailark** (~150 free marketing blocks: 36 hero, 40 features, 15 pricing), **Velora UI** (31 free blocks, token-pure, no hardcoded hex — the closest model of the skeleton Arche wants), official shadcn blocks (27, MIT — sidebars/login only). Study-only, never copy code (licenses forbid redistribution in a kit/builder): shadcn.io (6,231 blocks), shadcnblocks.com, Shadcn Studio, Untitled UI PRO, Relume, Framer/Webflow templates. **Do not use Tailwind Plus** — closed to new customers (Sep 2026). References are structural only (composition, file layout, dependency declaration) — never their styling, class recipes, or content; Arche blocks must pass Arche's own token-only lint, which the references themselves would fail. Gaps to hand-author first (no source covers them well): settings/data-table variants, onboarding, empty states, billing/checkout, newsletter as a first-class block.

**Genres (blueprints).** Genre = page-type recipe: an ordered block sequence with required/optional/forbidden blocks, content rules, and variant preferences. First four: landing, product, auth, dashboard. A genre recipe is data (a blueprint file), consumed by the agent skill and by Studio alike — this brief does not decide the external-vs-internal skills fork; it makes the blueprints usable by both.

## 7. Deliverable 4 — Staged pickers (retention + vision)

The picker's job is twofold: it teaches the system what the user actually wants (vision capture), and it makes the user *invest* in the identity before it exists (retention — a draft the user co-authored is a draft they return to).

- **Flow (one prompt, staged UI).** Step 0: one chat input ("a booking app for a dental clinic"). The model reasons once and returns a structured response with three ordered sections (plan → options → final DNA). Steps 1–3 present options from that response: (1) **palettes** — three named options with evocative names, each previewed live on a real component; (2) **examples** — three real reference identities/sites ("which feels closest?"), drawn from Arche's public gallery and the allwebsites.design model (structured records: palette + typefaces + stack per site); (3) **words** — descriptive chips (calm, bold, playful, premium, retro) mapping directly onto the 8 DNA axes. Step 4: live preview re-skins as selections change; "Generate my identity" compiles deterministically. Each selection is a DNA delta; the draft autosaves (debounced, with indicator) so the user can leave and resume.
- **Retention mechanics.** The draft persists with its picker history (prompt + selections + direction); returning users see "continue your identity"; remix creates an owned draft copy, never mutating the original. Publish is never implicit.
- **Acceptance:** a first-time user reaches a compiled identity in ≤ 4 steps; every picker selection changes the preview instantly with no reload; the whole flow uses one model call (verified by a call-count test — a second call only on the pre-existing Brief #6 failure paths); a draft survives a session break and resumes exactly.

## 8. Out of scope — do not build

Full app generation (auth, databases, business logic, deployment) — page generation only. Self-hosted registry/docs export. Any change to the 29-font list, the pairing rule, the AA gate, or any enforce-tier rule (candidates only, Arche wins conflicts). The external-vs-internal page-skills fork. Stripe/billing. React Native.

## 9. Acceptance criteria

1. Verification suite (D0) green in CI: zero AA failures across fixtures + 10 random-DNA identities, both modes; every clamp logged with rule id.
2. Calibration report delivered with measured reference numbers, gaps stated, nothing invented.
3. Taste system (D1) live: surprise score + placement rule + named colors in payload metadata; 8 seed art directions selectable by the compiler and shown in Studio; anti-slop self-check runs before compile.
4. Fonts (D2): registry = exactly 29; generator selects pairs only; validator rejects all six illegal cases; Cabinet Grotesk + Satoshi verified in apps/web (light + dark, all surfaces); Arche Default fixture untouched.
5. Invisible blocks (D3): 20 blocks × ~3 variants each, all token-only; selector keyed to genre + content + identity with recorded reasons; "try a different hero" swaps a variant with no block names shown; every variant passes the identity-matrix × 3-width render test.
6. Staged picker (D4): ≤ 4 steps to a compiled identity; instant preview re-skin; one model call (call-count test); draft resumes after a session break.
7. End-to-end: prompt → picker → compiled identity → publish → CLI install → kitchen-sink render, in the aurora identity and one generated identity, light + dark.
8. No regressions: Brief #6's 12 acceptance criteria still pass; the 39 combined-prompt criteria still pass; O1 untouched.

## 10. Sources

- WCAG 2.2; Radix Colors 12-step role rules; Material 3 HCT tonal palettes (design-standards research report, 2026-11-08).
- Niki Aroca digest: `files/arche-design-standards-digest-niki/arche-design-standards-digest-niki.md` (45 reels, 29-row palette table, fix order, anti-slop list).
- Pierre Delcour reel, 2026-11-11 (five base + treatment combos).
- Font Specimen Review artifact + font-registry prompt (2026-11-10/11); Fontshare ITF Free Font License (API load only, no redistribution).
- Block skeleton sources report: `arche-ui-market-validation` and `block-skeleton-sources-comprehensive-list` artifacts (Tailark, Velora, shadcn.io, Untitled UI, Shadcn Studio; Tailwind Plus closed Sep 2026).
- Market validation report (2026-11-11): wedge = guaranteed installable asset; segment = freelancers/small agencies.
- allwebsites.design (304 sites, palette + type + stack per record) — model for the example-picker corpus and the public identity gallery.
