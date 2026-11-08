/** GENERATED from the Arche identity (fixtures/identity.arche.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";
import * as React from "react";
import * as P from "@radix-ui/react-navigation-menu";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
function NavigationMenu({ className, ...props }: React.ComponentProps<typeof P.Root>) { return <P.Root data-slot="navigation-menu" className={cn("relative flex items-center justify-center", className)} {...props} />; }
function NavigationMenuList({ className, ...props }: React.ComponentProps<typeof P.List>) { return <P.List data-slot="navigation-menu-list" className={cn("flex items-center gap-1", className)} {...props} />; }
function NavigationMenuItem(props: React.ComponentProps<typeof P.Item>) { return <P.Item data-slot="navigation-menu-item" {...props} />; }
function NavigationMenuTrigger({ className, children, ...props }: React.ComponentProps<typeof P.Trigger>) { return <P.Trigger data-slot="navigation-menu-trigger" className={cn("group inline-flex h-9 items-center rounded-md bg-background px-4 py-2 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent", className)} {...props}>{children}<ChevronDown className="ml-1 size-4 transition-transform group-data-[state=open]:rotate-180" /></P.Trigger>; }
function NavigationMenuContent({ className, ...props }: React.ComponentProps<typeof P.Content>) { return <P.Content data-slot="navigation-menu-content" className={cn("rounded-md border-(length:--border-width) bg-popover p-2 text-popover-foreground shadow-(--shadow-md) data-[motion=from-start]:animate-in data-[motion=to-end]:animate-out", className)} {...props} />; }
function NavigationMenuLink({ className, ...props }: React.ComponentProps<typeof P.Link>) { return <P.Link data-slot="navigation-menu-link" className={cn("block rounded-sm p-2 text-sm outline-none hover:bg-accent focus:bg-accent focus:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring", className)} {...props} />; }
function NavigationMenuViewport({ className, ...props }: React.ComponentProps<typeof P.Viewport>) { return <P.Viewport data-slot="navigation-menu-viewport" className={cn("overflow-hidden rounded-md border-(length:--border-width) bg-popover text-popover-foreground shadow-(--shadow-md)", className)} {...props} />; }
function NavigationMenuIndicator({ className, ...props }: React.ComponentProps<typeof P.Indicator>) { return <P.Indicator data-slot="navigation-menu-indicator" className={cn("flex items-end justify-center", className)} {...props} />; }
export { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink, NavigationMenuViewport, NavigationMenuIndicator };
