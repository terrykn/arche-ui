/** GENERATED from the Default identity (fixtures/identity.default.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";
import * as React from "react";
import * as P from "@radix-ui/react-password-toggle-field";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const passwordInputVariants = cva("w-full border-(length:--border-width) border-input bg-background px-3 py-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50", { variants: { radius: { sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" } }, defaultVariants: {
      radius: "md",
    } });
function PasswordToggleField(props: React.ComponentProps<typeof P.Root>) { return <P.Root data-slot="password-toggle-field" {...props} />; }
function PasswordToggleFieldInput({ className, radius, ...props }: React.ComponentProps<typeof P.Input> & VariantProps<typeof passwordInputVariants>) { return <P.Input data-slot="password-toggle-field-input" className={cn(passwordInputVariants({ radius }), className)} {...props} />; }
function PasswordToggleFieldToggle({ className, ...props }: React.ComponentProps<typeof P.Toggle>) { return <P.Toggle data-slot="password-toggle-field-toggle" className={cn("rounded-md px-2 text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring", className)} {...props} />; }
function PasswordToggleFieldIcon(props: React.ComponentProps<typeof P.Icon>) { return <P.Icon data-slot="password-toggle-field-icon" {...props} />; }
const PasswordToggleFieldSlot = P.Slot;
export { PasswordToggleField, PasswordToggleFieldInput, PasswordToggleFieldToggle, PasswordToggleFieldIcon, PasswordToggleFieldSlot, passwordInputVariants };
