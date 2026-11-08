import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/utils.js";

const textareaVariants = cva("flex min-h-16 w-full border-(length:--border-width) border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive", {
  variants: { radius: { sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" } },
  defaultVariants: { radius: "md" },
});
function Textarea({ className, radius, ...props }: React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
  return <textarea data-slot="textarea" className={cn(textareaVariants({ radius }), className)} {...props} />;
}
export { Textarea, textareaVariants };
