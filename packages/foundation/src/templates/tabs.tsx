"use client";
import * as React from "react";
import * as Primitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/utils.js";
const tabsListVariants = cva("inline-flex w-fit items-center rounded-md p-1 text-muted-foreground", {
  variants: { variant: { default: "bg-muted", line: "bg-transparent" } },
  defaultVariants: { variant: "default" },
});
function Tabs({ className, ...props }: React.ComponentProps<typeof Primitive.Root>) { return <Primitive.Root data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props} />; }
function TabsList({ className, variant, ...props }: React.ComponentProps<typeof Primitive.List> & VariantProps<typeof tabsListVariants>) { return <Primitive.List data-slot="tabs-list" className={cn(tabsListVariants({ variant }), className)} {...props} />; }
function TabsTrigger({ className, ...props }: React.ComponentProps<typeof Primitive.Trigger>) { return <Primitive.Trigger data-slot="tabs-trigger" className={cn("inline-flex items-center justify-center rounded-md px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground", className)} {...props} />; }
function TabsContent({ className, ...props }: React.ComponentProps<typeof Primitive.Content>) { return <Primitive.Content data-slot="tabs-content" className={cn("text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring", className)} {...props} />; }
export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
