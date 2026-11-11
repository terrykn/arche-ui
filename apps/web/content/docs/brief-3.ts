import type { DocsPageData } from "@/lib/docs-content";

export const brief3: DocsPageData = {
  slug: "/brief-3",
  title: "Brief #3 — Web App",
  lede: "The web app build: Supabase data + auth, server-side publish, registry serving, dashboard, public site.",
  blocks: [
    {
      kind: "cards",
      items: [
        {
          title: "Deliverables",
          body: `1. **The Arche identity + app theming** — the site's own identity payload, the token pipeline into the app, light/dark toggle.
2. **Data layer + auth** — Supabase schema with row-level security, Supabase Auth, gated dashboard.
3. **Publish + registry serving** — server-side validate → emit → immutable snapshot, served at \`/r/<username>/<library>/\` with entitlement checks.
4. **Dashboard** — manage applications and identities end to end: create/edit manually, publish, versions, install instructions.
5. **Public site** — landing with hero rotation and Examples, identities gallery, manifest-generated components pages, public identity pages, pricing display, docs including MCP docs.`,
        },
        {
          title: "Out of scope",
          body: "The Arche CLI package, the hosted MCP server (docs pages only), AI generation of identities, Stripe checkout/billing enforcement, Remix execution, React Native registry content.",
        },
      ],
    },
    { kind: "markdown", body: "[Web App Spec (§A1.9)](./web-app-spec)" },
  ],
};
