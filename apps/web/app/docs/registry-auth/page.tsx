export default function RegistryAuth() {
  return (
    <div>
      <h1 className="font-display text-3xl">Registry auth</h1>
      <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed">
        <p>Public libraries serve openly. Private libraries require your registry token:</p>
        <pre className="overflow-x-auto rounded-md border-(length:--border-width) border-border bg-card p-3 text-xs">{`// components.json (private library)
{
  "registries": {
    "@arche": {
      "url": "https://<host>/r/<user>/<identity>/{name}.json",
      "headers": { "Authorization": "Bearer ${"${REGISTRY_TOKEN}"}" }
    }
  }
}`}</pre>
        <p>
          Issue the token in dashboard Settings — shown once, stored hashed, revocable. Requests
          without a valid token get a bare 404 (no payload content, no existence hint).
        </p>
      </div>
    </div>
  );
}
