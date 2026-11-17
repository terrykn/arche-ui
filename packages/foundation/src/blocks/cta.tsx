"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../templates/lib/utils.js";
import { Button } from "../templates/button.js";

const ctaVariants = cva("mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-xl border border-(length:--border-width) border-border bg-card px-8 py-12", {
  variants: {
    alignment: {
      center: "items-center text-center",
      left: "items-start text-left",
    },
    // Brand Token brief: the loudest brand moment on a page — a full
    // --brand section with --brand-foreground text (an AA-gated contract
    // pair). At most one per page (cta-one-brand-section).
    variant: {
      default: "",
      brand: "border-transparent bg-brand text-brand-foreground",
    },
  },
  defaultVariants: { alignment: "center", variant: "default" },
});

export interface CtaProps extends VariantProps<typeof ctaVariants> {
  headline: string;
  body?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

function Cta({ headline, body = "Join 214 parcels an hour on line 2.", actionLabel = "Start packing", actionHref = "#get-started", alignment, variant = "default", className }: CtaProps) {
  const brand = variant === "brand";
  return (
    <section data-block="cta" className="px-6 py-16">
      <div className={cn(ctaVariants({ alignment, variant }), className)}>
        <h2 className={cn("max-w-xl text-3xl font-extrabold tracking-tight", brand ? "text-brand-foreground" : "text-card-foreground")}>{headline}</h2>
        <p className={cn("max-w-xl", brand ? "text-brand-foreground/80" : "text-muted-foreground")}>{body}</p>
        {brand ? (
          <Button size="lg" className="bg-brand-foreground text-brand hover:bg-brand-foreground/90" asChild>
            <a href={actionHref}>{actionLabel}</a>
          </Button>
        ) : (
          <Button size="lg" asChild>
            <a href={actionHref}>{actionLabel}</a>
          </Button>
        )}
      </div>
    </section>
  );
}

export { Cta, ctaVariants };
