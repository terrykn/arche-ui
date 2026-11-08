"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../templates/lib/utils.js";
import { Badge } from "../templates/badge.js";
import { Button } from "../templates/button.js";

const heroVariants = cva("mx-auto flex w-full max-w-4xl flex-col gap-6 py-16", {
  variants: {
    alignment: {
      center: "items-center text-center",
      left: "items-start text-left",
    },
    mediaLayout: {
      none: "",
      right: "lg:grid lg:grid-cols-2 lg:items-center lg:gap-12",
      below: "",
    },
  },
  defaultVariants: { alignment: "center", mediaLayout: "none" },
});

export interface HeroAction {
  label: string;
  href: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
}

export interface HeroProps extends VariantProps<typeof heroVariants> {
  eyebrow?: string;
  headline: string;
  subhead?: string;
  actions?: HeroAction[];
  media?: React.ReactNode;
  className?: string;
}

function Hero({ eyebrow = "Acme packing, orchestrated", headline, subhead, actions = [], media, alignment, mediaLayout, className }: HeroProps) {
  const shown = actions.slice(0, 2);
  const primaryCount = shown.filter((action) => (action.variant ?? "default") === "default").length;
  const resolved =
    primaryCount > 1
      ? shown.map((action, index) =>
          index === 0 ? action : { ...action, variant: "secondary" as const },
        )
      : shown;
  return (
    <section data-block="hero" className={cn(heroVariants({ alignment, mediaLayout }), className)}>
      <div className="flex flex-col gap-5">
        {eyebrow ? <Badge variant="secondary">{eyebrow}</Badge> : null}
        <h1 className="text-5xl font-extrabold leading-[1.04] tracking-tight text-foreground">{headline}</h1>
        {subhead ? <p className="max-w-xl text-lg text-muted-foreground">{subhead}</p> : null}
        {resolved.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {resolved.map((action) => (
              <Button key={action.label} variant={action.variant ?? "default"} size="lg" asChild>
                <a href={action.href}>{action.label}</a>
              </Button>
            ))}
          </div>
        ) : null}
      </div>
      {mediaLayout !== "none" && media ? <div className="min-w-0">{media}</div> : null}
    </section>
  );
}

export { Hero, heroVariants };
