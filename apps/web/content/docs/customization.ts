import type { DocsPageData } from "@/lib/docs-content";

export const customization: DocsPageData = {
  slug: "/customization",
  title: "Customization",
  lede: "Generate an identity with AI, or build one by hand.",
  blocks: [
    { kind: "markdown", body: "## Generate with AI" },
    {
      kind: "markdown",
      body: "Dashboard → New Identity. Describe your product in one sentence: what you are building, two or three style words, and a color direction.",
    },
    { kind: "code", code: "booking app for a dental clinic, calm, soft blue" },
    {
      kind: "markdown",
      body: "Anything you skip falls back to defaults you can edit below. Generation saves a private draft. Publishing is a separate explicit action.",
    },
    { kind: "markdown", body: "## Create manually" },
    {
      kind: "markdown",
      body: "Start from the Arche Default payload in the dashboard editor. Token fields cover the contract tokens per mode. Knobs offer legal values only. Save Draft validates. Publish stores an immutable versioned snapshot.",
    },
    { kind: "markdown", body: "## What you can customize" },
    {
      kind: "steps",
      items: [
        {
          title: "Tokens",
          body: "Colors, radius, typography, shadows, and motion. Set per mode, light and dark. Contrast pairs are checked as you edit.",
        },
        {
          title: "Knobs",
          body: "Default variants, sizes, and surfaces per component. Only legal values are offered.",
        },
        {
          title: "Nudge with words",
          body: "On generated identities, a prompt edit like “warmer, less playful” recompiles the affected fields only. The rest stays byte-identical and the diff is inspectable. Hand-recorded overrides survive recompilation.",
        },
        {
          title: "Publish a version",
          body: "Snapshots are immutable, so yesterday's install stays reproducible.",
        },
      ],
    },
  ],
};
