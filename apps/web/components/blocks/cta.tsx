/** GENERATED from the Arche identity (fixtures/identity.arche.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ctaVariants = cva("mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-xl border border-(length:--border-width) border-border bg-card px-8 py-12", {
  variants: {
    alignment: {
      center: "items-center text-center",
      left: "items-start text-left",
    },
  },
  defaultVariants: { alignment: "center" },
});

export interface CtaProps extends VariantProps<typeof ctaVariants> {
  headline: string;
  body?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

function Cta({ headline, body = "Join 214 parcels an hour on line 2.", actionLabel = "Start packing", actionHref = "#get-started", alignment, className }: CtaProps) {
  return (
    <section data-block="cta" className="px-6 py-16">
      <div className={cn(ctaVariants({ alignment }), className)}>
        <h2 className="max-w-xl text-3xl font-extrabold tracking-tight text-card-foreground">{headline}</h2>
        <p className="max-w-xl text-muted-foreground">{body}</p>
        <Button size="lg" asChild>
          <a href={actionHref}>{actionLabel}</a>
        </Button>
      </div>
    </section>
  );
}

export { Cta, ctaVariants };
