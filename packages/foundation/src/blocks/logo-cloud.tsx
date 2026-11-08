"use client";

import * as React from "react";
import { cn } from "../templates/lib/utils.js";
import { Separator } from "../templates/separator.js";

export interface LogoCloudProps {
  caption?: string;
  logos?: string[];
  className?: string;
}

const DEFAULT_LOGOS = ["Northwind Freight", "Contoso Goods", "Fabrikam Supply", "Adventure Cargo"];

function LogoCloud({ caption = "Powering packing lines at", logos = DEFAULT_LOGOS, className }: LogoCloudProps) {
  return (
    <section data-block="logo-cloud" aria-label={caption} className={cn("mx-auto w-full max-w-4xl py-12", className)}>
      <p className="text-center text-sm text-muted-foreground">{caption}</p>
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        {logos.map((logo, index) => (
          <React.Fragment key={logo}>
            {index > 0 ? <Separator orientation="vertical" className="hidden h-6 sm:block" aria-hidden /> : null}
            <li className="text-lg font-bold tracking-tight text-muted-foreground">{logo}</li>
          </React.Fragment>
        ))}
      </ul>
    </section>
  );
}

export { LogoCloud };
