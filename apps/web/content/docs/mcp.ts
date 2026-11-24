import type { DocsPageData } from "@/lib/docs-content";

export const mcp: DocsPageData = {
  slug: "/mcp",
  title: "MCP",
  lede: "Point your agent at the same manifests this site renders.",
  blocks: [
    {
      kind: "markdown",
      body: "The Arche MCP server serves slots, knobs, tokens, and checkable standards rules to your agents. Pick a transport. Both serve the same tool registry.",
    },
    { kind: "markdown", body: "## Local server" },
    {
      kind: "markdown",
      body: "Free. Runs over stdio and reads payload files. Point Claude Code or Cursor at the built workspace package.",
    },
    {
      kind: "code",
      code: `// .mcp.json (Claude Code)
// ARCHE_MCP_PAYLOADS points at a payload file or a directory of payloads.
{
  "mcpServers": {
    "arche": {
      "command": "node",
      "args": ["<repo>/packages/mcp/dist/stdio.js"],
      "env": { "ARCHE_MCP_PAYLOADS": "<repo>/fixtures" }
    }
  }
}`,
    },
    {
      kind: "markdown",
      body: "With no `ARCHE_MCP_PAYLOADS` the server still starts and answers catalog tools only.",
    },
    { kind: "markdown", body: "## Hosted server" },
    {
      kind: "markdown",
      body: "Dashboard → Settings → MCP tokens → Issue MCP token. The raw token shows once. Configure the client with the Streamable HTTP URL and the token.",
    },
    {
      kind: "code",
      code: `// .mcp.json (hosted)
{
  "servers": {
    "arche": {
      "url": "https://arche-ui.vercel.app/api/mcp",
      "headers": { "Authorization": "Bearer <paste-mcp-token>" }
    }
  }
}`,
    },
    {
      kind: "markdown",
      body: "Private libraries behave like the registry. Only the owner's token can read them. Revoking the token disables hosted access on its next request.",
    },
    { kind: "markdown", body: "## Available tools" },
    {
      kind: "markdown",
      body: "Every tool below is served by both transports. `generate_identity` is hosted only.",
    },
    { kind: "component", name: "McpToolList" },
  ],
};
