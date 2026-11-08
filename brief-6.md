# Arche UI — Agent Build Brief #6: Shapeshift (AI Identity Generation)

**Audience:** an AI coding agent (or developer) working inside the Arche monorepo.
**Prerequisite (already done — do not redo):** Brief #5 is complete and its acceptance criteria pass: the MCP server (local stdio + hosted) exposes the catalog, identity, validation, placement, and write tools through the Brief #3–4 validator and publish gate. The dashboard (Brief #3) has the manual identity editor, the publish flow, and a "Describe it" creation door that currently pre-loads the closest fixture, labeled as a starting point — the honest pre-AI behavior. The foundation contains the font and icon registries (identities select registry IDs, never raw stacks or package names). If the actual tree differs, adapt paths, keep the package boundaries, and note the deviation in your final report.
**Governing specs:** "Spec Addendum A1" **§A1.3 (Design DNA)** and **FR-SHIFT-1…3** for the generation model; "Arche UI — Product Spec" (2026-10-28) **FR-GEN-1…6** and **§12.4** for generation mechanics and metering; "Arche UI — Library Creation Spec v1.4" for the payload (§8), the token contract (§5), the absolute AA gate (§5.4), and the manifests (§7). **Reconciliation rule:** where the older documents assume the pre-restart spec model, the restart architecture governs — the payload is token set + knob selections (+ font/icon selections), and DNA is added to it as a stored layer (§4), not as a replacement for it. Where specs and this brief disagree, the spec wins and you must flag the conflict rather than silently choosing.

---

## 1. Product context (minimum you need)

Everything before this brief made identities *manageable*: created by hand in an editor, installed by a CLI, applied by agents over MCP. Shapeshift makes them *creatable from intent*: a user types a word or phrase — or uploads an image — and gets a complete, valid, publishable identity. This is the product's signature moment ("Say a word. Get an identity."), and it is deliberately the **last** layer built, because it is only safe on top of everything beneath it:

> **The AI never writes tokens, classes, or component code. The AI produces Design DNA. Deterministic code — the style compiler — maps DNA → the payload.** (Addendum A1.3)

DNA is a small, closed schema (eight 0–1 axes plus three enums, §4). That constraint is the whole design: AI output stays inspectable, diffable, and reproducible; the compiler — versioned Arche code, not a model — owns every mapping into tokens, knob selections, and font/icon picks; and the finished payload passes the **same validator and publish gate** as a hand-made one. A generated identity is not a special kind of object. It is a payload with provenance.

## 2. Scope of this brief

Work in this order; each deliverable's checks must pass before the next begins.

0. **DNA in the payload** (§4): the DNA schema, provenance, and payload integration; DNA backfilled for the existing fixture identities.
1. **The style compiler** (§5): deterministic DNA → payload compilation in `packages/registry-core`, including the AA adjustment pass.
2. **The generation service** (§6): provider-agnostic LLM calls (text + image), structured output, logging and metering.
3. **Studio wiring** (§7): the "Describe it" door goes live; the DNA card; prompt edits; full-catalog preview.
4. **MCP + landing surfaces** (§8): a hosted MCP generate tool over the same service; the landing prompt becomes a real entry point.
5. **Docs** (§9): the Shapeshift and Design DNA docs become true.

**Explicitly out of scope — do not build:** the **blocks/templates composition layer** (generating sections and pages — a separate, still-undecided brief; this brief generates *payloads only*, and nothing here may preclude a later composition layer consuming them); Absorb (FR-APPLY-2); Remix *execution* (starting from an existing identity as an edit base is §7's prompt-edit flow; forking another user's public identity stays unbuilt); Stripe/billing (metering counts and a config cap ship here, §6 — charging does not); deciding strict-vs-advisory standards enforcement (spec O1 — generation validates against the manifests regardless of how placement enforcement is later set); any change to templates, manifests, the token contract, or the font/icon registries (a mapping gap is a compiler bug or a flagged spec conflict, never a quiet registry edit); React Native.

## 3. Non-negotiable rules

1. **DNA is the AI's entire output surface.** The model's structured output schema contains DNA fields (§4) and palette anchors (§5) — and nothing else. There is no code path by which model output becomes a token value, a class, a knob selection, or a font stack directly. Compiler code, and only compiler code, performs those mappings.
2. **Determinism after the model.** Same DNA + same palette anchors + same `compilerVersion` → byte-identical payload. The model is the only nondeterministic step, and its output is stored, so any identity can be recompiled forever without calling a model again.
3. **The AA gate is absolute — including for AI output** (library spec §5.4). The compiler's adjustment pass (FR-SHIFT-2) fixes contrast by **lightness-only** changes, never hue/chroma family, and records every adjustment in the payload's `meta.adjustments[]` (the §8.1 mechanism) and the generation log. A payload that still fails validation after adjustment is a failed generation — surfaced as an error, never saved as a draft.
4. **Closed registries stay closed.** Font and icon selections come only from the foundation's registries, chosen by the compiler's mapping tables, stored as registry IDs. A DNA combination that would want an unlisted font gets the closest legal pick — the registry is never extended by generation.
5. **Generation failure changes nothing** (FR-GEN-6). Invalid model output, provider errors, and validation failures leave the user's existing drafts and published versions untouched. Creations land as **drafts**; publishing is always the separate, explicit, existing action.
6. **Edits are diff-scoped** (FR-GEN-3). A prompt edit produces a DNA *delta* (only the axes/enums the prompt implicates), recompiles, and reports the payload diff. Unrelated payload fields are byte-identical before and after. User overrides (§8 of the library spec) survive recompilation and are never silently dropped — where an override and a newly compiled value target the same token, the override wins and the Studio marks it (§7).
7. **Every generation is logged and metered** (FR-GEN-5, §12.4): prompt (or image reference), the DNA produced, the payload diff, the model used, token counts, and any AA adjustments — one row per call, including failed calls (marked failed, with the reason).
8. **Secrets stay server-side.** LLM provider keys live in server environment configuration only. No provider-specific types leak into payloads, the compiler, or the MCP surface (FR-GEN-4).

## 4. Deliverable 0 — DNA in the payload

**The DNA schema** (Addendum A1.3, verbatim — Zod, every field required unless noted):

- Numeric axes, each a number in [0, 1]: `warmth` (cold/clinical → warm/organic), `energy` (calm → loud), `playfulness` (serious → playful), `sharpness` (soft/round → sharp/angular), `density` (airy → compact), `ornament` (minimal → ornate), `retroFuturism` (contemporary → era-styled), `formality` (casual → formal/institutional).
- Closed enums: `material` ∈ {flat, paper, glass, metal, marble, pixel, clay}; `motionFeel` ∈ {snappy, smooth, bouncy, stately, glitchy}; `texture` ∈ {none, grain, scanlines, grid, marble-vein, halftone}.
- Guardrails: `minContrast: "AA"` (the restart spec's gate is absolute AA — the addendum's AA/AAA choice collapses to AA here; record this reconciliation in the final report) and `respectReducedMotion: true` (fixed, not user-disableable).

**Payload integration.** The identity payload gains a top-level section alongside the token set and knob selections:

```jsonc
"dna": {
  "source": { "type": "phrase" | "image" | "fixture" | "remix" | "manual",
              "promptText": "…",            // when type = phrase
              "sourceRef": "…" },           // storage key, when type = image
  "axes": { /* the A1.3 dna object above */ },
  "palette": { "primaryHue": 0, "accentHue": 0, "neutralHue": 0 },  // §5 — degrees, 0–360
  "compilerVersion": 1
}
```

The foundation validator is extended to validate this section when present (older payloads without it remain valid — DNA is required for *generated* identities, optional for manual ones). The payload's existing parts do not change shape.

**Backfill.** Author DNA for the identities that already exist so every surface (DNA card, MCP `get_identity`) works uniformly: the six launch fixtures ("90s arcade", "ancient Greece", "calm hospital", "brutalist bank", "Y2K chrome", "cozy bookstore"), Arche Default, 90s Arcade, and the **Arche (aurora) identity** — labeled `source.type: "manual"` (or `"fixture"`), values chosen to describe them honestly. Backfilled DNA is descriptive metadata for these hand-authored payloads; do **not** recompile them from it (their token sets stay exactly as authored — recompilation is for generated identities).

## 5. Deliverable 1 — The style compiler

A new module in `packages/registry-core` (per A1.3, the compiler lives with the registry machinery), importing foundation data (token contract, manifests, font/icon registries). Input: `{ axes, palette }` + compiler version. Output: a complete payload body — token set (both modes), knob selections, font/icon selections — assembled **on top of the Arche (aurora) identity as the base payload**, so anything the mappings don't address inherits sane, complete values and the output covers the full contract by construction.

The mappings (implement as explicit, versioned tables/functions — this code is Arche's design IP, and it must be readable as such):

- **Palette → color tokens.** Build Radix-Colors-style 12-step scales from the hue anchors: `warmth` shifts chroma and the neutral hue toward/away from warm; `energy` and `playfulness` raise chroma on the primary/accent scales; `formality` suppresses it. Steps map onto the contract's semantic tokens per the §5 methodology, for both modes. Destructive and chart tokens keep their defined roles (chart scale derives from the anchors by fixed hue offsets).
- **Geometry.** `sharpness` → the `--radius` base via a fixed mapping (0 → fully rounded scale, 1 → 0 radius), and radius-adjacent knob selections where manifests offer them.
- **Density.** `density` → size/density-flavored knob selections the manifests declare (e.g. default size selections) — only values the manifest for each component actually declares; components without such knobs are untouched by this axis.
- **Material / texture / ornament.** → shadow token shapes, border and overlay knob selections (e.g. `glass` favors blur selections where declared), and surface treatments — again, only through declared legal values.
- **Motion.** `motionFeel` → the motion tokens (duration/easing pairs per enum — e.g. snappy = short + sharp easing, bouncy = spring-like easing curve, stately = longer + smooth) and motion knob selections.
- **Typography + icons.** Deterministic picks from the registries by axis table — e.g. `material: "pixel"` or high `retroFuturism` + `playfulness` makes the expressive display fonts eligible; high `formality` selects the sober sans set; mono follows the sans family logic. The icon library defaults to `lucide` unless the table says otherwise. Picks are recorded in the payload as registry IDs (Rule 4).
- **AA adjustment pass** (Rule 3): run the foundation contrast checks over the compiled token set; on any failing pair, adjust that token's lightness in fixed steps until it passes (hue/chroma untouched); record each adjustment (token, compiled value, adjusted value, pair, ratios) in `meta.adjustments[]`. Then run the **full payload validator**; any failure (coverage, knob legality, font role rules, contrast) fails compilation loudly — a compiler that emits an invalid payload has a bug, and the error must say which mapping produced the offending value.

**Golden tests.** For a fixed battery of DNA inputs (including the six launch fixtures' backfilled DNA), compile twice → byte-identical; snapshot the outputs as golden files. A compiler change that alters output must bump `compilerVersion` and regenerate goldens deliberately — silent drift is a test failure.

## 6. Deliverable 2 — The generation service

Server-side in `apps/web` (a shared service module the dashboard routes and §8's MCP tool both call — one implementation).

**Provider layer (FR-GEN-4).** All LLM access behind one internal interface (`generateDNA(input) → { axes, palette }`), provider and model chosen by environment configuration (e.g. `LLM_PROVIDER`, `LLM_MODEL`), using structured output constrained by a Zod schema containing **exactly** the §4 axes + palette anchors (Rule 1). The chosen model must support image input for the image door; validate this at startup/config time and say so plainly if the configured model can't.

**Text door (FR-SHIFT-1).** Input: a word or short phrase (enforce a sane length cap). The prompt instructs the model to judge the phrase on each axis/enum and choose palette hues. Output validated against the schema: invalid → **one** retry with the validation errors fed back; still invalid → generation fails (Rule 5), logged as failed.

**Image door (FR-SHIFT-1).** Input: an uploaded image (validate type/size; store privately; `sourceRef` = its storage key). Two signals, deliberately separated: (a) **palette anchors from deterministic pixel sampling** of the image (dominant hues — code, not the model — so colors are measured, not hallucinated); (b) **DNA axes/enums from the vision model** looking at the same image. Compile as usual. The DNA card (§7) shows the sampled palette so the user can see what the system took from their image.

**Metering + logging (Rule 7).** Add the `generation_logs` table (per the product spec's data model, adapted: id, user_id, library_id, kind [`generate` | `edit`], prompt/sourceRef, DNA produced or delta, payload diff (JSONB), adjustments, model, tokens in/out, status, created_at) with RLS (owner reads own rows). Enforce the **abuse cap** from plan config (a generations-per-period number, config-driven, generous but real — §12.4) at the service entry; exceeding it returns a clean, honest error. Plan *allowance* enforcement beyond the cap is the monetization brief's job — implement the count check as one predicate, like Brief #5's plan-gate hook.

## 7. Deliverable 3 — Studio wiring

**The "Describe it" door goes live** (replacing Brief #3's fixture pre-load behavior): text field for a word/phrase, image upload beside it. On submit: generation runs → the new identity exists as a **draft** → the Studio opens on it with:

- **The DNA card** (FR-STUDIO-7): every axis as a labeled slider, the three enums as segmented controls, the palette anchors as hue swatches. Moving any control **re-runs the compiler locally through the same code path** (no model call — assertable in acceptance) and re-renders the preview; the payload diff from the recompile is what gets saved.
- **Full-catalog live preview** of the draft (FR-SHIFT-3) — the §12.1-style test page pattern from the Brief #3 editor: the user judges the whole system, not one component.
- The existing manual editor (tokens/knobs) unchanged beneath it; manual token edits register as **overrides** (Rule 6), visibly marked, and a later DNA change surfaces which overrides it would shadow before applying — the override still wins unless the user removes it.

**Prompt edits.** In the Studio, an "Adjust with a prompt" field on an existing identity: the model returns a **DNA delta** only (axes/enums it intends to change, with the new values); the UI shows the delta on the DNA card and the resulting payload diff summary before the user applies it; applying = save draft (never auto-publish). "Make it warmer" must move warmth (and only what warmth implies through the compiler) — acceptance criterion 6 diffs the payload to prove unrelated fields didn't move.

**Naming.** Generation proposes an identity name from the prompt (plain text field the user can edit before saving — the one place free text from the model is allowed, and it is data, never code).

## 8. Deliverable 4 — MCP + landing surfaces

**MCP tool: `generate_identity`** (hosted transport only; local stdio returns a clean "generation is hosted" error). Extends Brief #5's registry without changing existing tools: input = `{ prompt }` or `{ imageRef }` (an image previously uploaded through the dashboard — MCP does not accept raw image bytes in this brief), plus the caller's account context. It calls the §6 service, creates the **draft** in the caller's account, and returns the DNA, the diff/adjustment summary, and the draft's identity reference. Editing afterward uses Brief #5's `apply_identity_edit`; publishing uses `publish_identity` — generation never publishes (Rule 5). Metering/logging apply identically (same service, same log).

**Landing prompt.** The public landing's prompt pill — display-only since Brief #3, by the honesty rule — becomes a real input: submitting a phrase routes to sign-up/sign-in and then into the Studio with the phrase carried into the "Describe it" field (not auto-submitted — the user confirms). The rotating fixture demo stays exactly as it is for visitors who don't type anything. No fake-AI affordances remain anywhere: every prompt-looking surface on the site now either works or is clearly a demo rotation.

## 9. Deliverable 5 — Docs

- The **Shapeshift** docs page: the three doors, what DNA is, what the compiler guarantees (determinism, AA, closed registries), prompt edits, and the honesty rules (drafts, explicit publish).
- The **Design DNA** docs page: **generated from the DNA schema** (axes, ranges, enums rendered from the same Zod definitions the service ships) — an axis added to the schema updates the docs without a page edit, following the manifest-generated-docs pattern.
- The MCP docs gain `generate_identity` (via Brief #5's registry-generated tools reference — no hand-written tool docs).

## 10. Milestone order and checkpoints

0. DNA in the payload → validator accepts DNA-bearing payloads; fixtures backfilled; old payloads untouched.
1. Compiler → golden battery compiles deterministically; AA pass demonstrably rescues a failing DNA combination.
2. Generation service → text and image doors produce drafts in a test account; logs/metering rows written; failures store nothing.
3. Studio → door-to-preview flow works end to end; DNA sliders recompile with zero model calls; prompt edit applies a scoped delta.
4. MCP + landing → an agent generates a draft over hosted MCP; the landing prompt carries a phrase into the Studio.
5. Docs → schema-generated DNA page live; Shapeshift page true of the build.

Report status at each checkpoint; do not batch-report at the end.

## 11. Acceptance criteria (all must pass; report each with evidence)

1. Root `pnpm build`, `pnpm typecheck`, and `pnpm lint` pass (including `packages/registry-core`, `packages/mcp`, `apps/web`).
2. **DNA-only surface:** the generation service's model-output schema contains exactly the §4 axes + palette anchors (schema printed in the report); a stubbed model response containing a token value or class string is rejected by schema validation and **nothing is stored** (no draft, and the log row is marked failed).
3. **Determinism:** the §5 golden battery compiles twice to byte-identical payloads; changing one axis value changes the payload only in the tokens/selections that axis's mappings own (diff shown for the sharpness → radius case).
4. **AA rescue (FR-SHIFT-2):** a deliberately low-contrast DNA + palette combination compiles to a payload that passes every §5.4 pair; `meta.adjustments[]` records each lightness change with ratios; hue/chroma of adjusted tokens are unchanged (numeric comparison).
5. **Generation battery:** ≥10 diverse text prompts (including an adversarial one asking for invisible/low-contrast text, and one era-specific phrase like "90s arcade") each produce drafts that pass the full validator; the era-specific result's DNA is plausibly era-shaped (high retroFuturism/playfulness) — report the DNA, don't just assert it.
6. **Diff-scoped edit (FR-GEN-3):** on a generated identity, the prompt edit "make the primary warmer, nothing else" produces a DNA delta touching only warmth-implicated fields, and the payload diff leaves knob selections and unrelated tokens byte-identical; the diff is inspectable in `generation_logs`.
7. **Overrides survive (Rule 6):** hand-edit a token (recorded override), then move a DNA slider: the override still wins in the saved payload and the Studio marks it; the recompile makes **zero** LLM calls (log/provider-call count evidence).
8. **Image door:** upload a test image with a known dominant color; the compiled payload's palette anchors fall within a stated hue tolerance of the pixel-sampled values, and the draft's DNA card shows the sampled palette.
9. **Failure isolation (FR-GEN-6):** with the provider forced to error, generation and prompt-edit attempts leave the account's drafts and published versions byte-identical to before (hash comparison).
10. **MCP parity:** `generate_identity` over the hosted MCP creates a draft whose payload is identical to what the dashboard door produces for the same stored model output (stub the model identically for both); the draft is **not** published; `publish_identity` remains a separate call.
11. **Metering + cap:** every attempt above wrote a `generation_logs` row (prompt, DNA/delta, model, token counts, adjustments, status); setting the config cap to the current count makes the next generation fail with the clean cap error and no provider call.
12. **Full-system judgment (FR-SHIFT-3):** a generated identity renders the full catalog preview pre-publish, and after an explicit publish, installs into a fresh scratch app via the CLI and renders there — the complete create → publish → install loop with no manual payload editing anywhere in it.

## 12. Final report format

Per-milestone status (§10) as you go, then a final report containing: the file tree you created/changed; the DNA schema and payload integration as built (and the AA-guardrail reconciliation, §4); the compiler's mapping tables summarized per axis; the exact commands/steps run for §11 with pass/fail per criterion; any spec conflict you flagged and how you resolved it under the reconciliation rule; anything you had to decide that the brief left open. Do not claim a criterion passed without having run it.

---

*End of Brief #6. What remains in the sequence: the monetization wiring (Stripe, plan entitlements — the hooks Briefs #5 and #6 left), and Terry's still-open decisions — the blocks/templates composition layer and O1 (strict vs. advisory standards enforcement). Shapeshift changes neither.*
