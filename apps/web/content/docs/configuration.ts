import type { DocsPageData } from "@/lib/docs-content";

export const configuration: DocsPageData = {
  slug: "/configuration",
  title: "Configuration",
  lede: "Connect a project to a library with the CLI. No manual registry setup.",
  blocks: [
    {
      kind: "steps",
      items: [
        {
          title: "Log in once",
          body: "Authenticate with the hosted app. Your token is stored locally and reused for every install.",
          code: "npx @arche-ui/cli login",
        },
        {
          title: "Point your project at a library",
          body: "Find the name on the library page, then wire it. Files land in your project — you own the source.",
          code: "npx @arche-ui/cli init <user>/<library>\nnpx @arche-ui/cli add button hero-aurora",
        },
        {
          title: "Pin a version for reproducible installs",
          body: "Snapshots are immutable, so yesterday's install stays reproducible. List what's available any time.",
          code: "npx @arche-ui/cli list\nnpx @arche-ui/cli add button --version 3",
        },
      ],
    },
    { kind: "markdown", body: "## Private libraries" },
    {
      kind: "markdown",
      body: "Private libraries need the token header the CLI already sends after `login`. Issue a token in dashboard Settings; in CI, export it as `ARCHE_TOKEN` and log in with `arche login --token-env`.",
    },
    { kind: "markdown", body: "## Pointing elsewhere" },
    {
      kind: "markdown",
      body: "The CLI talks to the hosted app with no flags. While developing the app itself, override per command with `--app http://localhost:3000` or export `ARCHE_APP_URL`.",
    },
  ],
};
