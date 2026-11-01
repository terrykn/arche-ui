"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { publishAction } from "../actions";

export function PublishButton({ libraryId }: { libraryId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [issues, setIssues] = React.useState<Array<{ path: string; message: string }> | null>(null);
  const [version, setVersion] = React.useState<number | null>(null);

  const publish = async () => {
    setPending(true);
    setIssues(null);
    const result = await publishAction(libraryId);
    setPending(false);
    if (!result.ok) {
      setIssues(result.issues ?? [{ path: "publish", message: "publish failed" }]);
      return;
    }
    setVersion(result.version ?? null);
    router.refresh();
  };

  return (
    <div>
      <button
        type="button"
        onClick={publish}
        disabled={pending}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Publishing…" : "Publish"}
      </button>
      {version !== null ? (
        <p className="mt-2 text-sm text-muted-foreground">Published v{version}.</p>
      ) : null}
      {issues ? (
        <ul className="mt-3 rounded-md border border-destructive/40 bg-card p-3 text-sm">
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
