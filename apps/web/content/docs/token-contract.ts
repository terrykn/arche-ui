import { getTokenContract } from "@arche/registry-core";
import type { DocsPageData } from "@/lib/docs-content";

const contract = getTokenContract() as { contractVersion: number };

export const tokenContract: DocsPageData = {
  slug: "/token-contract",
  title: `Token contract v${contract.contractVersion}`,
  blocks: [
    { kind: "component", name: "TokenContractTables" },
    { kind: "markdown", body: "## Amendments" },
    {
      kind: "markdown",
      body: "**2026-11-08 — border width becomes a token.** `--border-width` added to the contract (append-only; legal values `0px 1px 2px 3px`, mode-independent). Component templates now use `border-(length:--border-width)` instead of a hardcoded 1px; the token-only lint's 1px border-width exception is removed. Generated payloads are bounded per profile by design rule `border-width-profile-bounds` (enterprise ≤ 1px, standard ≤ 2px, expressive ≤ 3px); hand-authored payloads may use any legal value.",
    },
  ],
};
