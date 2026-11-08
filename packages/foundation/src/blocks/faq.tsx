"use client";

import * as React from "react";
import { cn } from "../templates/lib/utils.js";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../templates/accordion.js";

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqProps {
  headline?: string;
  items?: FaqItem[];
  className?: string;
}

const DEFAULT_ITEMS: FaqItem[] = [
  { q: "When is the carrier cutoff?", a: "Pickups run at 14:00 and 17:30 daily. Parcels sealed by the cutoff ship the same day." },
  { q: "What happens on a scan mismatch?", a: "The slip never prints. The order stays on the board in QA hold until a lead clears it." },
  { q: "Can a second warehouse join later?", a: "Yes — boards are per-site, and the Network tier rolls them into one capacity view." },
  { q: "Do you integrate with our carriers?", a: "Northwind Freight and Adventure Cargo are built in; Contoso Goods connects over the standard lane API." },
];

function Faq({ headline = "Questions from the floor", items = DEFAULT_ITEMS, className }: FaqProps) {
  return (
    <section data-block="faq" className={cn("mx-auto w-full max-w-3xl py-16", className)}>
      <h2 className="text-3xl font-extrabold tracking-tight text-foreground">{headline}</h2>
      <Accordion type="single" collapsible className="mt-6">
        {items.map((item, index) => (
          <AccordionItem key={item.q} value={`item-${index}`}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent>{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

export { Faq };
