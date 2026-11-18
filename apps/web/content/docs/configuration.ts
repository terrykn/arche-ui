import type { DocsPageData } from "@/lib/docs-content";

export const configuration: DocsPageData = {
  slug: "/configuration",
  title: "Configuration",
  lede: "Connect a project to a library, then install from it.",
  blocks: [
    { kind: "markdown", body: "## Point at a registry" },
    {
      kind: "markdown",
      body: "Add the library to `components.json`. Replace `<host>`, `<user>`, and `<identity>` with the values from the library page.",
    },
    {
      kind: "code",
      code: `{
  "registries": {
    "@arche": {
      "url": "https://<host>/r/<user>/<identity>/{name}.json",
      "headers": { "Authorization": "Bearer \${ARCHE_TOKEN}" }
    }
  }
}`,
    },
    {
      kind: "markdown",
      body: "The `{name}` placeholder resolves per component. Private libraries need the token header. Issue a token in dashboard Settings and export it as `ARCHE_TOKEN`.",
    },
    { kind: "markdown", body: "## Install a component or a block" },
    {
      kind: "markdown",
      body: "Use the stock shadcn CLI. No Arche tooling required.",
    },
    {
      kind: "code",
      code: "pnpm dlx shadcn@latest add @arche/button\npnpm dlx shadcn@latest add @arche/hero",
    },
    {
      kind: "markdown",
      body: "Pin a version for reproducible installs. Swap `{name}.json` for `v/<n>/all.json`.",
    },
  ],
};
