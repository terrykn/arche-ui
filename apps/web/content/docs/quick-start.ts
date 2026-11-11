import type { DocsPageData } from "@/lib/docs-content";

export const quickStart: DocsPageData = {
  slug: "/quick-start",
  title: "Quick Start",
  lede: "From zero to your first component in five minutes.",
  blocks: [
    {
      kind: "steps",
      items: [
        {
          title: "Create an account",
          body: "[Sign up](/sign-up) with email or Google, then open the Dashboard.",
        },
        {
          title: "Generate a library",
          body: "Describe the vibe — Arche builds tokens, variants, and all 30 components as one system.",
        },
        {
          title: "Install it",
          body: "Run `npx @arche/cli add button dialog select` and start building.",
        },
      ],
    },
  ],
};
