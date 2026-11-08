import { buildToolRegistry } from "@arche/mcp";

export default function McpDocs() {
  const tools = buildToolRegistry();
  return (
    <div>
      <h1 className="font-display text-3xl">MCP overview + setup</h1>
      <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed">
        <p>
          The Arche MCP server answers agent questions from the same manifests this site renders:
          slots, knobs, tokens, and the checkable standards rules per component. Two transports share
          one tool registry: local stdio (free, payload files) and hosted Streamable HTTP at{" "}
          <code>/api/mcp</code> (dashboard MCP token).
        </p>
        <h2 className="mt-2 text-lg font-medium">Local server (Claude Code / Cursor)</h2>
        <p>Point the client at the built workspace package (npm publishing is out of scope):</p>
        <pre className="overflow-x-auto rounded-md border-(length:--border-width) border-border bg-card p-3 text-xs">{`// Claude Code: ~/.claude.json (or project .mcp.json)
// ARCHE_MCP_PAYLOADS points at a payload file or a directory of payloads.
{
  "mcpServers": {
    "arche": {
      "command": "node",
      "args": ["<repo>/packages/mcp/dist/stdio.js"],
      "env": { "ARCHE_MCP_PAYLOADS": "<repo>/fixtures" }
    }
  }
}

// Cursor: .cursor/mcp.json — same shape:
{
  "mcpServers": {
    "arche": {
      "command": "node",
      "args": ["<repo>/packages/mcp/dist/stdio.js"],
      "env": { "ARCHE_MCP_PAYLOADS": "<repo>/fixtures/identity.default.json" }
    }
  }
}`}</pre>
        <p>
          With no <code>ARCHE_MCP_PAYLOADS</code> the server still starts and answers catalog tools
          only.
        </p>
        <h2 className="mt-2 text-lg font-medium">Hosted server</h2>
        <p>
          1. Dashboard → Settings → MCP tokens → Issue MCP token (raw shown once). 2. Configure the
          client with the Streamable HTTP URL and the token:
        </p>
        <pre className="overflow-x-auto rounded-md border-(length:--border-width) border-border bg-card p-3 text-xs">{`// .mcp.json (hosted)
{
  "servers": {
    "arche": {
      "url": "https://<host>/api/mcp",
      "headers": { "Authorization": "Bearer <paste-mcp-token>" }
    }
  }
}`}</pre>
        <p>
          Private libraries behave like the registry: only the owner&apos;s token can read them (404
          otherwise). Revoking the token disables hosted access on its next request.
        </p>
        <h2 className="mt-2 text-lg font-medium">Tools reference (generated from the shipped registry)</h2>
        <ul className="flex flex-col gap-2">
          {tools.map((t) => (
            <li key={t.name} className="rounded-md border-(length:--border-width) border-border p-3">
              <code className="text-xs font-semibold">{t.name}</code>
              <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
