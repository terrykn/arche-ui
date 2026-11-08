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
        <h2 className="font-medium">Amendments</h2>
        <ul className="mt-1 text-sm text-muted-foreground">
          <li>
            <strong>2026-11-08 — border width becomes a token.</strong> <code>--border-width</code> added
            to the contract (append-only; legal values <code>0px 1px 2px 3px</code>, mode-independent).
            Component templates now use <code>border-(length:--border-width)</code> instead of a hardcoded
            1px; the token-only lint&apos;s 1px border-width exception is removed. Generated payloads are
            bounded per profile by design rule <code>border-width-profile-bounds</code> (enterprise ≤ 1px,
            standard ≤ 2px, expressive ≤ 3px); hand-authored payloads may use any legal value.
          </li>
        </ul>
      </section>
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
