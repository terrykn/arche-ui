/** GENERATED from the Arche identity (fixtures/identity.arche.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("flex flex-col gap-6 border-(length:--border-width) bg-card py-6 text-card-foreground", {
  // Brand Token brief: the featured/highlight card — a --brand top-edge
  // accent and a brand-tinted border on the default card surface. The
  // body never becomes a brand solid: text stays normal foreground.
  variants: { variant: { default: "", brand: "border-brand/40 border-t-4 border-t-brand" }, radius: { sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" }, shadow: { none: "shadow-none", sm: "shadow-(--shadow-sm)", md: "shadow-(--shadow-md)", lg: "shadow-(--shadow-lg)", xl: "shadow-(--shadow-xl)" } },
  defaultVariants: {
      variant: "default",
      radius: "xl",
      shadow: "sm",
    },
});
function Card({ className, variant, radius, shadow, ...props }: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) { return <div data-slot="card" className={cn(cardVariants({ variant, radius, shadow }), className)} {...props} />; }
function CardHeader({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="card-header" className={cn("grid gap-2 px-6", className)} {...props} />; }
function CardTitle({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="card-title" className={cn("font-semibold leading-none", className)} {...props} />; }
function CardDescription({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="card-description" className={cn("text-sm text-muted-foreground", className)} {...props} />; }
function CardAction({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="card-action" className={cn("col-start-2 row-span-2 row-start-1", className)} {...props} />; }
function CardContent({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="card-content" className={cn("px-6", className)} {...props} />; }
function CardFooter({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="card-footer" className={cn("flex items-center px-6", className)} {...props} />; }
export { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter, cardVariants };
