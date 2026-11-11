import type { DocsPageData } from "@/lib/docs-content";

export const cli: DocsPageData = {
  slug: "/cli",
  title: "CLI",
  blocks: [
    {
      kind: "markdown",
      body: "The Arche CLI wraps the stock shadcn CLI with the account layer shadcn lacks (login, tokens, entitlement). Installation mechanics are shadcn's — Arche never writes component files itself.",
    },
    {
      kind: "code",
      code: `arche login [--app <url>] [--token | --token-env]
  Sign in. Default is the browser loopback flow; --token pastes the
  registry token (headless), --token-env reads ARCHE_TOKEN (CI).
  --app (or ARCHE_TOKEN's cousin ARCHE_APP_URL) picks the app origin.
arche logout            # remove the local token (local only; revoke server-side in settings)
arche whoami            # signed-in account (verified against the app)
arche init <user>/<library> [--app <url>]
  Wire this project to a library (writes only components.json).
arche add <component...> [--library <user>/<library>] [--version <n>]
  Install components through the shadcn engine.
arche install [--library <user>/<library>]
  Install the whole library (the all item, theme included).
arche list [--library <user>/<library>]
  Print the wired library's component names.
arche check [--strict]  # standards scan (advisory; --strict exits 1 on findings)
arche doctor            # validate login, components.json, registry, shadcn setup`,
    },
    {
      kind: "markdown",
      body: "Private libraries send `Authorization: Bearer $ARCHE_TOKEN` from the stored login; the header in `components.json` stays the `${ARCHE_TOKEN}` placeholder — never paste a token there. Every command above works against this deployment.",
    },
    { kind: "markdown", body: "Commands and their meaning survive the v1→v2 engine swap unchanged." },
  ],
};
