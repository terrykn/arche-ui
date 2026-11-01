export default function Configuration() {
  return (
    <div>
      <span className="proto-chip">Getting Started</span>
      <h1>Configuration</h1>
      <p className="proto-lede">Wire a project to a library with a registry snippet.</p>
      <h2>components.json</h2>
      <div className="proto-code proto-mono">
        {`{
  "registries": {
    "@arche": {
      "url": "https://arche-ui.dev/r/john-doe/acme-ui/{name}.json",
      "headers": { "Authorization": "Bearer \${ARCHE_TOKEN}" }
    }
  }
}`}
      </div>
      <p style={{ marginTop: 14 }}>
        The <span className="proto-mono">{"{name}"}</span> placeholder resolves per component. Private libraries
        require the <span className="proto-mono">ARCHE_TOKEN</span> header — issue one in Settings.
      </p>
    </div>
  );
}
