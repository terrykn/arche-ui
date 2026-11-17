/** GENERATED from the Arche identity (fixtures/identity.arche.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const pricingVariants = cva("mt-8 grid gap-4", {
  variants: {
    tierCount: {
      two: "mx-auto max-w-3xl md:grid-cols-2",
      three: "md:grid-cols-3",
      four: "md:grid-cols-2 lg:grid-cols-4",
    },
  },
  defaultVariants: { tierCount: "three" },
});

export interface PricingTier {
  name: string;
  price: string;
  blurb: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

export interface PricingProps extends VariantProps<typeof pricingVariants> {
  headline?: string;
  tiers?: PricingTier[];
  className?: string;
}

const DEFAULT_TIERS: PricingTier[] = [
  { name: "Dock", price: "$49", blurb: "One line, one shift.", features: ["Board + labels", "1 carrier pickup", "Email support"], cta: "Start on Dock" },
  { name: "Warehouse", price: "$149", blurb: "Two lines, all shifts.", features: ["Everything in Dock", "2 carrier pickups", "Capacity planning", "Priority support"], cta: "Start on Warehouse", highlighted: true },
  { name: "Network", price: "Custom", blurb: "Every dock, every lane.", features: ["Everything in Warehouse", "Multi-site boards", "Dedicated line engineer"], cta: "Talk to us" },
];

function Pricing({ headline = "Pricing that fits the floor", tiers = DEFAULT_TIERS, tierCount, className }: PricingProps) {
  const shown = tiers.slice(0, 4);
  return (
    <section data-block="pricing" className={cn("mx-auto w-full max-w-6xl py-16", className)}>
      <h2 className="text-center text-3xl font-extrabold tracking-tight text-foreground">{headline}</h2>
      <div className={cn(pricingVariants({ tierCount }))}>
        {/* Brand Token brief: the featured tier is the pricing brand moment —
            brand border + brand badge + brand CTA. Only one tier per block
            may be featured (pricing-one-highlight). */}
        {shown.map((tier) => (
          <Card key={tier.name} className={tier.highlighted ? "border-brand" : undefined}>
            <CardHeader>
              <span className="flex items-center gap-2">
                <CardTitle>{tier.name}</CardTitle>
                {tier.highlighted ? <Badge variant="brand">Recommended</Badge> : null}
              </span>
              <p className="mt-2 text-4xl font-extrabold tracking-tight text-foreground">{tier.price}</p>
              <CardDescription>{tier.blurb}</CardDescription>
            </CardHeader>
            <CardContent>
              <Separator className="mb-4" />
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                {tier.features.map((feature) => (
                  <li key={feature}>· {feature}</li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant={tier.highlighted ? "brand" : "secondary"} className="w-full" asChild>
                <a href="#get-started">{tier.cta}</a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}

export { Pricing, pricingVariants };
