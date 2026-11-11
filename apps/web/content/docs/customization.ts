import type { DocsPageData } from "@/lib/docs-content";

export const customization: DocsPageData = {
  slug: "/customization",
  title: "Customization",
  lede: "Every identity is data — tune it without touching component code.",
  blocks: [
    { kind: "markdown", body: "## Generate with AI" },
    {
      kind: "markdown",
      body: "The fastest way to start is Dashboard → **New Identity**: type one sentence describing your product or brand into the input and Arche generates the full library for you. It lands as a **private draft** — publishing is always a separate, explicit action.",
    },
    {
      kind: "markdown",
      body: "A good sentence says **what you're building**, the **mood in a few adjectives**, and a **color direction**:",
    },
    { kind: "code", code: "“booking app for a dental clinic, calm and soft blue”" },
    {
      kind: "markdown",
      body: "What to include: the product or audience (“booking app for a dental clinic”, “retro game shop for handheld collectors”, “enterprise company”), 2–3 style words (“calm”, “playful”, “bold and trusted”), and a color cue (“soft blue”, “pixel style”, “bright red”). Anything you leave out falls back to sensible defaults you can adjust below.",
    },
    { kind: "markdown", body: "## What you can customize" },
    {
      kind: "steps",
      items: [
        {
          title: "Tokens",
          body: "Colors (accent, surfaces, text — contrast pairs are checked as you go), border radius, typography, shadows, and motion. Every token is set per mode, light and dark.",
        },
        {
          title: "Knobs",
          body: "Default variants, sizes, and surface options per component — only legal values are offered, so an off-system choice is unrepresentable.",
        },
        {
          title: "Nudge with words",
          body: "On generated identities, a prompt edit (“warmer, less playful”) recompiles only the implicated fields — the rest stays byte-identical and the diff is inspectable. Hand-recorded token overrides survive recompilation.",
        },
        {
          title: "Publish a version",
          body: "Snapshots are immutable, so yesterday's install stays reproducible.",
        },
      ],
    },
  ],
};
