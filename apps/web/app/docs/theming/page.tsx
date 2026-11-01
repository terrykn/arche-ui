export default function Theming() {
  return (
    <div>
      <span className="proto-chip">Advanced</span>
      <h1>Theming</h1>
      <p className="proto-lede">
        The app is styled end-to-end by the Arche identity — Arche UI&apos;s own aurora identity: soft violet →
        lavender → rose → sand washes, spacious and minimal — in both modes (light + dark).
      </p>
      <h2>DTCG tokens</h2>
      <p>
        Identities store design tokens in DTCG format — <span className="proto-mono">$value</span> /{" "}
        <span className="proto-mono">$type</span> / <span className="proto-mono">$description</span> — with OKLCH
        colors. The registry compiles them to CSS variables at publish time; your project receives plain variables,
        never a runtime.
      </p>
    </div>
  );
}
