export default function AiMcp() {
  return (
    <div>
      <span className="proto-chip">Advanced</span>
      <h1>AI &amp; MCP</h1>
      <p className="proto-lede">Agents speak Arche through the MCP server — the same manifests you read.</p>
      <h2>Tools</h2>
      <div className="proto-code proto-mono" style={{ marginTop: 12 }}>
        mcp: arche get_component("dialog")
      </div>
      <p style={{ marginTop: 14 }}>
        <strong>get_component</strong> returns a component&apos;s variants, tokens, and usage standards.{" "}
        <strong>check_usage</strong> validates a placement against the component&apos;s standards before code is
        written.
      </p>
    </div>
  );
}
