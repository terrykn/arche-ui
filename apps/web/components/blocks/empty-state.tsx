/** GENERATED from the Arche identity (fixtures/identity.arche.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";

import * as React from "react";
import { PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  title: string;
  body?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

function EmptyState({ title, body, actionLabel, actionHref = "#new", className }: EmptyStateProps) {
  return (
    <section data-block="empty-state" className={cn("flex flex-col items-center gap-3 rounded-xl border border-dashed border-(length:--border-width) border-border px-6 py-16 text-center", className)}>
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <PackageOpen size={24} aria-hidden />
      </span>
      <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
      {body ? <p className="max-w-md text-sm text-muted-foreground">{body}</p> : null}
      {actionLabel ? (
        <Button asChild className="mt-2">
          <a href={actionHref}>{actionLabel}</a>
        </Button>
      ) : null}
    </section>
  );
}

export { EmptyState };
