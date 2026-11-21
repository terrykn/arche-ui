/** GENERATED from the Default identity (fixtures/identity.default.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";
import * as React from "react";
import * as Primitive from "@radix-ui/react-tooltip";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const tooltipContentVariants = cva("z-50 w-fit bg-foreground px-3 py-1.5 text-xs text-background data-[state=delayed-open]:animate-in data-[state=closed]:animate-out", {
  variants: { radius: { sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" } },
  defaultVariants: {
      radius: "md",
    },
});
function TooltipProvider(props: React.ComponentProps<typeof Primitive.Provider>) { return <Primitive.Provider data-slot="tooltip-provider" {...props} />; }
function Tooltip(props: React.ComponentProps<typeof Primitive.Root>) { return <Primitive.Root data-slot="tooltip" {...props} />; }
function TooltipTrigger(props: React.ComponentProps<typeof Primitive.Trigger>) { return <Primitive.Trigger data-slot="tooltip-trigger" {...props} />; }
function TooltipPortal(props: React.ComponentProps<typeof Primitive.Portal>) { return <Primitive.Portal data-slot="tooltip-portal" {...props} />; }
function TooltipContent({ className, radius, container, ...props }: React.ComponentProps<typeof Primitive.Content> & VariantProps<typeof tooltipContentVariants> & { container?: HTMLElement | null }) { return <TooltipPortal container={container ?? undefined}><Primitive.Content data-slot="tooltip-content" className={cn(tooltipContentVariants({ radius }), className)} {...props} /></TooltipPortal>; }
function TooltipArrow({ className, ...props }: React.ComponentProps<typeof Primitive.Arrow>) { return <Primitive.Arrow data-slot="tooltip-arrow" className={cn("fill-foreground", className)} {...props} />; }
export { TooltipProvider, Tooltip, TooltipTrigger, TooltipPortal, TooltipContent, TooltipArrow, tooltipContentVariants };
