/** GENERATED from the Arche identity (fixtures/identity.arche.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/95",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/25 active:bg-destructive/95",
        outline:
          "border-(length:--border-width) border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent",
        link: "text-primary underline-offset-4 hover:underline",
        // Brand Token brief: the brand-highlight CTA. Background --brand
        // with --brand-foreground text is an AA-gated contract pair, so
        // this variant can never ship unreadable text in either mode.
        brand:
          "bg-brand text-brand-foreground hover:bg-brand/90 active:bg-brand/95",
      },
      size: {
        default: "px-4 py-2 has-[>svg]:px-4",
        sm: "px-3 py-1.5 has-[>svg]:px-3",
        lg: "px-6 py-2.5 has-[>svg]:px-6",
        icon: "size-9",
      },
      // style-surface knob: [none, sm] per manifest
      shadow: {
        none: "shadow-none",
        sm: "shadow-(--shadow-sm)",
      },
      // style-surface knob: [normal, medium, semibold] per manifest
      fontWeight: {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shadow: "none",
      fontWeight: "medium",
    },
  },
);

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({ className, variant, size, shadow, fontWeight, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, shadow, fontWeight }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
