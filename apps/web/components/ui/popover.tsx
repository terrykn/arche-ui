/** GENERATED from the Arche identity (fixtures/identity.arche.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";
import * as React from "react";
import * as Primitive from "@radix-ui/react-popover";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const popoverContentVariants = cva("z-50 w-72 border-(length:--border-width) bg-popover p-4 text-sm text-popover-foreground outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0", {
  variants: { radius: { sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" }, shadow: { none: "shadow-none", sm: "shadow-(--shadow-sm)", md: "shadow-(--shadow-md)", lg: "shadow-(--shadow-lg)", xl: "shadow-(--shadow-xl)" } },
  defaultVariants: {
      radius: "lg",
      shadow: "md",
    },
});
function Popover(props: React.ComponentProps<typeof Primitive.Root>) { return <Primitive.Root data-slot="popover" {...props} />; }
function PopoverTrigger(props: React.ComponentProps<typeof Primitive.Trigger>) { return <Primitive.Trigger data-slot="popover-trigger" {...props} />; }
function PopoverAnchor(props: React.ComponentProps<typeof Primitive.Anchor>) { return <Primitive.Anchor data-slot="popover-anchor" {...props} />; }
function PopoverPortal(props: React.ComponentProps<typeof Primitive.Portal>) { return <Primitive.Portal data-slot="popover-portal" {...props} />; }
function PopoverContent({ className, radius, shadow, container, ...props }: React.ComponentProps<typeof Primitive.Content> & VariantProps<typeof popoverContentVariants> & { container?: HTMLElement | null }) { return <PopoverPortal container={container ?? undefined}><Primitive.Content data-slot="popover-content" className={cn(popoverContentVariants({ radius, shadow }), className)} {...props} /></PopoverPortal>; }
function PopoverClose(props: React.ComponentProps<typeof Primitive.Close>) { return <Primitive.Close data-slot="popover-close" {...props} />; }
function PopoverArrow({ className, ...props }: React.ComponentProps<typeof Primitive.Arrow>) { return <Primitive.Arrow data-slot="popover-arrow" className={cn("fill-popover", className)} {...props} />; }
export { Popover, PopoverTrigger, PopoverAnchor, PopoverPortal, PopoverContent, PopoverClose, PopoverArrow, popoverContentVariants };
