"use client";

import * as React from "react";
import { createMcpTokenAction, revokeMcpTokenAction } from "./mcp-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      {tokens.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No MCP tokens yet.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {tokens.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 rounded-md border-(length:--border-width) border-border p-3 text-sm">
              <span>
                Active token <code>{t.label}</code>
                <span className="ml-2 text-muted-foreground">
                  created {new Date(t.created_at).toLocaleString()}
                  {t.last_used_at ? ` · last used ${new Date(t.last_used_at).toLocaleString()}` : " · never used"}
                </span>
              </span>
              <form action={revokeMcpTokenAction}>
                <input type="hidden" name="id" value={t.id} />
                <Button type="submit" variant="outline" size="sm">
                  Revoke
                </Button>
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
        <Input name="label" placeholder="Token label (e.g. claude-code)" maxLength={60} />
        <Button type="submit" size="sm" disabled={pending}>
          Issue MCP token
        </Button>
      </form>
    </div>
  );
}
