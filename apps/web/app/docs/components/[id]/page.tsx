import { DocsLink } from "@/components/docs-base";
import { notFound } from "next/navigation";
import { getManifests } from "@arche/registry-core";
import { DocPreview } from "@/components/doc-preview";
import { CopyButton } from "@/components/copy-button";
import { PreviewFrame } from "@/components/preview-frame";
import { COMPONENT_USAGE } from "@/components/component-usage.generated";
import { Code } from "@/components/docs/blocks";
import { ArrowLeft } from "lucide-react";
import { DocsPageHeader } from "@/components/docs-page-header";

// Every component manifest gets a docs detail page — no curated subset.
export const DOC_IDS = getManifests().map((manifest) => manifest.name);

export function generateStaticParams() {
  return DOC_IDS.map((id) => ({ id }));
}

export default async function ComponentDoc({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const manifest = getManifests().find((m) => m.name === id);
  if (!manifest) notFound();

  const usage = COMPONENT_USAGE[manifest.name];

  const inherited = manifest.native
    ? `Every native <${manifest.native.element}> prop (React.ComponentProps<"${manifest.native.element}">).`
    : manifest.primitive
      ? `Every ${manifest.primitive.package} prop on ${manifest.primitive.parts.join(", ")}.`
      : "Every prop of the underlying element.";

  const axisRows = Object.entries(manifest.axes);

  return (
    <div>
      <DocsPageHeader title={manifest.title} />
      <p className="proto-lede">{manifest.description}</p>

      <div style={{ marginTop: 22 }}>
        <PreviewFrame
          className="min-h-56"
          canvasClassName="min-h-56 items-center"
          contentClassName="m-auto w-full max-w-full"
        >
          <DocPreview id={manifest.name} />
        </PreviewFrame>
      </div>

      <div className="proto-code" style={{ marginTop: 18 }}>
        <code>npx @arche/cli add {manifest.name}</code>
        <CopyButton text={`npx @arche/cli add ${manifest.name}`} />
      </div>

      <h2 style={{ marginTop: 30 }}>Props</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--line)", textAlign: "left" }}>
            <th style={{ textAlign: "left", padding: "10px 12px 10px 0", width: 130 }}>prop</th>
            <th style={{ textAlign: "left", padding: "10px 12px 10px 0" }}>type</th>
            <th style={{ textAlign: "left", padding: "10px 0", width: 120 }}>default</th>
          </tr>
        </thead>
        <tbody>
          {axisRows.map(([prop, definition]) => (
            <tr key={prop} style={{ borderBottom: "1px solid var(--line)" }}>
              <th style={{ textAlign: "left", padding: "10px 12px 10px 0", verticalAlign: "top" }}>
                <code>{prop}</code>
              </th>
              <td style={{ padding: "10px 12px 10px 0" }}>
                {definition.values.map((value) => (
                  <code key={String(value)} style={{ marginRight: 6 }}>
                    &quot;{String(value)}&quot;
                  </code>
                ))}
              </td>
              <td style={{ padding: "10px 0" }}>
                <code>{String(definition.default)}</code>
              </td>
            </tr>
          ))}
          <tr style={{ borderBottom: "1px solid var(--line)" }}>
            <th style={{ textAlign: "left", padding: "10px 12px 10px 0", verticalAlign: "top" }}>
              <code>className</code>
            </th>
            <td style={{ padding: "10px 12px 10px 0" }}>
              <code>string</code>
            </td>
            <td style={{ padding: "10px 0" }}>—</td>
          </tr>
          <tr style={{ borderBottom: "1px solid var(--line)" }}>
            <th style={{ textAlign: "left", padding: "10px 12px 10px 0", verticalAlign: "top" }}>inherited</th>
            <td style={{ padding: "10px 12px 10px 0" }}>{inherited}</td>
            <td style={{ padding: "10px 0" }}>—</td>
          </tr>
        </tbody>
      </table>
      {axisRows.length === 0 ? (
        <p className="proto-code-caption">No component-specific props — render it with its own content and classes.</p>
      ) : null}

      {usage ? (
        <>
          <h2 style={{ marginTop: 30 }}>Usage</h2>
          <div style={{ marginTop: 12 }}>
            <Code code={usage.code} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
            <CopyButton text={usage.code} />
          </div>
        </>
      ) : null}

      <p style={{ marginTop: 26 }}>
        <DocsLink path="/components"><ArrowLeft size={14} aria-hidden="true" style={{ verticalAlign: "-0.2em" }} /> All components</DocsLink>
      </p>
    </div>
  );
}
