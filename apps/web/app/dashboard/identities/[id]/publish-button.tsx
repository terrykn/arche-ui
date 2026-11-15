"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { publishAction } from "../actions";
import { Button } from "@/components/ui/button";

export function PublishButton({
  libraryId,
  onDone,
  variant,
}: {
  libraryId: string;
  /** When provided, the caller displays the result (toolbar use); otherwise shown inline. */
  onDone?: (result: { ok: boolean; version?: number; issues?: Array<{ path: string; message: string }> }) => void;
  variant?: "default" | "ghost" | "outline";
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [issues, setIssues] = React.useState<Array<{ path: string; message: string }> | null>(null);
  const [version, setVersion] = React.useState<number | null>(null);

  const publish = async () => {
    setPending(true);
    setIssues(null);
    const result = await publishAction(libraryId);
    setPending(false);
    if (onDone) {
      onDone(result.ok ? { ok: true, version: result.version ?? undefined } : { ok: false, issues: result.issues });
      return;
    }
    if (!result.ok) {
      setIssues(result.issues ?? [{ path: "publish", message: "publish failed" }]);
      return;
    }
    setVersion(result.version ?? null);
    router.refresh();
  };

  return (
    <div>
      <Button type="button" size="sm" variant={variant ?? "default"} onClick={publish} disabled={pending}>
        {pending ? "Publishing…" : "Publish"}
      </Button>
      {version !== null ? (
        <p className="mt-2 text-sm text-muted-foreground">Published v{version}.</p>
      ) : null}
      {issues ? (
        <ul className="mt-3 rounded-md border-(length:--border-width) border-destructive/40 bg-card p-3 text-sm">
          {issues.map((issue) => (
            <li key={issue.path} className="mt-1 first:mt-0">
              <code className="text-destructive">{issue.path}</code>: {issue.message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
