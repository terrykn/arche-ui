/** GENERATED from the Arche identity (fixtures/identity.arche.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export interface StatBandItem {
  value: string;
  label: string;
}

const statsBandVariants = cva("", {
  variants: {
    columns: {
      two: "mx-auto grid w-full max-w-4xl grid-cols-1 gap-y-8 px-6 py-10 sm:grid-cols-2",
      four: "mx-auto grid w-full max-w-6xl grid-cols-2 gap-y-8 px-6 py-10 md:grid-cols-4",
    },
  },
  defaultVariants: { columns: "four" },
});

export interface StatsBandProps extends VariantProps<typeof statsBandVariants> {
  stats?: StatBandItem[];
  className?: string;
}

const DEFAULT_STATS: StatBandItem[] = [
  { value: "214/hr", label: "Parcels packed, line 2" },
  { value: "99.98%", label: "Label accuracy this quarter" },
  { value: "2", label: "Daily carrier pickups" },
  { value: "0", label: "Missed cutoffs in October" },
];

function StatsBand({ stats = DEFAULT_STATS, columns, className }: StatsBandProps) {
  return (
    <section data-block="stats-band" aria-label="Key numbers" className={cn("border-y border-(length:--border-width) border-border", className)}>
      <dl className={cn(statsBandVariants({ columns }))}>
        {stats.map((stat, index) => (
          <div key={stat.label} className="flex gap-8">
            {index > 0 ? <Separator orientation="vertical" className="hidden h-auto md:block" aria-hidden /> : null}
            <div>
              <dt className="order-2 mt-1 text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="order-1 text-4xl font-extrabold tracking-tight text-foreground">{stat.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}

export { StatsBand, statsBandVariants };
