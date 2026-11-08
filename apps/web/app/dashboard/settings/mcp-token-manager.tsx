"use client";

import * as React from "react";
import { createMcpTokenAction, revokeMcpTokenAction } from "./mcp-actions";

export interface McpTokenListItem {
  id: string;
  label: string;
  created_at: string;
  last_used_at: string | null;
}

export function McpTokenManager({ tokens }: { tokens: McpTokenListItem[] }) {
  const [raw, setRaw] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const create = async (formData: FormData) => {
    setPending(true);
    setError(null);
    const result = await createMcpTokenAction(formData);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setRaw(result.raw);
  };

  return (
    <div className="mt-2">
      <p className="text-sm text-muted-foreground">
        MCP tokens let agents read your libraries and publish through the hosted MCP server. Stored
        hashed; each raw value is shown once.
      </p>
      {tokens.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No MCP tokens yet.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {tokens.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 rounded-md border-(length:--border-width) border-border p-3 text-sm">
              <span>
                <code>{t.label}</code>
                <span className="ml-2 text-muted-foreground">
                  created {new Date(t.created_at).toLocaleString()}
                  {t.last_used_at ? ` · last used ${new Date(t.last_used_at).toLocaleString()}` : " · never used"}
                </span>
              </span>
              <form action={revokeMcpTokenAction}>
                <input type="hidden" name="id" value={t.id} />
                <button type="submit" className="rounded-md border-(length:--border-width) border-border px-3 py-1.5 text-sm">
                  Revoke
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      {raw ? (
        <pre className="mt-2 overflow-x-auto rounded-md border-(length:--border-width) border-border bg-card p-3 text-xs">{raw}</pre>
      ) : null}
      {raw ? (
        <p className="mt-1 text-sm text-destructive">Copy it now — it will never be shown again.</p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-1 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <form action={create} className="mt-2 flex gap-2">
        <input
          name="label"
          placeholder="Token label (e.g. claude-code)"
          maxLength={60}
          className="rounded-md border-(length:--border-width) border-input bg-background px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
        >
          Issue MCP token
        </button>
      </form>
      <p className="mt-2 text-sm text-muted-foreground">
        Setup guides: <a className="underline" href="/docs/mcp">MCP docs</a> · endpoint{" "}
        <code>/api/mcp</code>
      </p>
    </div>
  );
}
