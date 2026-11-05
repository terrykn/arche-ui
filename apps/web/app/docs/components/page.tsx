import Link from "next/link";
import { getManifests } from "@arche/registry-core";

const DOC_IDS = [
  "button", "card", "input", "dialog", "dropdown-menu", "select", "checkbox",
  "switch", "tabs", "accordion", "tooltip", "popover", "badge", "avatar",
  "slider", "progress", "toast", "alert-dialog",
];

export default function AllComponents() {
  const manifests = getManifests().filter((m) => DOC_IDS.includes(m.name));
  return (
    <div>
      <span className="proto-chip">Components</span>
      <h1>All components</h1>
      <p className="proto-lede">Eighteen entries — click one for its live preview, install command, and anatomy.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 22 }}>
        {manifests.map((manifest) => (
          <Link
            key={manifest.name}
            href={`/docs/components/${manifest.name}`}
            className="proto-card"
            style={{ padding: 18, textDecoration: "none", color: "inherit", display: "block" }}
          >
            <strong>{manifest.title}</strong>
            <p style={{ color: "var(--muted-foreground)", margin: "6px 0 0", fontSize: 13.5 }}>{manifest.description}</p>
            <p style={{ color: "var(--faint)", margin: "8px 0 0", fontSize: 12.5 }}>{manifest.category}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
