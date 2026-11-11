import type { DocsPageData } from "@/lib/docs-content";

export const gettingStarted: DocsPageData = {
  slug: "/getting-started",
  title: "Getting started",
  blocks: [
    {
      kind: "markdown",
      body: `1. Browse the [identities gallery](/identities) and open a public identity's page for its install block.
2. Point the stock shadcn CLI at the identity's registry URL (see [Install an identity](./install-identity)).
3. To author your own library, [create an account](/sign-up), open the dashboard, and create an identity — the editor only offers legal values.`,
    },
  ],
};
