import { DocsLink } from "@/components/docs-base";
import { getBlockManifests, getManifests, getTokenContract } from "@arche/registry-core";
import { buildToolRegistry } from "@arche/mcp";
import { DocsMarkdown } from "@/components/docs/markdown";
import { DocPreview } from "@/components/doc-preview";
import { BlockPreview } from "@/components/block-preview";

// Data-only docs blocks that need registry or manifest data. Each one is a
// server component: nothing here ships to the client (DocPreview and
// BlockPreview are client islands for the live previews).

// Every component manifest, each with a small live preview. Title only —
// no badge, no description. Dense grid: the previews are small.
export function ComponentsIndex() {
  const manifests = getManifests();
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 14, marginTop: 22 }}
    >
      {manifests.map((manifest) => (
        <DocsLink
          key={manifest.name}
          path={`/components/${manifest.name}`}
          className="proto-card"
          style={{ padding: 12, textDecoration: "none", color: "inherit", display: "block" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 72,
              overflow: "hidden",
              pointerEvents: "none",
            }}
          >
            <DocPreview id={manifest.name} />
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 13, fontWeight: 600 }}>{manifest.title}</p>
        </DocsLink>
      ))}
    </div>
  );
}

// Every block manifest, each with a small live preview, 3 per row.
// Title only — no badge, no description.
export function BlocksIndex() {
  const manifests = getBlockManifests();
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, marginTop: 22 }}
    >
      {manifests.map((manifest) => (
        <DocsLink
          key={manifest.name}
          path={`/blocks/${manifest.name}`}
          className="proto-card"
          style={{ padding: 12, textDecoration: "none", color: "inherit", display: "block", minWidth: 0 }}
        >
          <div style={{ height: 170, overflow: "hidden", pointerEvents: "none" }}>
            <BlockPreview name={manifest.name} />
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 13, fontWeight: 600 }}>{manifest.title}</p>
        </DocsLink>
      ))}
    </div>
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
