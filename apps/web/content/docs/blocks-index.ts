import type { DocsPageData } from "@/lib/docs-content";

export const blocksIndex: DocsPageData = {
  slug: "/blocks",
  title: "All blocks",
  lede:
    "Complete page sections composed from catalog components, grouped into the sections the catalog aggregator uses. Click one for its live preview, install command, and composition.",
  blocks: [{ kind: "component", name: "BlocksIndex" }],
};
