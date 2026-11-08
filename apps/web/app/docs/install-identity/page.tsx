export default function InstallIdentity() {
  return (
    <div>
      <h1 className="font-display text-3xl">Install an identity</h1>
      <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed">
        <p>Identities install through the stock shadcn CLI — no Arche tooling required:</p>
        <pre className="overflow-x-auto rounded-md border-(length:--border-width) border-border bg-card p-3 text-xs">{`// components.json — replace <host>, <user>, <identity> with the install block values
{
  "registries": {
    "@arche": "https://<host>/r/<user>/<identity>/{name}.json"
  }
}

pnpm dlx shadcn@latest add @arche/all`}</pre>
        <p>
          Private libraries add an <code>Authorization: Bearer ${"${REGISTRY_TOKEN}"}</code> header entry
          (see Registry auth) and the same <code>add</code> command.
        </p>
        <p>
          Pin a version for reproducible installs:{" "}
          <code>https://&lt;host&gt;/r/&lt;user&gt;/&lt;identity&gt;/v/&lt;n&gt;/all.json</code>.
        </p>
      </div>
    </div>
  );
}
