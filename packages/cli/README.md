# @arche-ui/cli

Install Arche component libraries into any React project. No local setup — the
CLI talks to the hosted Arche app by default.

```sh
npx @arche-ui/cli login
npx @arche-ui/cli init <user>/<library>
npx @arche-ui/cli add button dialog select
```

## Commands

| Command | What it does |
| --- | --- |
| `arche login [--app <url>] [--token \| --token-env]` | Sign in (browser, pasted token, or `ARCHE_TOKEN`). Stored per-user, never in the project. |
| `arche logout` | Remove the stored login on this machine. |
| `arche whoami` | Show the signed-in user (verified against the app). |
| `arche init <user>/<library> [--app <url>]` | Wire a library into `components.json` (delegates project setup to `shadcn init` when needed). |
| `arche add <component...> [--library <u/l>] [--version <n>]` | Install components/blocks by name. `--version` pins a published snapshot. |
| `arche install [--library <u/l>]` | Install the whole wired library. |
| `arche list [--library <u/l>]` | List installable components and blocks. |
| `arche check [--strict]` | Lint project source against the catalog's checkable standards. Advisory unless `--strict`. |
| `arche doctor` | Validate login, wiring, and tooling. Fixes nothing. |

## App origin

Every registry URL is built from one origin, resolved in this order:

1. `--app <url>` flag
2. `ARCHE_APP_URL` environment variable
3. the stored login (`arche login`)
4. the hosted Arche app

Point at a local deployment while developing the app itself with
`--app http://localhost:3000` (or `ARCHE_APP_URL`).

## Private libraries

`arche login` first. The CLI sends the stored token as a `Bearer` header and
writes only the `${ARCHE_TOKEN}` placeholder into `components.json` — run
`arche doctor` to confirm no real token leaked into the project.

## Requirements

Node.js >= 22. `arche add` / `arche install` / `arche init` shell out to the
stock `shadcn` CLI (`npx --yes shadcn@latest`) with inherited stdio, so you
answer its prompts directly.

## Releasing (maintainers)

`npx @arche-ui/cli` works with no registry setup because the CLI and its two
runtime deps are published to the public npm registry. To release: bump the
version in the package's `package.json`, merge to main, then run the
`publish` GitHub workflow and pick the package — in order
`foundation` → `registry-core` → `cli`, since each depends on the previous.
The workflow publishes via OIDC trusted publishing; the one-time setup is
adding this repo as a trusted publisher for each package on npmjs.com.
