"use client";
import * as React from "react";
import * as P from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/utils.js";
const toastVariants = cva("flex items-center justify-between gap-4 border-(length:--border-width) bg-background p-4 text-foreground data-[state=open]:animate-in data-[state=closed]:animate-out", { variants: { radius: { sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" }, shadow: { none: "shadow-none", sm: "shadow-(--shadow-sm)", md: "shadow-(--shadow-md)", lg: "shadow-(--shadow-lg)", xl: "shadow-(--shadow-xl)" } }, defaultVariants: { radius: "md", shadow: "lg" } });
function ToastProvider(props: React.ComponentProps<typeof P.Provider>) { return <P.Provider data-slot="toast-provider" {...props} />; }
const viewportVariants = cva("fixed right-0 z-50 flex w-full max-w-sm gap-2 p-4", { variants: { position: { "top-right": "top-0 flex-col", "bottom-right": "bottom-0 flex-col-reverse" } }, defaultVariants: { position: "top-right" } });
function ToastViewport({ className, position, ...props }: React.ComponentProps<typeof P.Viewport> & VariantProps<typeof viewportVariants>) { return <P.Viewport data-slot="toast-viewport" className={cn(viewportVariants({ position }), className)} {...props} />; }
function Toast({ className, radius, shadow, ...props }: React.ComponentProps<typeof P.Root> & VariantProps<typeof toastVariants>) { return <P.Root data-slot="toast" className={cn(toastVariants({ radius, shadow }), className)} {...props} />; }
function ToastTitle({ className, ...props }: React.ComponentProps<typeof P.Title>) { return <P.Title data-slot="toast-title" className={cn("text-sm font-semibold", className)} {...props} />; }
function ToastDescription({ className, ...props }: React.ComponentProps<typeof P.Description>) { return <P.Description data-slot="toast-description" className={cn("text-sm text-muted-foreground", className)} {...props} />; }
function ToastAction({ className, ...props }: React.ComponentProps<typeof P.Action>) { return <P.Action data-slot="toast-action" className={cn("rounded-md border-(length:--border-width) px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-ring", className)} {...props} />; }
function ToastClose({ className, ...props }: React.ComponentProps<typeof P.Close>) { return <P.Close data-slot="toast-close" className={cn("rounded-md p-1 text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring", className)} {...props} />; }
export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastAction, ToastClose, toastVariants, viewportVariants };
