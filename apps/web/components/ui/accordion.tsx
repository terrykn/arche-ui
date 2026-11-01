/** GENERATED from the Arche identity (fixtures/identity.arche.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const accordionItemVariants = cva("border-b", {
  variants: {
    spacing: { sm: "py-1", default: "py-2", lg: "py-4" },
  },
  defaultVariants: {
      spacing: "default",
    },
});

function Accordion({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" className={cn("flex w-full flex-col", className)} {...props} />;
}
function AccordionItem({ className, spacing, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item> & VariantProps<typeof accordionItemVariants>) {
  return <AccordionPrimitive.Item data-slot="accordion-item" className={cn(accordionItemVariants({ spacing }), className)} {...props} />;
}
function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return <AccordionPrimitive.Header data-slot="accordion-header" className="flex"><AccordionPrimitive.Trigger data-slot="accordion-trigger" className={cn("flex flex-1 items-center justify-between rounded-md text-left font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180", className)} {...props}>{children}<ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform" aria-hidden="true" /></AccordionPrimitive.Trigger></AccordionPrimitive.Header>;
}
function AccordionContent({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return <AccordionPrimitive.Content data-slot="accordion-content" className={cn("overflow-hidden text-sm data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up", className)} {...props} />;
}
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent, accordionItemVariants };
