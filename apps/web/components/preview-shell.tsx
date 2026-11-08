"use client";

import * as React from "react";
import Link from "next/link";
import { SINK_EXAMPLES } from "@/components/sink-examples";
import { BlockPreview } from "@/components/block-preview";
import { Copy, Pencil, X } from "lucide-react";

export interface PreviewIdentity {
  id: string;
  label: string;
}

interface RemixEdit {
  setToken: { token: string; mode: "light" | "dark"; value: string };
}

/**
 * Preview shell (Part 7): live catalog preview under a fixture identity with
 * a floating edit/swap bar and an in-preview remix drawer. Overrides are
 * diff-scoped token edits ({ setToken } entries, the same shape
 * ApplyIdentityEdit accepts) layered over the fixture vars — never mutations
 * of the identity itself.
 */
export function PreviewShell({
  name,
  isBlock,
  vars,
  mode,
  identity,
  identities,
}: {
  name: string;
  isBlock: boolean;
  vars: Record<string, string>;
  mode: "light" | "dark";
  identity: string;
  identities: PreviewIdentity[];
}) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [overrides, setOverrides] = React.useState<Record<string, string>>({});
  const [tokenName, setTokenName] = React.useState("");
  const [tokenValue, setTokenValue] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const merged = React.useMemo(() => ({ ...vars, ...overrides }), [vars, overrides]);
  const edits: RemixEdit[] = React.useMemo(
    () =>
      Object.entries(overrides).map(([token, value]) => ({
        setToken: { token, mode, value },
      })),
    [overrides, mode],
  );

  const preview = isBlock ? <BlockPreview name={name} /> : (SINK_EXAMPLES[name] ?? (
    <p className="text-sm text-muted-foreground">No live example for “{name}” yet.</p>
  ));

  async function copyDiff() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(edits, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <div className={mode === "dark" ? "dark" : ""}>
        <div style={merged as React.CSSProperties} className="rounded-xl border border-border bg-background px-5 py-6 text-foreground">
          {preview}
        </div>
      </div>

      {/* Floating edit/swap bar */}
      <div className="fixed bottom-4 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-2 shadow-lg backdrop-blur">
        <span className="flex items-center gap-1 text-xs" role="group" aria-label="Swap identity">
          {identities.map((item) => (
            <Link
              key={item.id}
              href={`/preview/${name}?identity=${item.id}&mode=${mode}`}
              aria-current={item.id === identity ? "true" : undefined}
              className={`rounded-full px-2 py-1 ${item.id === identity ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground underline"}`}
            >
              {item.label}
            </Link>
          ))}
        </span>
        <span className="text-xs" role="group" aria-label="Swap mode">
          <Link
            href={`/preview/${name}?identity=${identity}&mode=light`}
            className={`rounded-full px-2 py-1 ${mode === "light" ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground underline"}`}
          >
            Light
          </Link>
          <Link
            href={`/preview/${name}?identity=${identity}&mode=dark`}
            className={`rounded-full px-2 py-1 ${mode === "dark" ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground underline"}`}
          >
            Dark
          </Link>
        </span>
        <button
          type="button"
          onClick={() => setDrawerOpen((o) => !o)}
          aria-expanded={drawerOpen}
          className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
        >
          {drawerOpen ? <X size={13} aria-hidden="true" /> : <Pencil size={13} aria-hidden="true" />}
          {drawerOpen ? "Close" : "Edit"}
          {edits.length > 0 ? ` (${edits.length})` : ""}
        </button>
      </div>

      {/* In-preview remix drawer */}
      {drawerOpen ? (
        <aside aria-label="Remix editor" className="fixed inset-x-0 bottom-0 z-30 mx-auto mb-16 max-h-[50vh] w-full max-w-2xl overflow-auto rounded-t-2xl border border-border bg-card p-5 shadow-xl">
          <h2 className="font-medium">Remix — {name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Token overrides layer over the fixture identity as diff-scoped edits. Swapping identity or mode resets
            them; the identity itself is never mutated.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-xs">
              Token (e.g. --primary)
              <input
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                list="preview-token-names"
                placeholder="--primary"
                className="rounded-md border border-input bg-background px-2 py-1 font-mono"
              />
              <datalist id="preview-token-names">
                {Object.keys(vars).map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Value (applies to {mode} mode)
              <input
                value={tokenValue}
                onChange={(e) => setTokenValue(e.target.value)}
                placeholder={tokenName && vars[tokenName] ? vars[tokenName] : "oklch(0.55 0.18 250)"}
                className="rounded-md border border-input bg-background px-2 py-1 font-mono"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!tokenName.trim() || !tokenValue.trim()}
                onClick={() => {
                  setOverrides((o) => ({ ...o, [tokenName.trim()]: tokenValue.trim() }));
                  setTokenName("");
                  setTokenValue("");
                }}
                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
              >
                Apply override
              </button>
              {edits.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setOverrides({})}
                  className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground"
                >
                  Reset all
                </button>
              ) : null}
            </div>
          </div>
          <h3 className="mt-4 text-xs font-medium">Remix diff ({edits.length})</h3>
          {edits.length === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">No overrides yet — the preview shows the fixture identity untouched.</p>
          ) : (
            <>
              <pre className="mt-1 max-h-40 overflow-auto rounded-md border border-border bg-background p-2 font-mono text-[11px]">
                {JSON.stringify(edits, null, 2)}
              </pre>
              <button
                type="button"
                onClick={copyDiff}
                className="mt-2 flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs"
              >
                <Copy size={12} aria-hidden="true" /> {copied ? "Copied" : "Copy diff JSON"}
              </button>
            </>
          )}
        </aside>
      ) : null}
    </>
  );
}
