import Link from "next/link";

export default function WebAppSpec() {
  return (
    <div>
      <span className="proto-chip">Specs &amp; Briefs</span>
      <h1>Web App Spec (§A1.9)</h1>
      <p className="proto-lede">
        Decisions from Spec Addendum A1 §A1.9 (2026-11-01), governing the public site and app shell.
      </p>
      <div className="proto-card" style={{ marginTop: 22 }}>
        <h3>a. Fixed rotating demo app</h3>
        <p>
          The hero and the Examples page render the same fixed mini application — Acme Tasks — which never
          changes its layout, content, or components. Only the library changes: the app cycles through generated
          identities on its own rotation, so visitors see one app wearing many libraries.
        </p>
        <h3>d. The Arche aurora identity, dogfooded</h3>
        <p>
          The site is styled end-to-end by the Arche identity — Arche UI&apos;s own aurora identity: soft violet →
          lavender → rose → sand washes, spacious and minimal — in both modes. We use our own product: one payload,
          light + dark token sets, subtle gradients.
        </p>
        <h3>First-class light / dark</h3>
        <p>
          Dark mode is a complete designed token set, not an inversion. The visitor&apos;s OS preference sets the
          initial theme; toggles in the public header, the app sidebar, and Settings drive the same switch.
        </p>
        <h3>Subtler gradients</h3>
        <p>
          Aurora blobs render at low opacity (.26 light / .14 dark) behind content only. Gradients stay washes;
          they never carry information or text.
        </p>
        <h3>Manifest-generated component pages</h3>
        <p>
          Component documentation pages are generated from the manifests: each page shows a live preview, its install
          command, and its anatomy (primitive / styling / style surface). The identity editor edits knob selections
          within each manifest&apos;s declared surface.
        </p>
      </div>
      <p style={{ marginTop: 26 }}>
        <Link href="/docs/brief-3">Next: Brief #3 — the web app build →</Link>
      </p>
    </div>
  );
}
