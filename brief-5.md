# Arche UI — Agent Build Brief #5: The MCP Server

**Audience:** an AI coding agent (or developer) working inside the Arche monorepo.
**Prerequisite (already done — do not redo):** Brief #4 is complete and its acceptance criteria pass: the `arche` CLI (login/init/add/install/list/check/doctor) works against the Brief #3 web app, which serves published registries at `/r/<username>/<library>/[item].json` with entitlement checks, version-pinned routes, and dashboard-managed registry tokens. The web app's MCP pages are documentation only — no server exists yet. `packages/mcp` does not exist (or exists as an empty shell). If the actual tree differs, adapt paths, keep the package boundaries, and note the deviation in your final report.
**Governing specs:** "Arche UI — Library Creation Spec v1.4" (2026-11-01) for manifests (§7), the standards layer (§11), and the publish gates (§12); "Arche UI — Product Spec" (2026-10-28) **§5.11 (FR-MCP-1…5)** for the MCP server itself, as amended by "Spec Addendum A1" **FR-APPLY-1**. **Reconciliation rule:** the 2026-10-28 product spec predates the restart architecture. Where its MCP text assumes the old spec/DNA model, the restart spec governs: the MCP operates on **identity payloads** (token set + knob selections) and **manifests**, through the same validator, emitter, and publish gate Briefs #1–4 already built. Where specs and this brief disagree, the spec wins and you must flag the conflict rather than silently choosing.

---

## 1. Product context (minimum you need)

Arche's customers don't just install components by hand — their **AI agents** build with Arche libraries every day. The MCP server is how an agent works *inside* the system instead of guessing at it: it answers questions from the manifests (legal variants, knobs, tokens, rules), hands the agent a full identity so it can style new work correctly, checks a planned component placement against the standards **before code is written**, and — through the same validation and publish gates as every other surface — lets the agent edit and publish identities.

The positioning sentence, from Addendum A1: *you create the identity once; your agents apply it every day.* This brief builds the "apply" half. Two product-spec rules bound everything:

- **FR-MCP-4: the MCP never bypasses validation or publish gates, and never writes component behavior.** It operates on payloads and codegen only. There is no tool that writes a class, invents a token, adds a variant, or edits a template — if a requested operation isn't expressible as a payload change, the MCP cannot do it.
- **One implementation, every surface.** Validation, emission, and publish logic are the exact modules the web app and CLI already use (`@arche/foundation`, `@arche/registry-core`, and the web app's publish path). The MCP is a new *front door* to existing machinery, never a reimplementation.

## 2. Scope of this brief

Work in this order; each deliverable's checks must pass before the next begins.

0. **Shared tool layer** (§4): `packages/mcp` with transport-agnostic tool definitions and handlers.
1. **Local stdio server** (§5): FR-MCP-1 — the free, local mode over payload files.
2. **Hosted server + MCP tokens** (§6): FR-MCP-2/5 — Streamable HTTP in `apps/web`, a dedicated MCP token, account libraries.
3. **Pre-placement checks** (§7): spec §11, enforcement surface 1.
4. **Write tools** (§8): validated draft edits and publish, on both transports.
5. **Docs + client setup** (§9): the MCP docs pages become real setup guides that work.

**Explicitly out of scope — do not build:** Shapeshift/DNA or any AI generation of payloads (a later brief — agents calling these tools supply the values; the server never invents them); **Absorb** (FR-APPLY-2, a later milestone — do not let anything here preclude it, but build none of it); Remix execution; Stripe/Pro billing enforcement (hosted MCP is a paid-tier feature in the product spec's pricing model, but billing is a separate later brief — §6 defines the gate hook, not a paywall); changes to `arche check` (Brief #4 shipped it; this brief reuses the manifests, not the CLI); publishing `packages/mcp` to npm (the package-scope decision, spec O2, is still open — run from the workspace); React Native.

## 3. Non-negotiable rules

1. **Read tools read manifests and payloads — never templates, never codegen output as a substitute.** An agent asking "what can this component do" gets the manifest's declared surface (§7 of the library spec), which is the contract. Template source is never a tool response.
2. **Entitlement is identical to the registry's.** A private library's payload is visible through the MCP only to its owner's token — same 404-style refusal as `/r/…` serving (don't confirm existence to non-owners). Public libraries are readable by any authenticated hosted caller; the catalog tools (manifest data) are public Arche data.
3. **The MCP token is its own credential.** It is *not* the registry token (different privilege: the MCP can read full payloads and, with §8, edit drafts and publish). MCP tokens are random, **hashed at rest, shown exactly once at creation**, labeled, and revocable — revocation disables hosted access immediately (FR-MCP-5). Tokens never appear in logs, responses (after creation), or client bundles.
4. **Every write goes through the validator, and publish goes through the gate.** A payload edit that fails validation changes nothing (draft untouched). Publish is always an explicit tool call, never a side effect of an edit. A publish that fails the gate publishes nothing and returns the gate's named failures verbatim.
5. **Structured answers, not prose.** Tool responses are machine-readable (the SDK's structured content), with the manifest's permanent rule ids, token names, and legal-value lists copied verbatim from the source data. An agent must never have to parse a paragraph to learn a legal value.
6. **Official SDK, Zod schemas (FR-MCP-3).** Use `@modelcontextprotocol/sdk` (TypeScript) and define every tool's input with a Zod schema, consistent with the codebase's validation approach. Hand-rolled JSON-RPC is a defect.
7. **No silent partial evaluation.** If a check or query can't be fully evaluated from the inputs given, the response says exactly which parts were not evaluated and why (§7). A confident-looking incomplete answer is worse than an honest partial one.

## 4. Deliverable 0 — Shared tool layer (`packages/mcp`)

Create `packages/mcp` (TypeScript, same build pattern as the other packages). Its core is a **tool registry**: each tool defined once — name, description, Zod input schema, handler — against a small **data interface** with two backends (§5 local files, §6 hosted account). Both transports (§5, §6) mount the same registry; a tool's behavior must not differ by transport except where the backend genuinely differs (noted per tool below).

The tool surface for this brief — implement exactly these:

**Catalog tools** (data: `@arche/foundation` manifests + token contract; identical on both transports, no account needed):

| Tool | Input | Returns |
|---|---|---|
| `list_components` | optional `category` filter | every catalog component: name, title, category, one-line description |
| `get_component` | `name` | the component's full declared surface from its manifest: slots, axes with legal values, style-surface knobs with legal values and defaults, `tokensUsed`, dependencies + registry dependencies, and its standards (purpose, `useWhen` / `doNotUseWhen`, rules with permanent ids) |
| `get_token_contract` | — | the contract's token vocabulary: names, types, and which are contrast-paired (library spec §5) |

**Identity tools** (data: a payload — local file in §5, account library in §6):

| Tool | Input | Returns |
|---|---|---|
| `list_libraries` | — | the caller's libraries: `<user>/<library>`, visibility, latest published version (hosted); locally: the payload files the server was configured with |
| `get_identity` | `library`, optional `version` | **FR-APPLY-1:** the identity's full payload — token sets for both modes, per-component knob selections, font/icon selections — plus its install block (registry URL + `arche` commands). Must be answerable *without* any component files: the response contains payload data only, never template or registry-item source |
| `validate_identity` | a payload object (or a library reference) | the validator's verdict: pass, or the named failures (token/pair/knob), produced by the **same validation module** the publish gate uses |

**Check tool** (§7): `check_placement`.

**Write tools** (§8): `apply_identity_edit`, `publish_identity`, and (local mode) `emit_registry`.

Descriptions matter: each tool's MCP description is what a calling agent reads to decide when to use it. Write them as instructions to the agent (e.g. `check_placement`: "Call before writing code that places an Arche component…"), not as API documentation for humans.

## 5. Deliverable 1 — Local stdio server (FR-MCP-1)

An stdio entry point (`packages/mcp` binary, e.g. `arche-mcp`) a user runs in their editor's MCP configuration:

- **Configuration:** the payload file(s) it serves are given by CLI argument or environment (`ARCHE_MCP_PAYLOADS=<path-or-dir>`), plus the workspace root it may emit into (§8). No account, no network: the catalog tools read the bundled foundation data; the identity tools read the configured payload files.
- Catalog + identity-read + `validate_identity` + `check_placement` tools all work in this mode. `list_libraries` lists the configured payloads by their payload names.
- The server must start cleanly with no configuration at all (catalog tools only) and say so in its startup behavior — an agent can still ask component questions with zero setup.
- **Test from real clients, not just unit tests:** the MCP Inspector **and** at least one real editor/agent client (Claude Code, Cursor, or similar) connected over stdio, exercising `list_components` → `get_component` → `get_identity` → `check_placement` (acceptance criterion 10 covers the hosted twin of this session).

## 6. Deliverable 2 — Hosted server + MCP tokens (FR-MCP-2/5)

**Transport:** Streamable HTTP, mounted in `apps/web` (a route handler, e.g. `/api/mcp`) using the official SDK, mounting the §4 tool registry with the hosted backend. The hosted backend reads libraries and payloads from the Brief #3 data layer (drafts + immutable published versions) — an agent asking for an identity gets the **published snapshot** by default, a pinned `version` when asked, and drafts only through the write tools' owner context.

**MCP tokens:** add the `mcp_tokens` table (per the product spec's data model: id, user_id, token_hash, label, last_used_at, revoked_at, created_at) with RLS, and a dashboard settings section to create (label → token shown **once**), list (label, created, last used), and revoke tokens. Every hosted MCP request authenticates its Bearer token against this table (hash comparison), updates `last_used_at`, and resolves the caller to exactly one account: identity tools see **that account's** libraries plus public libraries, under Rule 2's entitlement. No token → 401. Revoked token → 401 on the next request (FR-MCP-5; acceptance criterion 7 tests this).

**Plan-gate hook (not a paywall):** the product spec prices hosted MCP as a Pro feature, but Stripe enforcement is a later brief. Implement the check as a single config-driven predicate (e.g. `hostedMcpEnabled(account)`, defaulting to enabled for token holders) called at authentication time, so the monetization brief can wire real entitlements into exactly one place. Do not build checkout, plan tables, or denial UX beyond a clean 403 from that predicate.

## 7. Deliverable 3 — Pre-placement checks (`check_placement`)

This is spec §11's first enforcement surface: *an agent asking to place a component receives the rules, and a violation returns "no, with reason" before code is written.*

**Input:** `component`, plus a **structured context** object — free-text intent is not evaluable, so the context is explicit fields, each optional: the component's proposed axis values (e.g. `variant: "destructive"`), `purpose` (an enum the tool defines from the manifests' function-fit classes — e.g. `navigation`, `action`, `confirmation`, `data-entry`, …), and situational booleans/counts the manifest rules actually reference (e.g. `primaryActionsInRegion`, `hasConfirmation`, `iconOnly`, `hasAccessibleLabel`, `insideDialog`, `targetSizePx` — derive the field set from the rules in the manifests, not from imagination; a rule that references something the context can't express is returned as not-evaluated, per Rule 7).

**Output:** for the named component: (a) **all** of its standards rules, verbatim from the manifest with permanent ids — the agent always receives the full law, evaluated or not; (b) an **evaluation** for each rule the supplied context can decide: `pass`, or `violation` with the rule id and the manifest's reason; (c) an explicit `notEvaluated` list naming the rules the context was insufficient to judge; (d) a top-level `allowed` boolean — `false` iff at least one evaluated rule is a violation.

**O1 stays open.** Strict-vs-advisory enforcement (spec §13, O1) decides what a *client* must do with `allowed: false`; this server reports the truth and does not settle it — consistent with Brief #4's `arche check` (advisory default, `--strict` opt-in). The tool description must tell calling agents to treat a violation as a stop-and-reconsider signal and to surface it to their user, without claiming Arche mandates a hard block.

**Worked cases the implementation must handle** (from the Button/Dialog manifests): a Button with `purpose: "navigation"` → violation of `button-no-navigation`; a destructive Button with `hasConfirmation: false` → violation of `button-destructive-confirm`; an ordinary labeled action Button → `allowed: true`; a Dialog placement for a destructive confirmation → the response points at the Dialog standards (the renamed `dialog-destructive-use-alert-dialog` rule), i.e. the check can *recommend the right component*, not just reject the wrong one — where a manifest's `doNotUseWhen` names an alternative, include it as `suggestedAlternative`.

## 8. Deliverable 4 — Write tools

**`apply_identity_edit`** — input: library reference (hosted) or payload name (local), plus a **diff-scoped edit**: a list of changes, each exactly one of {set a token value (named token, mode, value)}, {set a knob selection (component, knob, value)}, {set a font/icon selection}. Nothing else is expressible — no free-form payload replacement. Behavior:

1. Load the current **draft** (hosted: the account's draft payload; local: the configured payload file). Apply the changes to a copy. Run the shared validator over the result.
2. **Invalid → nothing changes.** Return the validator's named failures. **Valid → save the draft** (hosted: draft payload updated; local: file written atomically) and return a concise diff summary (what changed, old → new). Publishing is *not* implied (Rule 4).
3. Authorship: hosted edits record that they came via MCP (an activity/audit field consistent with whatever Brief #3's dashboard already shows for versions/activity — extend, don't fork).

**`publish_identity`** — input: library reference. Runs Brief #3's publish path (validate → emit → immutable snapshot → latest pointer) **as-is** and returns the new version number + the registry URL, or the gate's failures verbatim with nothing published. There is no MCP-specific publish logic (Rule: one implementation).

**`emit_registry` (local mode only)** — input: payload name, output directory. Emits the registry items by calling `@arche/registry-core`'s emitter — the same function behind the local emit CLI and the server publish path. Output must be **byte-identical** to the CLI emit for the same payload (acceptance criterion 6).

## 9. Deliverable 5 — Docs + client setup

Brief #3 shipped MCP documentation pages describing this server "as specced." Make them true:

- **Setup guides with copy-paste configuration** for the local server (the exact MCP client config JSON for at least Claude Code and Cursor, using the workspace-run command — npm publishing is still out of scope, so the config points at the built workspace package) and for the hosted server (URL + MCP token creation walkthrough).
- **A tools reference generated from the §4 registry** (names, descriptions, input schemas rendered from the same Zod definitions the server ships) — a tool change updates the docs without a page edit, following the manifest-generated-docs pattern of Brief #3.
- Dashboard MCP-token section (§6) links to these docs. The standing rule carries forward: **every instruction on these pages must work against this build** — acceptance criterion 11 verifies both setup paths from a clean client config.

## 10. Milestone order and checkpoints

0. Tool layer → the registry mounts in a test harness; catalog tools answer from real manifests.
1. Local stdio → Inspector + one real client complete a read-only session with zero account setup.
2. Hosted + tokens → a dashboard-issued token connects; revocation kills it; private payloads stay private.
3. Placement checks → the §7 worked cases return the specified verdicts.
4. Write tools → edit → validate → publish round-trips through the real gate; local emit is byte-identical.
5. Docs → both setup paths verified from clean client configs.

Report status at each checkpoint; do not batch-report at the end.

## 11. Acceptance criteria (all must pass; report each with evidence)

1. Root `pnpm build`, `pnpm typecheck`, and `pnpm lint` pass (including `packages/mcp` and `apps/web`).
2. **Catalog truth:** `list_components` returns the full catalog (37 components) and `get_component` for Button and Dialog returns axes, knobs, legal values, and standards that match their manifest files field-for-field on a scripted spot-diff.
3. **FR-APPLY-1:** `get_identity` for a fixture identity returns complete token sets for both modes plus knob and font/icon selections, and the response contains **no** template or registry-item source (assert by content scan).
4. **Placement verdicts:** the §7 worked cases return the specified results — navigation-purpose Button → `allowed: false` citing `button-no-navigation`; destructive without confirmation → violation citing `button-destructive-confirm`; clean action Button → `allowed: true`; a context omitting fields a rule needs lists that rule under `notEvaluated`, not under pass.
5. **Validator identity:** `validate_identity` on a payload with a broken contrast pair and an out-of-set knob value returns the same named failures the publish gate produces for the same payload (run both, diff the messages).
6. **Emit determinism:** `emit_registry` (local MCP) output is byte-identical to the registry-core CLI emit for the same payload (recursive diff, zero differences).
7. **Hosted auth + revocation (FR-MCP-5):** no token → 401; valid token → tools respond; a second account's token requesting the first account's private library payload gets the 404-style refusal with no payload content; after dashboard revocation, the same token gets 401 on its next request.
8. **Version integrity:** publish v2 of a test library; hosted `get_identity` returns v2 by default and v1 with `version: 1` — bytes matching the v1 snapshot.
9. **Write safety:** `apply_identity_edit` with an out-of-set knob value is rejected and the draft is unchanged (hash before/after); a valid edit changes the draft only — the latest published version is untouched until `publish_identity`; `publish_identity` on a contrast-broken draft fails with the gate's message and publishes nothing.
10. **Real agent session (hosted):** from a real MCP client (name it in the report), an agent uses only MCP tools to: discover the catalog, check a placement, fetch an identity, and then build a small page section in a scratch app using that identity's installed components — the section compiles/renders, and the report includes the tool-call transcript.
11. **Docs truth:** following only the docs pages, a clean MCP client config connects to (a) the local stdio server and (b) the hosted server, and completes a `list_components` call in both cases.
12. **Token hygiene:** MCP tokens in the database exist only as hashes (show the row shape); a created token appears in full exactly once (the creation response); server logs from the acceptance runs contain no token values (grep).

## 12. Final report format

Per-milestone status (§10) as you go, then a final report containing: the file tree you created/changed; the tool registry as shipped (names + one-line purposes); the `mcp_tokens` schema as built and any deviation from §6, with why; the exact commands/steps run for §11 with pass/fail per criterion; any spec conflict you flagged and how you resolved it under the reconciliation rule; anything you had to decide that the brief left open. Do not claim a criterion passed without having run it.

---

*End of Brief #5. Shapeshift — AI generation of identity payloads (word / phrase / image → payload, the DNA layer) — is Brief #6: it produces payloads through these same tools and gates, and changes none of them.*
