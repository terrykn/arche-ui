"use client";

import * as React from "react";
import { Package, Route, ShieldCheck, Timer, type LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../templates/lib/utils.js";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../templates/card.js";
import { Badge } from "../templates/badge.js";

const featuresVariants = cva("mt-8 grid gap-4", {
  variants: {
    layout: {
      grid: "md:grid-cols-3",
      split: "lg:grid-cols-[0.9fr_1.1fr]",
      bento: "md:grid-cols-3 [&>*:first-child]:md:col-span-2",
    },
  },
  defaultVariants: { layout: "grid" },
});

export interface FeatureItem {
  title: string;
  body: string;
  icon?: "package" | "route" | "shield" | "timer";
}

export interface FeaturesProps extends VariantProps<typeof featuresVariants> {
  eyebrow?: string;
  headline?: string;
  items?: FeatureItem[];
  className?: string;
}

const ICONS: Record<NonNullable<FeatureItem["icon"]>, LucideIcon> = {
  package: Package,
  route: Route,
  shield: ShieldCheck,
  timer: Timer,
};

const DEFAULT_ITEMS: FeatureItem[] = [
  { title: "Pack 214 parcels an hour", body: "Line 2 runs the relabeled flow: scan, pack, seal, done.", icon: "package" },
  { title: "Same-day carrier cutoff", body: "14:00 and 17:30 pickups, booked from the board.", icon: "timer" },
  { title: "Zero mislabels", body: "Slip prints after the scan matches — never before.", icon: "shield" },
  { title: "Reno to Oakland, tracked", body: "Every parcel carries its lane from dock to door.", icon: "route" },
];

function Features({ eyebrow = "Capabilities", headline = "Everything a packing line needs", items = DEFAULT_ITEMS, layout, className }: FeaturesProps) {
  return (
    <section data-block="features" className={cn("mx-auto w-full max-w-6xl py-16", className)}>
      <Badge variant="secondary">{eyebrow}</Badge>
      <h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-foreground">{headline}</h2>
      <div className={cn(featuresVariants({ layout }))}>
        {items.map((item) => {
          const Icon = item.icon ? ICONS[item.icon] : Package;
          return (
            <Card key={item.title}>
              <CardHeader>
                <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Icon size={20} aria-hidden />
                </span>
                <CardTitle className="mt-3">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{item.body}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export { Features, featuresVariants };
