"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/utils.js";

const alertDialogContentVariants = cva("fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-4 border bg-popover p-6 text-popover-foreground outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95", {
  variants: {
    size: { sm: "max-w-sm", default: "max-w-lg", lg: "max-w-2xl" },
    radius: { sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" },
    shadow: { none: "shadow-none", sm: "shadow-(--shadow-sm)", md: "shadow-(--shadow-md)", lg: "shadow-(--shadow-lg)", xl: "shadow-(--shadow-xl)" },
  },
  defaultVariants: { size: "default", radius: "lg", shadow: "md" },
});
function AlertDialog(props: React.ComponentProps<typeof AlertDialogPrimitive.Root>) { return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />; }
function AlertDialogTrigger(props: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) { return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />; }
function AlertDialogPortal(props: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) { return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />; }
function AlertDialogOverlay({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return <AlertDialogPrimitive.Overlay data-slot="alert-dialog-overlay" className={cn("fixed inset-0 z-50 bg-foreground/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0", className)} {...props} />;
}
function AlertDialogContent({ className, size, radius, shadow, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Content> & VariantProps<typeof alertDialogContentVariants>) {
  return <AlertDialogPortal><AlertDialogOverlay /><AlertDialogPrimitive.Content data-slot="alert-dialog-content" className={cn(alertDialogContentVariants({ size, radius, shadow }), className)} {...props} /></AlertDialogPortal>;
}
function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="alert-dialog-header" className={cn("flex flex-col gap-2 text-center sm:text-left", className)} {...props} />; }
function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="alert-dialog-footer" className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />; }
function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) { return <AlertDialogPrimitive.Title data-slot="alert-dialog-title" className={cn("text-lg font-semibold", className)} {...props} />; }
function AlertDialogDescription({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Description>) { return <AlertDialogPrimitive.Description data-slot="alert-dialog-description" className={cn("text-sm text-muted-foreground", className)} {...props} />; }
function AlertDialogAction({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Action>) { return <AlertDialogPrimitive.Action data-slot="alert-dialog-action" className={cn("inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring", className)} {...props} />; }
function AlertDialogCancel({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) { return <AlertDialogPrimitive.Cancel data-slot="alert-dialog-cancel" className={cn("inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-foreground focus-visible:ring-2 focus-visible:ring-ring", className)} {...props} />; }
export { AlertDialog, AlertDialogTrigger, AlertDialogPortal, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, alertDialogContentVariants };
