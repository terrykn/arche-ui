export default function CliDocs() {
  return (
    <div>
      <h1 className="font-display text-3xl">CLI</h1>
      <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed">
        <p>
          The Arche CLI wraps the stock shadcn CLI with the account layer shadcn lacks
          (login, tokens, entitlement). Installation mechanics are shadcn&apos;s — Arche never
          writes component files itself.
        </p>
        <pre className="overflow-x-auto rounded-md border border-border bg-card p-3 text-xs">{`arche login [--app <url>] [--token | --token-env]
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
arche doctor            # validate login, components.json, registry, shadcn setup`}</pre>
        <p>
          Private libraries send <code>Authorization: Bearer $ARCHE_TOKEN</code> from the
          stored login; the header in <code>components.json</code> stays the{" "}
          <code>$&#123;ARCHE_TOKEN&#125;</code> placeholder — never paste a token there.
          Every command above works against this deployment.
        </p>
        <p>Commands and their meaning survive the v1→v2 engine swap unchanged.</p>
      </div>
    </div>
  );
}
