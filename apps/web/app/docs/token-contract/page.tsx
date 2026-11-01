import { getTokenContract } from "@arche/registry-core";

export default function TokenContractPage() {
  const contract = getTokenContract() as {
    contractVersion: number;
    colorSpace: string;
    modes: string[];
    tokens: Array<{ name: string; $type: string; group: string }>;
    contrastPairs: Array<{ fg: string; bg: string; minRatio: number }>;
  };
  const byGroup = new Map<string, Array<{ name: string; $type: string }>>();
  for (const token of contract.tokens) {
    const list = byGroup.get(token.group) ?? [];
    list.push(token);
    byGroup.set(token.group, list);
  }
  return (
    <div>
      <h1 className="font-display text-3xl">Token contract v{contract.contractVersion}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {contract.colorSpace} · modes: {contract.modes.join(", ")} · every token required in both modes.
        Generated from the contract data — no hand-written list.
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
    </div>
  );
}
