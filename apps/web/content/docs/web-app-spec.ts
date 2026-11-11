import type { DocsPageData } from "@/lib/docs-content";

export const webAppSpec: DocsPageData = {
  slug: "/web-app-spec",
  title: "Web App Spec (§A1.9)",
  lede: "Decisions from Spec Addendum A1 §A1.9 (2026-11-01), governing the public site and app shell.",
  blocks: [
    {
      kind: "cards",
      items: [
        {
          title: "a. Fixed rotating demo app",
          body: "The hero and the Examples page render the same fixed mini application — Acme Tasks — which never changes its layout, content, or components. Only the library changes: the app cycles through generated identities on its own rotation, so visitors see one app wearing many libraries.",
        },
        {
          title: "d. The Arche aurora identity, dogfooded",
          body: "The site is styled end-to-end by the Arche identity — Arche UI's own aurora identity: soft violet → lavender → rose → sand washes, spacious and minimal — in both modes. We use our own product: one payload, light + dark token sets, subtle gradients.",
        },
        {
          title: "First-class light / dark",
          body: "Dark mode is a complete designed token set, not an inversion. The visitor's OS preference sets the initial theme; toggles in the public header, the app sidebar, and Settings drive the same switch.",
        },
        {
          title: "Subtler gradients",
          body: "Aurora blobs render at low opacity (.26 light / .14 dark) behind content only. Gradients stay washes; they never carry information or text.",
        },
        {
          title: "Manifest-generated component pages",
          body: "Component documentation pages are generated from the manifests: each page shows a live preview, its install command, and its anatomy (primitive / styling / style surface). The identity editor edits knob selections within each manifest's declared surface.",
        },
      ],
    },
    { kind: "markdown", body: "Next: [Brief #3 — the web app build](./brief-3)" },
  ],
};
