import type { DocsPageData } from "@/lib/docs-content";

export const installation: DocsPageData = {
  slug: "/installation",
  title: "Installation",
  lede: "Install Arche in three steps.",
  blocks: [
    {
      kind: "steps",
      items: [
        {
          title: "Log in with the CLI",
          body: "Authenticate once. Your token is stored locally and reused for every install.",
          code: "npx @arche/cli login",
        },
        {
          title: "Initialize, then add components",
          body: "Point your project at a library, then add components by name. Files land in your project.",
          code: "npx @arche/cli init <user>/<library>\nnpx @arche/cli add button dialog select",
        },
        {
          title: "Connect the MCP server",
          body: "Give your agents the same manifests you read. [Full MCP setup](./mcp).",
          code: `// .mcp.json (Claude Code)\n{\n  "mcpServers": {\n    "arche": {\n      "command": "node",\n      "args": ["<repo>/packages/mcp/dist/stdio.js"],\n      "env": { "ARCHE_MCP_PAYLOADS": "<repo>/fixtures" }\n    }\n  }\n}`,
        },
      ],
    },
  ],
};
