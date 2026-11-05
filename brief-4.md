# Arche UI — Agent Build Brief #4: The Arche CLI

**Audience:** an AI coding agent (or developer) working inside the Arche monorepo.
**Prerequisite (already done — do not redo):** Brief #3 is complete and its acceptance criteria pass: `apps/web` with Supabase auth, server-side publish (validate → emit → immutable snapshot), registry serving at `/r/<username>/<library>/[item].json` plus version-pinned routes, per-user **registry tokens** (random, hashed at rest, revocable from dashboard settings), and dashboard install instructions that show the future `arche` commands labeled as coming with the CLI. The monorepo shell has `packages/cli` present but unbuilt. If the actual tree differs, adapt paths, keep the package boundaries, and note the deviation in your final report.
**Governing spec:** "Arche UI — Library Creation Spec v1.4" (2026-11-01), especially §9 (registry), §10 (the CLI), and §11 (standards layer). This brief implements §10 in full and the `arche check` surface of §11. Where this brief and the spec disagree, the spec wins and you must flag the conflict rather than silently choosing.

---

## 1. Product context (minimum you need)

Arche UI generates complete, installable React component libraries ("identities") from data and serves them as a shadcn-compatible registry over HTTP. Until now, installing a library meant following the dashboard's stock-shadcn-CLI instructions by hand — including wiring a namespace and an authorization header into `components.json` manually. This brief removes that friction: **one npm-distributed CLI** (spec §10.1) that adds the account layer shadcn lacks (login, tokens, entitlement) while **delegating all installation mechanics to the shadcn CLI** (spec §10.3). The user experience is entirely Arche; the file-writing engine is shadcn's.

Two spec principles govern everything below:

- **Command-surface stability (§10.4, Principle 6).** A later CLI version may replace the shadcn delegation with Arche's own install engine. That swap must be invisible, so v1 commands must not leak shadcn-specific quirks into Arche's UX or project files beyond the standard `components.json` the ecosystem already uses.
- **Copy-and-own is preserved.** Components install as source files in the user's project. Never smuggle installation into an npm `postinstall` script (spec §10.3 calls this out explicitly), and never turn a library into an npm package.

## 2. Scope of this brief

Work in this order; each deliverable's checks must pass before the next begins.

0. **CLI auth bridge in `apps/web`** (§4): the small server-side pieces `arche login` needs — a loopback authorization page and a token-verification endpoint.
1. **Package + config + login/logout/whoami** (§5): the `packages/cli` skeleton, local credential storage, and the sign-in flows.
2. **`arche init`** (§6): wiring a project to a library via `components.json`.
3. **`arche add` / `arche install` / `arche list`** (§7): installation through the shadcn engine.
4. **`arche check` + `arche doctor`** (§8): the standards checker over a project, and project-setup validation.
5. **Docs + dashboard alignment** (§9): the web app's CLI docs and install instructions become true of this build.

**Explicitly out of scope — do not build:** publishing the CLI to npm (the public package name/scope is spec open decision **O2** — the command name is `arche` regardless; keep the existing workspace package name and do not rename anything); Arche's own install engine (§10.4, v2); the hosted MCP server (a later brief — `arche check` reads manifests locally, it is not the MCP); Shapeshift/DNA or any AI generation; Stripe/billing; React Native; any change to the foundation, manifests, or emitter (flag needs as spec conflicts instead); deciding strict-vs-advisory standards enforcement globally (spec open decision **O1** — §8 defines how `check` ships without settling it).

## 3. Non-negotiable rules

1. **The token is a secret, everywhere.** It is never printed, echoed, logged, or written into any project file. `components.json` may contain only the literal placeholder `${ARCHE_TOKEN}`; the real value reaches shadcn solely through the environment of the child process `arche` spawns (§7). After the full login → init → add flow, the token string must not appear anywhere in the project directory or the CLI's own output (acceptance criterion 2 greps for this).
2. **Delegation is total for installs.** File writes, dependency resolution, npm installs, and CSS merging during `add`/`install` are shadcn's. Arche code never writes component files, never edits `globals.css`, and never installs npm packages itself.
3. **One seam for the engine.** Every interaction with the shadcn CLI (spawning it, the namespace format in `components.json`) lives behind a single internal module in `packages/cli`. The rest of the CLI must not contain shadcn-specific strings or assumptions, so the §10.4 engine swap touches one module.
4. **Match Brief #3's wiring, don't invent a second scheme.** The namespace shape, registry URL format, and auth-header pattern that the shipped dashboard install instructions already teach are the source of truth for what `init` writes. If you believe that scheme is wrong, flag it as a conflict; do not silently diverge.
5. **stdio and exit codes pass through.** When shadcn prompts (overwrite confirmations, etc.), the user interacts with shadcn's prompt directly — Arche does not intercept, re-render, or answer prompts. shadcn's non-zero exit becomes Arche's non-zero exit, with at most one added line of Arche context (which library/namespace was targeted).
6. **Cross-platform is a requirement, not a polish item.** The primary development machine is Windows + PowerShell. Spawning `npx`/`shadcn` on Windows hits `.cmd` shims — handle this properly (argument arrays, never string-concatenated commands; no shell interpolation of user input). Config paths resolve per-OS.
7. **No telemetry, no analytics, no postinstall scripts.** The CLI talks to exactly two things: the configured Arche web app origin, and the shadcn CLI it spawns.

## 4. Deliverable 0 — CLI auth bridge in `apps/web`

Brief #3 built the credential: a per-user registry token (random, hashed at rest, revocable in dashboard settings) that the `/r/…` routes already accept as `Authorization: Bearer <token>`. The CLI reuses that exact credential — do not introduce a second token type. It needs two small additions:

- **`GET /api/cli/whoami`** — accepts the registry token as a Bearer header; returns `{ "username": "<username>" }` for a valid token, `401` otherwise. No other user data. The CLI uses this to verify a token before storing it and to implement `whoami`. If Brief #3 already shipped an equivalent endpoint, use it and skip this.
- **`/cli/auth` page (loopback authorization)** — parameters: `callback` (an `http://127.0.0.1:<port>/…` URL supplied by the CLI) and `state` (a random nonce the CLI generated). Behavior: requires a signed-in user (redirect to sign-in and back if not); validates that `callback` is a loopback address (reject anything else — this page must never become an open token redirector); shows the signed-in account and a plain-language warning that authorizing stores the account's registry token on this machine; on **Authorize**, redirects the browser to the callback URL carrying `state` and the user's registry token. On **Deny**, redirects with an error parameter instead. The token appears only in that loopback redirect — never in page HTML that could be cached or shared, never in logs.

## 5. Deliverable 1 — Package, config, login / logout / whoami

**Package.** Build out the existing `packages/cli` workspace package (TypeScript, same build pattern as `packages/registry-core`: compile to `dist/`, binary entry with a shebang). The package's `bin` maps the command name **`arche`** to the built entry. Keep the dependency footprint minimal (an argument parser and a process-spawning helper at most; hand-roll the rest). All commands below must run from the built binary.

**Command surface (spec §10.2 — implement exactly these, plus flags noted in this brief):**

```
arche login                  sign in (browser flow); stores the token locally
arche logout                 remove the local token
arche whoami                 show the signed-in account
arche init <user>/<library>  wire this project to a library (§6)
arche add <component...>     install components from the wired library (§7)
arche install                install the whole library (the "all" item, §9.3)
arche list                   list the wired library's components
arche check                  run the standards checker over this project (§8)
arche doctor                 project-setup validation (§8)
```

**Local config.** Store `{ appUrl, username, token }` in an OS-appropriate per-user config location (Windows: `%APPDATA%\arche\`; macOS/Linux: the platform config dir, e.g. `~/.config/arche`). The file is owner-only where the OS supports permissions. The app origin is configurable at login time (`--app <url>`, or the `ARCHE_APP_URL` environment variable) so the same binary works against a local dev deployment and production; never assume a production domain exists — use the configured origin from login for every registry URL the CLI builds.

**`arche login` (browser flow, spec §10.3).** Generate a random `state`; start an HTTP listener bound to `127.0.0.1` on an ephemeral port; open the user's browser to `<appUrl>/cli/auth?callback=…&state=…`; wait for the callback (with a sane timeout). Verify the returned `state` matches, then verify the token via `/api/cli/whoami` **before** storing anything; store only on success and print the signed-in username — never the token. Handle the failure paths cleanly: user denies, browser never returns, token invalid, app unreachable — each prints one clear sentence and exits non-zero, storing nothing.

**`arche login --token` (headless fallback).** For SSH/headless/agent environments with no browser: prompt for the registry token with hidden input (the user copies it from dashboard settings), verify via `/api/cli/whoami`, store as above. Also accept the token from the `ARCHE_TOKEN` environment variable for CI (`arche login --token-env`), verified the same way.

**`arche logout`.** Removes the local token (and reports signed-out state). Logout is **local only** — it must say so, and point the user to dashboard settings to revoke the token server-side.

**`arche whoami`.** With a stored token: verify against the server and print the username (and the app origin). Without one, or if the server rejects it (revoked/expired): print signed-out / token-invalid plainly and exit non-zero.

## 6. Deliverable 2 — `arche init <user>/<library>`

Run inside a consumer project. Behavior:

1. **Preconditions.** The directory must look like a project (a `package.json`). If `components.json` does not exist, first delegate project initialization to the stock shadcn flow (its own `init`, prompts and all — Rule 5), then continue. If the user is not logged in, init still proceeds for a **public** library (the namespace works without a token), but must warn that private libraries require `arche login`.
2. **Validate the target.** Fetch `<appUrl>/r/<user>/<library>/all.json` (with the stored token if one exists). A 404 produces one clear error — wrong name, unpublished, or private-without-access; do not claim which, since the server deliberately doesn't say. Network failure is reported as network failure, not as "library not found."
3. **Write the wiring.** Merge the library's namespace entry into `components.json`'s `registries` — the exact scheme Brief #3's dashboard instructions already use (Rule 4): the URL points at `<appUrl>/r/<user>/<library>/{name}.json` and the authorization header is `Bearer ${ARCHE_TOKEN}` (placeholder only, Rule 1). **Preserve everything else** in `components.json` — style, aliases, `iconLibrary`, tailwind settings — untouched.
4. **Idempotent.** Running `init` twice for the same library produces no diff the second time. Running it for a *different* library adds a second namespace; it never removes another library's entry (a project may wire several libraries; §7 resolves which one a command targets).
5. Arche itself writes **only** `components.json` during init (acceptance criterion 10 verifies this). Print a short summary: library wired, namespace name, and the next commands (`arche list`, `arche install`).

## 7. Deliverable 3 — `arche add` / `arche install` / `arche list`

**Target resolution.** `add`/`install`/`list` act on the wired library: if the project has exactly one Arche namespace in `components.json`, that's the target. If several are wired, require `--library <user>/<library>`; if none, error and point at `arche init`.

**`arche add <component...>`** — resolve each name against the target namespace and invoke the shadcn CLI **once** for all requested components (spec §10.3 step 3), through the single engine module (Rule 3):

- Spawn with the child process environment = the current environment **plus** `ARCHE_TOKEN` set from the stored token (only if logged in). This is the one moment the secret exists outside the config file, and it is never written anywhere (Rule 1).
- Inherit stdio (Rule 5). Propagate the exit code. On failure, add at most one context line (target library + namespace) — shadcn's own error output stands.
- A private library without a valid login surfaces the server's 404 as a clean Arche error ("this library is private or doesn't exist — if it's yours, run `arche login`"), not a stack trace or raw HTTP dump.
- **`--version <n>` flag:** install from the version-pinned route (`/r/<user>/<library>/v/<n>/…`, built in Brief #3) instead of latest, so a previous install stays reproducible (spec §9.5). Implement it however the engine module cleanly supports (e.g. direct item URLs for the pinned version) — the user-visible semantics are what matter: the installed files are the pinned version's bytes.

**`arche install`** — the whole library in one command: the namespace's `all` item (§9.3), same spawning/env/exit-code rules as `add`. This is the command that installs the theme item (tokens → `globals.css` via shadcn's CSS merging) and every component.

**`arche list`** — fetch the target library's `all.json` (token attached if stored) and print its component names from `registryDependencies`, one per line or a compact grid, plus a footer noting `theme` and `all` are implicit. No token and a private library → the same clean 404 error as `add`.

## 8. Deliverable 4 — `arche check` + `arche doctor`

**`arche check`** is spec §11's third enforcement surface: scan a project against the component manifests. The manifests are Arche-owned catalog data, identical for every library — so the CLI reads them from `@arche/foundation` (workspace dependency; bundle the manifest data into the built CLI), **not** from the registry or the network. Identity-specific knob selections are not check's concern; the installed files themselves carry those.

Scope v1 to the **deterministic, statically checkable** subset of the manifests' standards. Do not attempt semantic "function fit" judgments (that's the MCP surface's job, later):

- **Token discipline** — scan project source files for hardcoded color values (hex literals, raw palette utilities like `bg-blue-500`) where a contract token exists. This mirrors the foundation's token-only lint, applied to consumer code.
- **Accessibility rules that are mechanically decidable from the manifests** — e.g. an icon-only Button (icon child, no text) with no `aria-label`; a Dialog usage whose content lacks a Title. Implement the general mechanism (rules read from each manifest's standards section, keyed by its permanent rule id) and ship at least these two rule classes plus token discipline.
- Every finding prints as `file:line — <rule id>: <message>`. A clean project prints a one-line pass summary.

**Exit behavior — O1 stays open.** Strict-vs-advisory enforcement is undecided (spec §13, O1), so `check` ships **advisory by default** (findings print, exit 0) with a **`--strict`** flag (any finding → exit 1) for CI. Implementing both modes is required; choosing the eventual default is not this brief's decision, and the final report must not present either mode as "the" enforcement policy.

**`arche doctor`** (spec §10.2 permits it) — validate the setup and report each line pass/fail: a stored login exists and the token verifies (`whoami` logic); `components.json` exists with at least one Arche namespace whose header uses the `${ARCHE_TOKEN}` placeholder (and **fail loudly** if a real token value is found pasted into `components.json` — tell the user to revoke it in the dashboard and re-run `arche init`); the target registry's `all.json` is reachable; the shadcn CLI is invocable. Doctor fixes nothing; it names the command that fixes each failure.

## 9. Deliverable 5 — Docs + dashboard alignment

Brief #3 shipped CLI documentation "as specced" and dashboard install instructions labeling the `arche` commands as future. Now they ship:

- Dashboard install instructions lead with the real flow (`arche login` → `arche init <user>/<library>` → `arche install` / `arche add <component>`), with the stock-shadcn path demoted to a secondary "manual / advanced" section. Remove the "coming with the CLI" labels.
- The public Docs CLI page documents every command and flag implemented in this brief — and nothing that isn't. The Brief #3 rule carries forward: **every command on the page must work against the shipped build.**
- The registry-token settings copy updates to mention the CLI (logging in stores this token on the machine; revoking it signs the CLI out everywhere).

## 10. Milestone order and checkpoints

0. Auth bridge → `/api/cli/whoami` verifies a dashboard-issued token; `/cli/auth` completes a loopback round-trip with a hand-driven request.
1. Skeleton + config + login/logout/whoami → both login paths store a verified token; logout clears it.
2. Init → a scratch project wires to a published library with a clean, idempotent `components.json` merge.
3. Add / install / list → the Brief #3 scratch flow, repeated end-to-end through `arche` instead of raw shadcn commands.
4. Check + doctor → seeded violations are found; doctor diagnoses a deliberately broken setup.
5. Docs + dashboard alignment → instructions match the shipped commands.

Report status at each checkpoint; do not batch-report at the end.

## 11. Acceptance criteria (all must pass; report each with evidence)

1. Root `pnpm build`, `pnpm typecheck`, and `pnpm lint` pass (including `packages/cli`).
2. **Login (browser flow):** from a clean config, `arche login` against the dev deployment completes the loopback flow and stores the token; `arche whoami` prints the username. Afterwards, grep the scratch project **and** the CLI's captured output: the token string appears nowhere (config file excepted).
3. **Login (headless):** `arche login --token` with a valid dashboard token succeeds; with an invalid token it exits non-zero, prints one clear error, and stores nothing.
4. **Logout + revocation:** after `arche logout`, `whoami` reports signed out; separately, revoking the token in the dashboard makes a stored-token `whoami` report token-invalid (the CLI notices server-side revocation without any local change).
5. **Init:** in a fresh scratch app, `arche init <user>/<library>` produces a `components.json` whose Arche namespace matches Brief #3's documented scheme (URL + `Bearer ${ARCHE_TOKEN}` header) with every pre-existing key preserved; a second identical `init` produces zero diff; `init` for a nonexistent library fails with the clean 404 error and writes nothing.
6. **Add:** in that scratch app, `arche add button dialog` installs files identical to what the stock shadcn CLI installs from the same registry items; a deliberately failing add (unknown component) exits non-zero with shadcn's error visible and Arche's one context line.
7. **Install:** in a second fresh app, `arche install` installs the full library including the theme; the §12.1-style test page renders in the identity and `.dark` re-skins it.
8. **Private end-to-end:** a private library's `arche add` before login returns the clean 404 error; after login it succeeds; after the token is revoked in the dashboard it fails again.
9. **Version pinning:** publish v2 of a test library; `arche add --version 1` installs files whose stamped token values match the v1 snapshot, not v2.
10. **Check:** a seeded project containing (a) a hardcoded hex color, (b) an icon-only Button without `aria-label`, and (c) a clean component file produces findings for (a) and (b) with manifest rule ids and file:line locations, nothing for (c); default run exits 0, `--strict` exits 1.
11. **Seam + footprint:** the final report names the single engine module through which all shadcn interaction flows; a filesystem diff of the init step shows Arche wrote only `components.json`; the CLI package contains no `postinstall` script.
12. **Windows:** the full login → init → add flow is run once under Windows PowerShell with no `.cmd`-shim or quoting errors (report the environment used).

## 12. Final report format

Per-milestone status (§10) as you go, then a final report containing: the file tree you created/changed; the exact config-file location and format per OS; how the loopback flow was secured (state check, loopback validation, timeout); the exact commands/steps run for §11 with pass/fail per criterion; any spec conflict you flagged and how you resolved it; anything you had to decide that the brief left open. Do not claim a criterion passed without having run it.

---

*End of Brief #4. The hosted MCP server (manifest queries + pre-placement standards checks, spec §11 surface 1) is the next brief; Shapeshift (AI identity generation) follows it. Nothing in this brief's command surface may need to change when either lands.*
