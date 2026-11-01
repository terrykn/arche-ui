/** GENERATED from the Arche identity (fixtures/identity.arche.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";
import * as React from "react";
import * as P from "@radix-ui/react-one-time-password-field";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const otpInputVariants = cva("size-10 border border-input bg-background text-center text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50", { variants: { radius: { sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" } }, defaultVariants: {
      radius: "md",
    } });
function OneTimePasswordField({ className, ...props }: React.ComponentProps<typeof P.Root>) { return <P.Root data-slot="one-time-password-field" className={cn("flex gap-2", className)} {...props} />; }
function OneTimePasswordFieldInput({ className, radius, ...props }: React.ComponentProps<typeof P.Input> & VariantProps<typeof otpInputVariants>) { return <P.Input data-slot="one-time-password-field-input" className={cn(otpInputVariants({ radius }), className)} {...props} />; }
function OneTimePasswordFieldHiddenInput(props: React.ComponentProps<typeof P.HiddenInput>) { return <P.HiddenInput data-slot="one-time-password-field-hidden-input" {...props} />; }
export { OneTimePasswordField, OneTimePasswordFieldInput, OneTimePasswordFieldHiddenInput, otpInputVariants };
