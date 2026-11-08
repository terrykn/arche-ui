/** GENERATED from the Arche identity (fixtures/identity.arche.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const checkboxVariants = cva("peer shrink-0 border-(length:--border-width) border-input outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", {
  variants: { size: { sm: "size-3", default: "size-4", lg: "size-5" }, radius: { sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" } },
  defaultVariants: {
      size: "default",
      radius: "sm",
    },
});
function Checkbox({ className, size, radius, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root> & VariantProps<typeof checkboxVariants>) {
  return <CheckboxPrimitive.Root data-slot="checkbox" className={cn(checkboxVariants({ size, radius }), className)} {...props}><CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="flex items-center justify-center text-current"><Check className="size-3.5" aria-hidden="true" /></CheckboxPrimitive.Indicator></CheckboxPrimitive.Root>;
}
export { Checkbox, checkboxVariants };
