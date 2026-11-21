/** GENERATED from the Default identity (fixtures/identity.default.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const skeletonVariants = cva("animate-pulse bg-muted", {
  variants: { radius: { sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" } },
  defaultVariants: {
      radius: "md",
    },
});
function Skeleton({ className, radius, ...props }: React.ComponentProps<"div"> & VariantProps<typeof skeletonVariants>) {
  return <div data-slot="skeleton" className={cn(skeletonVariants({ radius }), className)} {...props} />;
}
export { Skeleton, skeletonVariants };
