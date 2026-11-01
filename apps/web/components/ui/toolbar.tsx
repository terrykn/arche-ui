/** GENERATED from the Arche identity (fixtures/identity.arche.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";
import * as React from "react";
import * as P from "@radix-ui/react-toolbar";
import { cn } from "@/lib/utils";
function Toolbar({ className, ...props }: React.ComponentProps<typeof P.Root>) { return <P.Root data-slot="toolbar" className={cn("flex items-center gap-1 rounded-md border bg-background p-1", className)} {...props} />; }
function ToolbarButton({ className, ...props }: React.ComponentProps<typeof P.Button>) { return <P.Button data-slot="toolbar-button" className={cn("inline-flex h-9 items-center rounded-sm px-3 text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50", className)} {...props} />; }
function ToolbarLink({ className, ...props }: React.ComponentProps<typeof P.Link>) { return <P.Link data-slot="toolbar-link" className={cn("rounded-sm px-3 text-sm text-primary underline-offset-4 hover:underline", className)} {...props} />; }
function ToolbarSeparator({ className, ...props }: React.ComponentProps<typeof P.Separator>) { return <P.Separator data-slot="toolbar-separator" className={cn("mx-1 w-px self-stretch bg-border", className)} {...props} />; }
function ToolbarToggleGroup(props: React.ComponentProps<typeof P.ToggleGroup>) { return <P.ToggleGroup data-slot="toolbar-toggle-group" {...props} />; }
function ToolbarToggleItem({ className, ...props }: React.ComponentProps<typeof P.ToggleItem>) { return <P.ToggleItem data-slot="toolbar-toggle-item" className={cn("inline-flex h-9 items-center rounded-sm px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=on]:bg-accent data-[state=on]:text-accent-foreground", className)} {...props} />; }
export { Toolbar, ToolbarButton, ToolbarLink, ToolbarSeparator, ToolbarToggleGroup, ToolbarToggleItem };
