/** GENERATED from the Arche identity (fixtures/identity.arche.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";
import * as React from "react";
import * as Primitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";
function RadioGroup({ className, ...props }: React.ComponentProps<typeof Primitive.Root>) { return <Primitive.Root data-slot="radio-group" className={cn("grid gap-2", className)} {...props} />; }
function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof Primitive.Item>) { return <Primitive.Item data-slot="radio-group-item" className={cn("aspect-square size-4 rounded-full border-(length:--border-width) border-input outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary", className)} {...props}><Primitive.Indicator data-slot="radio-group-indicator" className="flex items-center justify-center"><span data-slot="radio-group-indicator-mark" className="size-2 rounded-full bg-primary" /></Primitive.Indicator></Primitive.Item>; }
export { RadioGroup, RadioGroupItem };
