"use client";
import * as React from "react";
import * as Primitive from "@radix-ui/react-hover-card";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/utils.js";
const hoverCardContentVariants = cva("z-50 w-64 border bg-popover p-4 text-sm text-popover-foreground outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0", {
  variants: { radius: { sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" }, shadow: { none: "shadow-none", sm: "shadow-(--shadow-sm)", md: "shadow-(--shadow-md)", lg: "shadow-(--shadow-lg)", xl: "shadow-(--shadow-xl)" } },
  defaultVariants: { radius: "lg", shadow: "md" },
});
function HoverCard(props: React.ComponentProps<typeof Primitive.Root>) { return <Primitive.Root data-slot="hover-card" {...props} />; }
function HoverCardTrigger(props: React.ComponentProps<typeof Primitive.Trigger>) { return <Primitive.Trigger data-slot="hover-card-trigger" {...props} />; }
function HoverCardPortal(props: React.ComponentProps<typeof Primitive.Portal>) { return <Primitive.Portal data-slot="hover-card-portal" {...props} />; }
function HoverCardContent({ className, radius, shadow, ...props }: React.ComponentProps<typeof Primitive.Content> & VariantProps<typeof hoverCardContentVariants>) { return <HoverCardPortal><Primitive.Content data-slot="hover-card-content" className={cn(hoverCardContentVariants({ radius, shadow }), className)} {...props} /></HoverCardPortal>; }
function HoverCardArrow({ className, ...props }: React.ComponentProps<typeof Primitive.Arrow>) { return <Primitive.Arrow data-slot="hover-card-arrow" className={cn("fill-popover", className)} {...props} />; }
export { HoverCard, HoverCardTrigger, HoverCardPortal, HoverCardContent, HoverCardArrow, hoverCardContentVariants };
