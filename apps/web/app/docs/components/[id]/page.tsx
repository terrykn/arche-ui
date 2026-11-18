import { DocsLink } from "@/components/docs-base";
import { notFound } from "next/navigation";
import { getManifests } from "@arche/registry-core";
import { DocPreview } from "@/components/doc-preview";
import { CopyButton } from "@/components/copy-button";
import { ArrowLeft } from "lucide-react";
import { DocsPageHeader } from "@/components/docs-page-header";

export const DOC_IDS = [
  "button", "card", "input", "dialog", "dropdown-menu", "select", "checkbox",
  "switch", "tabs", "accordion", "tooltip", "popover", "badge", "avatar",
  "slider", "progress", "toast", "alert-dialog",
];

export function generateStaticParams() {
  return DOC_IDS.map((id) => ({ id }));
}

export default async function ComponentDoc({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const manifest = getManifests().find((m) => m.name === id);
  if (!manifest || !DOC_IDS.includes(id)) notFound();

  const behavior = manifest.primitive
    ? `${manifest.primitive.package}. Parts: ${manifest.primitive.parts.join(", ")}`
    : manifest.native
      ? `native <${manifest.native.element}> (presentational)`
      : "None.";
  const surface = Object.entries(manifest.styleSurface)
    .map(([slot, knobs]) => `${slot}: ${Object.keys(knobs).join(", ")}`)
    .join(" · ");

  return (
    <div>
      <DocsPageHeader title={manifest.title} />
      <p className="proto-lede">{manifest.description}</p>

      <div className="proto-card" style={{ marginTop: 22 }}>
        <DocPreview id={manifest.name} />
      </div>

      <div className="proto-code" style={{ marginTop: 18 }}>
        <code>npx @arche/cli add {manifest.name}</code>
        <CopyButton text={`npx @arche/cli add ${manifest.name}`} />
      </div>

      <h2 style={{ marginTop: 30 }}>Anatomy</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 14 }}>
        <tbody>
          <tr style={{ borderTop: "1px solid var(--line)" }}>
            <th style={{ textAlign: "left", padding: "10px 12px 10px 0", width: 130, verticalAlign: "top" }}>primitive</th>
            <td style={{ padding: "10px 0" }}>{behavior}</td>
          </tr>
          <tr style={{ borderTop: "1px solid var(--line)" }}>
            <th style={{ textAlign: "left", padding: "10px 12px 10px 0", verticalAlign: "top" }}>styling</th>
            <td style={{ padding: "10px 0" }}>
              Token-only classes on every part (<code>data-slot</code> marked), composed with <code>cn()</code>; state styling via Radix <code>data-*</code> attributes.
            </td>
          </tr>
          <tr style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
            <th style={{ textAlign: "left", padding: "10px 12px 10px 0", verticalAlign: "top" }}>style surface</th>
            <td style={{ padding: "10px 0" }}>{surface}</td>
          </tr>
        </tbody>
      </table>

      <p style={{ marginTop: 26 }}>
        <DocsLink path="/components"><ArrowLeft size={14} aria-hidden="true" style={{ verticalAlign: "-0.2em" }} /> All components</DocsLink>
      </p>
    </div>
  );
}
