import { DocsLink } from "@/components/docs-base";
import { getBlockManifests, getManifests, getTokenContract } from "@arche/registry-core";
import { buildToolRegistry } from "@arche/mcp";
import { DocsMarkdown } from "@/components/docs/markdown";
import { DocPreview } from "@/components/doc-preview";
import { BlockPreview } from "@/components/block-preview";
import {
  BLOCK_SECTIONS,
  COMPONENT_SECTIONS,
  type CatalogSection,
} from "@/content/catalog-sections.generated";

// Data-only docs blocks that need registry or manifest data. Each one is a
// server component: nothing here ships to the client (DocPreview and
// BlockPreview are client islands for the live previews).

/** Anchor id for a section heading, built from its group and label. */
export function sectionAnchor(section: Pick<CatalogSection, "group" | "label">) {
  return [section.group, section.label]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// The aggregator's sections as a clickable list — every entry jumps to its
// group below, so the index always mirrors catalog-aggregate.json.
function SectionLinks({ sections }: { sections: CatalogSection[] }) {
  return (
    <nav aria-label="Sections" className="proto-section-links">
      {sections.map((section) => (
        <a key={section.key} href={`#${sectionAnchor(section)}`} className="proto-section-link">
          {section.label}
          <span className="proto-section-count">{section.items.length}</span>
        </a>
      ))}
    </nav>
  );
}

// Every component manifest, grouped into the aggregator's sections, each with
// a small live preview. Title only — no badge, no description.
export function ComponentsIndex() {
  const byName = new Map(getManifests().map((manifest) => [manifest.name, manifest]));
  const sections = COMPONENT_SECTIONS.map((section) => ({
    ...section,
    entries: section.items.flatMap((name) => {
      const manifest = byName.get(name);
      return manifest ? [manifest] : [];
    }),
  })).filter((section) => section.entries.length > 0);

  return (
    <>
      <SectionLinks sections={sections} />
      <div style={{ display: "flex", flexDirection: "column", gap: 30, marginTop: 26 }}>
        {sections.map((section) => (
          <section key={section.key} id={sectionAnchor(section)}>
            <h2 style={{ margin: 0, fontSize: 18 }}>{section.label}</h2>
            <div className="proto-component-grid">
              {section.entries.map((manifest) => (
                <DocsLink
                  key={manifest.name}
                  path={`/components/${manifest.name}`}
                  className="proto-card"
                  style={{ padding: 12, textDecoration: "none", color: "inherit", display: "block" }}
                >
                  <div className="proto-component-preview">
                    <DocPreview id={manifest.name} compact />
                  </div>
                  <p style={{ margin: "10px 0 0", fontSize: 13, fontWeight: 600 }}>{manifest.title}</p>
                </DocsLink>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

// Every block manifest, one flat section per catalog name (Hero, Features,
// Pricing…), 3 previews per row. Title only — no badge, no description.
export function BlocksIndex() {
  const byName = new Map(getBlockManifests().map((manifest) => [manifest.name, manifest]));
  const sections = BLOCK_SECTIONS.map((section) => ({
    ...section,
    entries: section.items.flatMap((name) => {
      const manifest = byName.get(name);
      return manifest ? [manifest] : [];
    }),
  })).filter((section) => section.entries.length > 0);

  return (
    <>
      <SectionLinks sections={sections} />
      <div style={{ display: "flex", flexDirection: "column", gap: 30, marginTop: 26 }}>
        {sections.map((section) => (
          <section key={section.key} id={sectionAnchor(section)}>
            <h3 style={{ margin: 0, fontSize: 16 }}>{section.label}</h3>
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, marginTop: 14 }}
            >
              {section.entries.map((manifest) => (
                <DocsLink
                  key={manifest.name}
                  path={`/blocks/${manifest.name}`}
                  className="proto-card"
                  style={{ padding: 12, textDecoration: "none", color: "inherit", display: "block", minWidth: 0 }}
                >
                  <div
                    style={{
                      height: 170,
                      overflow: "hidden",
                      pointerEvents: "none",
                      // Contain fixed-position internals inside the card.
                      transform: "translateZ(0)",
                    }}
                  >
                    <BlockPreview name={manifest.name} />
                  </div>
                  <p style={{ margin: "10px 0 0", fontSize: 13, fontWeight: 600 }}>{manifest.title}</p>
                </DocsLink>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

export function McpToolList() {
  const tools = buildToolRegistry();
  return (
    <ul className="flex flex-col gap-2">
      {tools.map((tool) => (
        <li key={tool.name} className="rounded-md border-(length:--border-width) border-border p-3">
          <code className="text-xs font-semibold">{tool.name}</code>
          <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
        </li>
      ))}
    </ul>
  );
}

type Contract = {
  contractVersion: number;
  colorSpace: string;
  modes: string[];
  tokens: Array<{ name: string; $type: string; group: string }>;
  contrastPairs: Array<{ fg: string; bg: string; minRatio: number }>;
};

export function TokenContractTables() {
  const contract = getTokenContract() as Contract;
  const byGroup = new Map<string, Array<{ name: string; $type: string }>>();
  for (const token of contract.tokens) {
    const list = byGroup.get(token.group) ?? [];
    list.push(token);
    byGroup.set(token.group, list);
  }
  return (
    <>
      <p className="mt-2 text-sm text-muted-foreground">
        {contract.colorSpace} · modes: {contract.modes.join(", ")} · every token required in both modes.
        Generated from the contract data. There is no hand-written list.
      </p>
      <div className="mt-4 flex flex-col gap-4">
        {[...byGroup.entries()].map(([group, tokens]) => (
          <section key={group}>
            <h2 className="font-medium capitalize">{group}</h2>
            <ul className="mt-1 text-sm text-muted-foreground">
              {tokens.map((token) => (
                <li key={token.name}>
                  <code>{token.name}</code> ({token.$type})
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section className="mt-4">
        <h2 className="font-medium">Contrast pairs (WCAG AA)</h2>
        <ul className="mt-1 text-sm text-muted-foreground">
          {contract.contrastPairs.map((pair) => (
            <li key={`${pair.fg}-on-${pair.bg}`}>
              <code>{pair.fg}</code> on <code>{pair.bg}</code> ≥ {pair.minRatio}:1
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}  /** Markdown body inside a card. Used by generated index sections. */
export function DocCardBody({ title, body }: { title: string; body: string }) {
  return (
    <>
      <h3>{title}</h3>
      <DocsMarkdown body={body} />
    </>
  );
}
