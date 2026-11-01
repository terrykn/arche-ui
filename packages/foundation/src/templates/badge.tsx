import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/utils.js";

const badgeVariants = cva("inline-flex w-fit items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium", {
  variants: { variant: { default: "bg-primary text-primary-foreground", secondary: "bg-secondary text-secondary-foreground", destructive: "bg-destructive text-destructive-foreground", outline: "border-border text-foreground", ghost: "text-foreground hover:bg-muted", link: "text-primary underline-offset-4 hover:underline" } },
  defaultVariants: { variant: "default" },
});
function Badge({ className, variant, asChild = false, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}
export { Badge, badgeVariants };
