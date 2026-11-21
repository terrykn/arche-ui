/** GENERATED from the Default identity (fixtures/identity.default.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const statsRowVariants = cva("grid gap-4", {
  variants: {
    columns: {
      two: "md:grid-cols-2",
      three: "md:grid-cols-3",
      four: "md:grid-cols-2 lg:grid-cols-4",
    },
  },
  defaultVariants: { columns: "four" },
});

export interface StatsRowStat {
  label: string;
  value: string;
  hint?: string;
}

export interface StatsRowProps extends VariantProps<typeof statsRowVariants> {
  stats?: StatsRowStat[];
  className?: string;
}

const DEFAULT_STATS: StatsRowStat[] = [
  { label: "Open", value: "14", hint: "3 ship today" },
  { label: "Packed", value: "198", hint: "+22 today" },
  { label: "QA hold", value: "2", hint: "clears by noon" },
  { label: "Shipped", value: "1,204", hint: "this week" },
];

function StatsRow({ stats = DEFAULT_STATS, columns, className }: StatsRowProps) {
  return (
    <section data-block="stats-row" aria-label="Key numbers" className={cn(statsRowVariants({ columns }), className)}>
      {stats.slice(0, 4).map((stat) => (
        <Card key={stat.label}>
          <CardHeader>
            <CardTitle>{stat.label}</CardTitle>
            {stat.hint ? <CardDescription>{stat.hint}</CardDescription> : null}
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold tracking-tight">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

export { StatsRow, statsRowVariants };
