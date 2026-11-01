export default function McpDocs() {
  return (
    <div>
      <h1 className="font-display text-3xl">MCP overview + setup</h1>
      <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed">
        <p>
          The hosted MCP server (a later Brief #4-adjacent service — docs only here) answers agent
          questions from the same manifests this site renders: props inheritance, knobs, tokens, and
          the checkable standards rules per component.
        </p>
        <p>Setup, when the hosted server ships:</p>
        <pre className="overflow-x-auto rounded-md border border-border bg-card p-3 text-xs">{`// .mcp.json (planned — not live in this brief)
{
  "servers": {
    "arche": { "url": "https://<host>/mcp", "headers": { "Authorization": "Bearer ${"${ARCHE_TOKEN}"}" } }
  }
}`}</pre>
        <p>
          Until then, agents get identical answers from the <a href="/components" className="underline">component
          reference</a> and the <a href="/docs/token-contract" className="underline">token contract</a> pages,
          which read the same manifest data.
        </p>
      </div>
    </div>
  );
}
