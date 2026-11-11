import type { DocsPageData } from "@/lib/docs-content";

export const mcp: DocsPageData = {
  slug: "/mcp",
  title: "MCP",
  blocks: [
    {
      kind: "markdown",
      body: "The Arche MCP server answers agent questions from the same manifests this site renders: slots, knobs, tokens, and the checkable standards rules per component. Two transports share one tool registry: local stdio (free, payload files) and hosted Streamable HTTP at `/api/mcp` (dashboard MCP token).",
    },
    { kind: "markdown", body: "## Setup" },
    {
      kind: "markdown",
      body: "**1. Local server** (Claude Code / Cursor) — point the client at the built workspace package (npm publishing is out of scope):",
    },
    {
      kind: "code",
      code: `// Claude Code: ~/.claude.json (or project .mcp.json)
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
}`,
    },
    {
      kind: "markdown",
      body: "With no `ARCHE_MCP_PAYLOADS` the server still starts and answers catalog tools only.",
    },
    {
      kind: "markdown",
      body: "**2. Hosted server** — Dashboard → Settings → MCP tokens → Issue MCP token (raw shown once). Then configure the client with the Streamable HTTP URL and the token:",
    },
    {
      kind: "code",
      code: `// .mcp.json (hosted)
{
  "servers": {
    "arche": {
      "url": "https://<host>/api/mcp",
      "headers": { "Authorization": "Bearer <paste-mcp-token>" }
    }
  }
}`,
    },
    {
      kind: "markdown",
      body: "Private libraries behave like the registry: only the owner's token can read them (404 otherwise). Revoking the token disables hosted access on its next request.",
    },
    { kind: "markdown", body: "## Available tools" },
    { kind: "markdown", body: "Every tool below is served by both transports (generate_identity is hosted only):" },
    { kind: "component", name: "McpToolList" },
  ],
};
