import type { DocsPageData } from "@/lib/docs-content";

export const installation: DocsPageData = {
  slug: "",
  title: "Installation",
  lede: "Get started with Arche in just a few steps.",
  blocks: [
    { kind: "component", name: "PackageManagerInstall" },
    {
      kind: "steps",
      items: [
        {
          title: "Log in with the CLI",
          body: "Authenticate once — your registry token is stored locally and used for every install.",
        },
        {
          title: "Initialize, then add components",
          body: "Point your project at a library, then add components by name. Source files land in your project.",
        },
        {
          title: "Connect our MCP server",
          body: "Give your AI agents the same manifests you read — variants, tokens, and usage standards.",
        },
      ],
    },
    {
      kind: "callout",
      body: "Need help?",
      link: { label: "Check out our quick start guide", path: "/quick-start" },
    },
  ],
};
