/** GENERATED from the Arche identity (fixtures/identity.arche.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex w-fit items-center gap-1 rounded-md border-(length:--border-width) px-2 py-0.5 text-xs font-medium", {
  // Brand Token brief: the loud brand badge — solid --brand with
  // --brand-foreground text (an AA-gated contract pair) for sale, "new",
  // and highlight moments.
  variants: { variant: { default: "border-transparent bg-primary text-primary-foreground", secondary: "border-transparent bg-secondary text-secondary-foreground", destructive: "border-transparent bg-destructive text-destructive-foreground", outline: "border-border text-foreground", ghost: "border-transparent text-foreground hover:bg-muted", link: "border-transparent text-primary underline-offset-4 hover:underline", brand: "border-transparent bg-brand text-brand-foreground" } },
  defaultVariants: {
      variant: "default",
    },
});
function Badge({ className, variant, asChild = false, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}
export { Badge, badgeVariants };
