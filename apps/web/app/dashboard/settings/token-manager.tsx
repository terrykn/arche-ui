"use client";

import * as React from "react";
import { issueTokenAction, revokeTokenAction } from "../identities/actions";
import { Button } from "@/components/ui/button";

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
        <Button type="button" size="sm" onClick={issue} disabled={pending}>
          {hasToken ? "Issue new token" : "Issue registry token"}
        </Button>
        {hasToken ? (
          <form action={revokeTokenAction}>
            <Button type="submit" variant="outline" size="sm">
              Revoke
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
