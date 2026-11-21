/** GENERATED from the Default identity (fixtures/identity.default.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const logoCloudVariants = cva("", {
  variants: {
    layout: {
      row: "mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4",
      grid: "mt-6 grid grid-cols-2 items-center justify-items-center gap-x-8 gap-y-6 sm:grid-cols-4",
    },
  },
  defaultVariants: { layout: "row" },
});

export interface LogoCloudProps extends VariantProps<typeof logoCloudVariants> {
  caption?: string;
  logos?: string[];
  className?: string;
}

const DEFAULT_LOGOS = ["Northwind Freight", "Contoso Goods", "Fabrikam Supply", "Adventure Cargo"];

function LogoCloud({ caption = "Powering packing lines at", logos = DEFAULT_LOGOS, layout, className }: LogoCloudProps) {
  return (
    <section data-block="logo-cloud" aria-label={caption} className={cn("mx-auto w-full max-w-4xl py-12", className)}>
      <p className="text-center text-sm text-muted-foreground">{caption}</p>
      <ul className={cn(logoCloudVariants({ layout }))}>
        {logos.map((logo, index) => (
          <React.Fragment key={logo}>
            {layout !== "grid" && index > 0 ? <Separator orientation="vertical" className="hidden h-6 sm:block" aria-hidden /> : null}
            <li className="text-lg font-bold tracking-tight text-muted-foreground">{logo}</li>
          </React.Fragment>
        ))}
      </ul>
    </section>
  );
}

export { LogoCloud, logoCloudVariants };
