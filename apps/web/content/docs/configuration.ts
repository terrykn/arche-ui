import type { DocsPageData } from "@/lib/docs-content";

export const configuration: DocsPageData = {
  slug: "/configuration",
  title: "Configuration",
  lede: "Wire a project to a library with a registry snippet.",
  blocks: [
    { kind: "markdown", body: "## components.json" },
    {
      kind: "code",
      code: `{
  "registries": {
    "@arche": {
      "url": "https://arche-ui.dev/r/john-doe/acme-ui/{name}.json",
      "headers": { "Authorization": "Bearer \${ARCHE_TOKEN}" }
    }
  }
}`,
    },
    {
      kind: "markdown",
      body: 'The `{name}` placeholder resolves per component. Private libraries require the `ARCHE_TOKEN` header — issue one in Settings.',
    },
  ],
};
