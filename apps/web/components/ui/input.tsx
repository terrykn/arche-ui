/** GENERATED from the Arche identity (fixtures/identity.arche.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva("w-full min-w-0 border-(length:--border-width) border-input bg-transparent px-3 py-1 text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive", {
  variants: { controlSize: { sm: "h-8 text-xs", default: "h-9 text-sm", lg: "h-10 text-base" }, radius: { sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" } },
  defaultVariants: {
      controlSize: "default",
      radius: "md",
    },
});
function Input({ className, controlSize, radius, ...props }: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return <input data-slot="input" className={cn(inputVariants({ controlSize, radius }), className)} {...props} />;
}
export { Input, inputVariants };
