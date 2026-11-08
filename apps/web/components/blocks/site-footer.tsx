/** GENERATED from the Arche identity (fixtures/identity.arche.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export interface FooterColumn {
  heading: string;
  links: Array<{ label: string; href: string }>;
}

export interface SiteFooterProps {
  columns?: FooterColumn[];
  note?: string;
  className?: string;
}

const DEFAULT_COLUMNS: FooterColumn[] = [
  { heading: "Product", links: [{ label: "Boards", href: "#boards" }, { label: "Capacity", href: "#capacity" }, { label: "Pricing", href: "#pricing" }] },
  { heading: "Resources", links: [{ label: "Docs", href: "#docs" }, { label: "Changelog", href: "#changelog" }, { label: "Status", href: "#status" }] },
  { heading: "Company", links: [{ label: "About", href: "#about" }, { label: "Careers", href: "#careers" }, { label: "Contact", href: "#contact" }] },
  { heading: "Legal", links: [{ label: "Privacy", href: "#privacy" }, { label: "Terms", href: "#terms" }, { label: "Accessibility", href: "#accessibility" }] },
];

function SiteFooter({ columns = DEFAULT_COLUMNS, note = "© Acme Inc. — packed with care in Oakland and Reno.", className }: SiteFooterProps) {
  return (
    <footer data-block="site-footer" className={cn("border-t border-(length:--border-width) border-border", className)}>
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h2 className="text-sm font-semibold text-foreground">{column.heading}</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <Separator />
      <p className="mx-auto w-full max-w-6xl px-6 py-6 text-sm text-muted-foreground">{note}</p>
    </footer>
  );
}

export { SiteFooter };
