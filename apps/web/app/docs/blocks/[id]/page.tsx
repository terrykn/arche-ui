import { DocsLink } from "@/components/docs-base";
import { notFound } from "next/navigation";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getBlockManifests } from "@arche/registry-core";
import { BlockPreview } from "@/components/block-preview";
import { blockBackgroundAttr, surfaceSlotForBlock } from "@/components/surface-attrs";
import { BLOCK_SECTION_BY_NAME } from "@/content/catalog-sections.generated";
import { CopyButton } from "@/components/copy-button";
import { ArrowLeft } from "lucide-react";
import { DocsPageHeader } from "@/components/docs-page-header";

/** Default-identity per-block backgrounds (fixture is the documented default). */
function fixtureBlockBackground(name: string): string | undefined {
  try {
    const base = process.cwd().endsWith("web") ? join(process.cwd(), "..", "..") : process.cwd();
    const fixture = JSON.parse(readFileSync(join(base, "fixtures", "identity.default.json"), "utf8"));
    const background = fixture?.components?.[name]?.background;
    return typeof background === "string" ? background : undefined;
  } catch {
    return undefined;
  }
}

export function generateStaticParams() {
  return getBlockManifests().map((manifest) => ({ id: manifest.name }));
}

export default async function BlockDoc({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const manifest = getBlockManifests().find((m) => m.name === id);
  if (!manifest || !manifest.composition) notFound();
  const composition = manifest.composition;

  const slots = composition.contentSlots
    .map(
      (slot) =>
        `${slot.name} (${slot.kind}${slot.required ? ", required" : ", optional"}${slot.max ? `, max ${slot.max}` : ""})`,
    )
    .join(" · ");
  const children = composition.childComponents
    .map((c) => `${c.name}${c.min ? ` ≥${c.min}` : ""}${c.max ? ` ≤${c.max}` : ""}`)
    .join(" · ");

  return (
    <div>
      <DocsPageHeader title={manifest.title} />
      <p className="proto-lede">{manifest.description}</p>

      <div className="proto-card proto-block-frame" style={{ marginTop: 22 }}>
        <div
          className="flex flex-col items-center justify-center"
          {...(surfaceSlotForBlock(BLOCK_SECTION_BY_NAME[manifest.name]) === "band"
            ? { "data-arche-band": "" }
            : { "data-arche-section": "" })}
          {...blockBackgroundAttr(fixtureBlockBackground(manifest.name))}
        >
          <BlockPreview name={manifest.name} />
        </div>
      </div>

      <div className="proto-code" style={{ marginTop: 18 }}>
        <code>npx @arche/cli add {manifest.name}</code>
        <CopyButton text={`npx @arche/cli add ${manifest.name}`} />
      </div>

      <h2 style={{ marginTop: 30 }}>Composition</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 14 }}>
        <tbody>
          <tr style={{ borderTop: "1px solid var(--line)" }}>
            <th style={{ textAlign: "left", padding: "10px 12px 10px 0", width: 130, verticalAlign: "top" }}>
              content slots
            </th>
            <td style={{ padding: "10px 0" }}>{slots}</td>
          </tr>
          <tr style={{ borderTop: "1px solid var(--line)" }}>
            <th style={{ textAlign: "left", padding: "10px 12px 10px 0", verticalAlign: "top" }}>
              child components
            </th>
            <td style={{ padding: "10px 0" }}>{children}</td>
          </tr>
          <tr style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
            <th style={{ textAlign: "left", padding: "10px 12px 10px 0", verticalAlign: "top" }}>heading role</th>
            <td style={{ padding: "10px 0" }}>
              <code>{composition.headingRole}</code>
              {composition.landmark ? (
                <>
                  {" "}· landmark: <code>{composition.landmark}</code>
                </>
              ) : null}
            </td>
          </tr>
        </tbody>
      </table>

      <p style={{ marginTop: 26 }}>
        <DocsLink path="/blocks">
          <ArrowLeft size={14} aria-hidden="true" style={{ verticalAlign: "-0.2em" }} /> All blocks
        </DocsLink>
      </p>
    </div>
  );
}
