"use client";
import * as React from "react";
import * as P from "@radix-ui/react-form";
import { cn } from "./lib/utils.js";
function Form({ className, ...props }: React.ComponentProps<typeof P.Root>) { return <P.Root data-slot="form" className={cn("grid gap-4", className)} {...props} />; }
function FormField({ className, ...props }: React.ComponentProps<typeof P.Field>) { return <P.Field data-slot="form-field" className={cn("grid gap-2", className)} {...props} />; }
function FormLabel({ className, ...props }: React.ComponentProps<typeof P.Label>) { return <P.Label data-slot="form-label" className={cn("text-sm font-medium text-foreground data-[invalid]:text-destructive", className)} {...props} />; }
function FormControl({ className, ...props }: React.ComponentProps<typeof P.Control>) { return <P.Control data-slot="form-control" className={cn("w-full rounded-md border-(length:--border-width) border-input bg-background px-3 py-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring data-[invalid]:border-destructive", className)} {...props} />; }
function FormMessage({ className, ...props }: React.ComponentProps<typeof P.Message>) { return <P.Message data-slot="form-message" className={cn("text-sm text-destructive", className)} {...props} />; }
function FormSubmit({ className, ...props }: React.ComponentProps<typeof P.Submit>) { return <P.Submit data-slot="form-submit" className={cn("inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring", className)} {...props} />; }
const FormValidityState: typeof P.ValidityState = P.ValidityState;
export { Form, FormField, FormLabel, FormControl, FormMessage, FormSubmit, FormValidityState };
