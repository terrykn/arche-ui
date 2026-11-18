import { DocsLink } from "@/components/docs-base";
import { getBlockManifests, getManifests, getTokenContract } from "@arche/registry-core";
import { buildToolRegistry } from "@arche/mcp";
import { DocsMarkdown } from "@/components/docs/markdown";

// Data-only docs blocks that need registry or manifest data. Each one is a
// server component: nothing here ships to the client.

const DOC_IDS = [
  "button", "card", "input", "dialog", "dropdown-menu", "select", "checkbox",
  "switch", "tabs", "accordion", "tooltip", "popover", "badge", "avatar",
  "slider", "progress", "toast", "alert-dialog",
];

export function ComponentsIndex() {
  const manifests = getManifests().filter((manifest) => DOC_IDS.includes(manifest.name));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 22 }}>
      {manifests.map((manifest) => (
        <DocsLink
          key={manifest.name}
          path={`/components/${manifest.name}`}
          className="proto-card"
          style={{ padding: 18, textDecoration: "none", color: "inherit", display: "block" }}
        >
          <strong>{manifest.title}</strong>
          <p style={{ color: "var(--muted-foreground)", margin: "6px 0 0", fontSize: 13.5 }}>{manifest.description}</p>
          <p style={{ color: "var(--faint)", margin: "8px 0 0", fontSize: 12.5 }}>{manifest.category}</p>
        </DocsLink>
      ))}
    </div>
  );
}

export function BlocksIndex({ groups = ["marketing", "application"] }: { groups?: string[] }) {
  const manifests = getBlockManifests();
  return (
    <>
      {groups.map((category) => {
        const items = manifests.filter((manifest) => manifest.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category} style={{ marginTop: 26 }}>
            <h2 style={{ textTransform: "capitalize", fontSize: 17 }}>{category}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12 }}>
              {items.map((manifest) => (
                <DocsLink
                  key={manifest.name}
                  path={`/blocks/${manifest.name}`}
                  className="proto-card"
                  style={{ padding: 18, textDecoration: "none", color: "inherit", display: "block" }}
                >
                  <strong>{manifest.title}</strong>
                  <p style={{ color: "var(--muted-foreground)", margin: "6px 0 0", fontSize: 13.5 }}>
                    {manifest.description}
                  </p>
                  <p style={{ color: "var(--faint)", margin: "8px 0 0", fontSize: 12.5 }}>
                    {(manifest.composition?.childComponents ?? []).map((child) => child.name).join(" · ")}
                  </p>
                </DocsLink>
              ))}
            </div>
          </div>
        );
      })}
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
