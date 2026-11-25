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
          code: "npx @arche-ui/cli login",
        },
        {
          title: "Initialize, then add components",
          body: "Point your project at a library, then add components by name. Files land in your project.",
          code: "npx @arche-ui/cli init <user>/<library>\nnpx @arche-ui/cli add button dialog select",
        },
        {
          title: "Connect the MCP server",
          body: "Give your agents the same manifests you read. Paste an MCP token from dashboard Settings. [Full MCP setup](./mcp).",
          code: `// .mcp.json (Claude Code)\n{\n  "servers": {\n    "arche": {\n      "url": "https://arche-ui.vercel.app/api/mcp",\n      "headers": { "Authorization": "Bearer <paste-mcp-token>" }\n    }\n  }\n}`,
        },
      ],
    },
  ],
};
