"use client";

import * as React from "react";
import { issueTokenAction, revokeTokenAction } from "../identities/actions";

export function TokenManager({ hasToken, prefix }: { hasToken: boolean; prefix: string | null }) {
  const [raw, setRaw] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const issue = async () => {
    setPending(true);
    setError(null);
    const result = await issueTokenAction();
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setRaw(result.raw);
  };

  return (
    <div className="mt-2">
      {hasToken ? (
        <p className="text-sm text-muted-foreground">
          Active token <code>{prefix}…</code> — the raw value was shown once at issuance.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">No registry token issued.</p>
      )}
      {raw ? (
        <pre className="mt-2 overflow-x-auto rounded-md border-(length:--border-width) border-border bg-card p-3 text-xs">
          {raw}
        </pre>
      ) : null}
      {raw ? (
        <p className="mt-1 text-sm text-destructive">
          Copy it now — it will never be shown again. Issuing a new token replaces this one.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-1 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={issue}
          disabled={pending}
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
        >
          {hasToken ? "Issue new token" : "Issue registry token"}
        </button>
        {hasToken ? (
          <form action={revokeTokenAction}>
            <button type="submit" className="rounded-md border-(length:--border-width) border-border px-3 py-1.5 text-sm">
              Revoke
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
