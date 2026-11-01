import Link from "next/link";

export default function Brief3() {
  return (
    <div>
      <span className="proto-chip">Specs &amp; Briefs</span>
      <h1>Brief #3 — Web App</h1>
      <p className="proto-lede">The web app build: Supabase data + auth, server-side publish, registry serving, dashboard, public site.</p>
      <div className="proto-card" style={{ marginTop: 22 }}>
        <h3>Deliverables</h3>
        <ol style={{ paddingLeft: 20, margin: "10px 0", display: "grid", gap: 8 }}>
          <li><strong>The Arche identity + app theming</strong> — the site&apos;s own identity payload, the token pipeline into the app, light/dark toggle.</li>
          <li><strong>Data layer + auth</strong> — Supabase schema with row-level security, Supabase Auth, gated dashboard.</li>
          <li><strong>Publish + registry serving</strong> — server-side validate → emit → immutable snapshot, served at <code>/r/&lt;username&gt;/&lt;library&gt;/</code> with entitlement checks.</li>
          <li><strong>Dashboard</strong> — manage applications and identities end to end: create/edit manually, publish, versions, install instructions.</li>
          <li><strong>Public site</strong> — landing with hero rotation and Examples, identities gallery, manifest-generated components pages, public identity pages, pricing display, docs including MCP docs.</li>
        </ol>
        <h3>Out of scope</h3>
        <p>
          The Arche CLI package, the hosted MCP server (docs pages only), AI generation of identities, Stripe
          checkout/billing enforcement, Remix execution, React Native registry content.
        </p>
      </div>
      <p style={{ marginTop: 26 }}>
        <Link href="/docs/web-app-spec">← Web App Spec (§A1.9)</Link>
      </p>
    </div>
  );
}
