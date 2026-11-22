import type { DocsPageData } from "@/lib/docs-content";

export const componentsIndex: DocsPageData = {
  slug: "/components",
  title: "All components",
  lede:
    "Every component, grouped into the sections the catalog aggregator uses. Click one for its live preview, install command, props, and usage example.",
  blocks: [{ kind: "component", name: "ComponentsIndex" }],
};
