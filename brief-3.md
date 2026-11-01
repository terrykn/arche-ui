# Arche UI — Agent Build Brief #3: Web App, Database, and Registry Serving

**Audience:** an AI coding agent (or developer) working inside the Arche monorepo.
**Prerequisite (already done — do not redo):** Brief #2 is complete and verified: the full 37-component catalog (templates + manifests), the manifest↔template cross-check, the emitter at catalog scale, the two canonical identities (Arche Default, 90s Arcade), and the dual scratch previews. The monorepo shell has `apps/web` present but unbuilt.
**Governing specs:** "Arche UI — Library Creation Spec v1.3" (2026-11-01) for everything about identities, tokens, manifests, registry, and publish; "Arche UI — Product Spec" (2026-10-28) as amended by "Spec Addendum A1" (2026-10-30, incl. §A1.9 amendments of 2026-11-01) for the public site, dashboard, and terminology. **Reconciliation rule:** Addendum A1 was written against the 2026-10-28 spec; where it conflicts with the v1.3 restart spec on the library layer (identity = token set + knob selections; no DNA compiler in this brief), **v1.3 governs**. Where specs and this brief disagree, the spec wins and you must flag the conflict rather than silently choosing.

---

## 1. Product context (minimum you need)

Arche UI generates complete, installable React component libraries ("identities") from data: a token set plus per-component knob selections, validated against the token contract and manifests, then deterministically emitted as a shadcn-compatible registry. Briefs #1–2 built that engine and proved it with fixture files and local output. This brief makes it a product: identities live in a database, users manage them in a real web app, publishing runs the same emit server-side, and the resulting registry is **served over HTTP** so a library can be installed from its real URL. The web app itself is styled by an identity — Arche's own (Deliverable 0) — because the product's first proof is itself.

## 2. Scope of this brief

This is the largest brief so far. Work in the milestone order given; each milestone's checks (§10) must pass before the next begins.

0. **The Arche identity + app theming** (§4): the site's own identity payload, the token pipeline into `apps/web`, light/dark toggle.
1. **Data layer + auth** (§5): Supabase schema, row-level security, Supabase Auth, gated dashboard.
2. **Publish + registry serving** (§6): server-side validate → emit → immutable snapshot → served routes with entitlement checks.
3. **Dashboard** (§7): manage applications and identities end to end (create/edit manually, publish, versions, install instructions).
4. **Public site** (§8): landing (hero rotation + Examples per Addendum §A1.9a), identities gallery, components pages generated from manifests, public identity pages, pricing (display), docs incl. MCP docs.

**Explicitly out of scope — do not build:** the Arche CLI package (Brief #4 — dashboard install instructions show the stock-shadcn-CLI path that works today); the hosted MCP server (docs pages only); Shapeshift AI generation and any DNA layer (a later brief — creation in this brief is manual payload editing); Stripe checkout/billing enforcement (pricing page display + create/apply labels only); Remix execution; React Native registry content; Absorb.

## 3. Non-negotiable rules

1. **The payload is the source of truth; registry JSON is derived** (spec §8, §9.5). Publishing stores an immutable snapshot; served JSON is never hand-edited, patched, or regenerated on request.
2. **The publish gate is the validator.** A payload that fails contract coverage, contrast pairs (§5.4 AA — absolute, no exemptions), or manifest knob validation **cannot publish**, and the failure must surface to the user naming the failing token/pair/knob. The server runs the same validation code as the local emit path — one implementation, imported, not re-written.
3. **Private means private.** Entitlement is checked server-side before any private item JSON, snapshot file, or public identity page is served. A private identity's `/p/…` page and `/r/…` items return 404 (not a login redirect that confirms existence) to anyone without access.
4. **The site is styled only through the Arche identity.** No hardcoded theme values in `apps/web` outside the token pipeline (structural constants excepted, as in spec §5.4). Changing the site's look = editing the Arche identity payload.
5. **Deterministic publish.** Same payload → byte-identical snapshot to the local emitter's output for the same payload.
6. **Secrets stay server-side.** Supabase service-role keys and registry signing/entitlement logic never reach the client bundle. Client code uses the anon key + RLS only.
7. **Terminology:** user-facing surfaces say **Identity**; code, tables, and routes keep `library` naming (Addendum A1.2). Do not rename existing entities.

## 4. Deliverable 0 — The Arche identity and app theming

- Author `fixtures/identity.arche.json` (or the foundation's fixture location, consistently): the **Arche identity** payload — Arche's own personalized identity, the ancient-Greek base identity of Addendum A1.6.2 (marble/parchment surfaces, bronze and terracotta accents, Aegean washes, serif display type) expressed in the v1.3 contract: full token set in **light and dark**, knob selections for the components the site uses. It must validate clean through the same pipeline as any identity (contrast gate included).
- Wire `apps/web` to consume it the way a user app consumes an identity: the payload compiles to CSS variables (light `:root` + `.dark`) through the registry-core theme compilation — reuse that code path; do not invent a parallel theme system for the site.
- **Light/dark toggle** on every surface (public nav + dashboard), persisted per visitor (local storage) and per user (profile setting) when signed in. Default to the visitor's OS preference on first visit.
- **Gradients are subtle** (Addendum §A1.9d): the Arche identity and the site's CSS use low-contrast, desaturated gradient washes behind content only.

## 5. Deliverable 1 — Data layer + auth (Supabase)

Schema (names keep `library` internally per Rule 7; adjust columns, not concepts, if the repo already has partial tables — report deviations):

- `profiles` — id (auth user), display name, username (unique, used in `/r/<username>/…` and `/p/<username>/…` routes).
- `applications` — id, owner, name, created/updated. (An application is a user's project context; identities attach to applications per the decided site scope.)
- `libraries` — id, owner, application_id (nullable), name, slug, visibility (`public` | `private`), **payload** (JSONB: token set + knob selections + recorded overrides/adjustments — the source of truth), created/updated.
- `library_versions` — id, library_id, version number, **snapshot** (the emitted registry: per-item JSON, stored in Supabase Storage or as JSONB — pick one, report which), payload hash, published_at. Immutable: no update path.
- Row-level security on every table: owners see/edit only their own rows; public libraries/versions are readable per §6's serving rules (serving goes through server routes, not direct client table reads, where entitlement logic is needed).

Auth: Supabase Auth (email + password at minimum). Sign-up/sign-in/sign-out flows; the dashboard (§7) and all write APIs require a session; public pages do not.

## 6. Deliverable 2 — Publish + registry serving

**Publish action** (dashboard-triggered, server-side):
1. Load the library's payload. 2. Validate (Rule 2) — on failure, publish aborts and the dashboard shows the named failures. 3. Emit with registry-core. 4. Store as a new immutable `library_versions` snapshot; mark it latest. 5. The library's install instructions (§7) update to the new version.

**Serving routes** (Next.js route handlers):
- `GET /r/<username>/<library>/[item].json` — serves the item from the library's **latest published snapshot** (per-item names incl. `theme` and `all`). Public library → open. Private library → requires the owner's token (the auth-header pattern of spec §10.3: `Authorization: Bearer <token>`; token issuance UI is a simple "registry token" in dashboard settings — a per-user random token, hashed at rest, revocable).
- Version-pinned serving (e.g. `/r/<username>/<library>/v/<n>/[item].json`) so yesterday's install is reproducible (spec §9.5).

## 7. Deliverable 3 — Dashboard (signed-in app)

Layout per the decided site scope: public nav when logged out; when signed in, a **left sidebar** — Dashboard, Applications, Identities, Components, Standards, MCP, Docs — with a persistent **+ New Identity** button (not a nav tab); Settings and registry token in the avatar menu.

- **Dashboard home:** the user's identities as cards with **live mini-renders** (4–6 real components rendered from the latest published payload's tokens — never screenshots), name, application, visibility, latest version, updated date (per Addendum FR-DASH-1's intent, minus DNA chips, which belong to the later generation layer).
- **Identity editor (manual creation/editing):** forms generated from the foundation data — token editors for every contract token (color inputs showing OKLCH, per mode light/dark), and per-component knob controls generated from each manifest's declared axes/style surface (legal values only — an illegal value must be unrepresentable in the UI, per spec §7.1's principle). Live preview: the §12.1 test-page pattern (catalog rendered in the working payload) inside the editor. Save = payload update (draft); Publish = §6.
- **Applications:** create/rename applications; assign identities to applications; an application view shows its identity and install state.
- **Install instructions** per identity: the served registry URLs, the stock-CLI commands that work today (namespace config in `components.json` pointing at `/r/…`, incl. the auth header for private libraries), and the future `arche` CLI commands shown as specced in spec §10.2, clearly labeled as coming with the CLI.
- **Components / Standards / MCP / Docs (signed-in sections):** the same manifest-generated component reference as the public components pages (§8), the standards rules from the manifests, and the MCP documentation pages.

## 8. Deliverable 4 — Public site

Routes (Addendum A1.6): `/`, `/identities`, `/components`, `/components/[name]`, `/pricing`, `/docs`, `/p/[user]/[identity]`, plus `/sign-in`, `/sign-up`.

- **Landing** per A1.6.2 — headline "Say a word. Get an identity.", the section sequence (hero stage → one identity every surface → how it works → live components grid → gallery strip → AI-workflow section → pricing summary → FAQ → final CTA) — **with the §A1.9 amendments**: hero *and* Examples use the canonical demo pattern (below); the whole page renders in the Arche identity; gradients subtle.
- **The canonical demo pattern (hero stage + Examples, Addendum §A1.9a):** one fixed sample application — a generic mini product interface (header bar, primary + ghost buttons, text input, card with stat, badge, toggle, slider, tabs, avatar row) with **identical DOM for the entire rotation** — auto-alternating example prompts in a prompt pill (the launch fixture identities: "90s arcade", "ancient Greece", "calm hospital", "brutalist bank", "Y2K chrome", "cozy bookstore" — plus Arche Default where useful), each switch a **token transition only** (600–900ms, no layout movement, no content swap). Clickable chips jump the rotation; rotation pauses on hover/focus/off-screen; `prefers-reduced-motion` disables auto-rotation. Real components rendered from fixture payloads via CSS variables — never images or video of UI. The demo identities render in the visitor's selected light/dark mode (fixtures define both sets).
- **Components pages** are **generated from the foundation manifests**: index renders the catalog live with an identity switcher (fixture identities + Arche Default) re-skinning the page; detail pages show live render, axes and knob tables, tokens used, standards — all read from manifest data, so a manifest change updates the docs without page edits.
- **Identities gallery** (`/identities` + landing strip): public identities (fixtures + users' public libraries) as live mini-render cards with author and version; private identities never listed.
- **Public identity page** (`/p/[user]/[identity]`): full catalog rendered live in that identity, token/knob summary, version list, working install block pointing at the served `/r/…` URLs. Private → 404 (Rule 3).
- **Pricing:** the three-tier summary with create (one-time) vs. apply (subscription) labels per Addendum A1.4; prices from a plan config, never hard-coded; no checkout in this brief.
- **Docs:** real content for Getting started, Install an identity, Create/edit an identity manually, the token contract, MCP overview + setup, CLI (as specced), Registry auth. The install docs must be *true of this build* — every command on the page must work against the served registry.

## 9. Milestone order and checkpoints

0. Arche identity + theming → the app renders in both modes from the payload.
1. Data + auth → a user can sign up and see an empty, gated dashboard.
2. Publish + serving → a seeded library publishes and its `/r/…` items install into a scratch app.
3. Dashboard → the full create → edit → publish → install loop works with no code or fixtures involved.
4. Public site → all routes live, demo pattern rotating, docs true.

Report status at each checkpoint; do not batch-report at the end.

## 10. Acceptance criteria (all must pass; report each with evidence)

1. Root `pnpm build`, `pnpm typecheck`, and `pnpm lint` pass (including `apps/web`).
2. **Auth:** sign-up/sign-in/sign-out work; dashboard and write APIs reject anonymous requests; RLS prevents one user from reading or modifying another's draft libraries (demonstrate with two accounts).
3. **Dogfooding:** `apps/web` contains no hardcoded theme colors outside the token pipeline (grep evidence, structural constants excepted); editing a token in the Arche identity payload and republishing changes the site's appearance with no site code change; the light/dark toggle switches every surface (public + dashboard) and persists across reload and sign-in.
4. **Publish gate:** a payload with a broken contrast pair or an undeclared knob value cannot publish; the dashboard error names the failing pair/knob. A valid payload publishes and its served item JSON is **byte-identical** to the local emitter's output for the same payload.
5. **End-to-end install:** from a fresh scratch app, install a published user library's `all` item from its served `/r/…` URL via the stock shadcn CLI; the catalog test page renders in that identity; `.dark` re-skins it.
6. **Privacy:** anonymous requests to a private library's item JSON and `/p/…` page return 404 with no payload content; the same requests with the owner's registry token succeed; revoking the token breaks them again.
7. **Immutability:** publish v1, edit the payload, publish v2 — the version-pinned v1 URL still serves the original bytes; the latest URL serves v2.
8. **Demo pattern:** hero and Examples rotate ≥4 fixture identities through the fixed sample app — prompt pill updates, chips jump, rotation pauses on hover, zero layout shift during transitions (report how you verified), auto-rotation disabled under `prefers-reduced-motion`; the demo renders in both light and dark visitor modes.
9. **Manifest-generated docs:** components index and detail pages render axes, knobs, tokens, and standards from manifest data — change one manifest value in foundation, rebuild, and the corresponding detail page reflects it with no page-code edit.
10. **Editor integrity:** the identity editor cannot produce an out-of-contract payload — token fields cover exactly the contract per mode; knob controls offer exactly the manifest's legal values (spot-check Button and Dialog against their manifests).

## 11. Final report format

Per-milestone status (§9) as you go, then a final report containing: the file tree you created/changed; the schema as built (and any deviation from §5, with why); where snapshots live and why; the exact commands/steps run for §10 with pass/fail per criterion; any spec conflict you flagged and how you resolved it under the reconciliation rule; anything you had to decide that the brief left open. Do not claim a criterion passed without having run it.

---

*End of Brief #3. Brief #4 (the Arche CLI: login, init, add/install, check) follows once these acceptance criteria pass; Shapeshift (AI identity generation) is specced as a later brief.*
