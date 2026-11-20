/** GENERATED from the Arche identity (fixtures/identity.arche.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

const appShellVariants = cva("flex min-h-screen bg-background text-foreground", {
  variants: {
    sidebar: {
      fixed: "",
      collapsible: "",
    },
  },
  defaultVariants: { sidebar: "fixed" },
});

export interface AppShellProps extends VariantProps<typeof appShellVariants> {
  brand?: string;
  navItems?: string[];
  activeItem?: string;
  userName?: string;
  main: React.ReactNode;
  className?: string;
  portalContainer?: HTMLElement | null;
}

const DEFAULT_NAV = ["Board", "Orders", "Capacity", "Crew"];

function AppShell({ brand = "Acme", navItems = DEFAULT_NAV, activeItem = DEFAULT_NAV[0], userName = "Maya Chen", main, sidebar, className, portalContainer }: AppShellProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const narrow = sidebar === "collapsible" && collapsed;
  return (
    <div data-block="app-shell" className={cn(appShellVariants({ sidebar }), className)}>
      <aside aria-label="Primary" className={cn("flex shrink-0 flex-col border-r border-(length:--border-width) border-border bg-card", narrow ? "w-16" : "w-56")}>
        <div className="flex h-16 items-center gap-2 px-4">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-extrabold text-primary-foreground">A</span>
          {narrow ? null : <span className="text-base font-extrabold tracking-tight">{brand}</span>}
        </div>
        <Separator />
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => (
            <Button key={item} variant={item === activeItem ? "secondary" : "ghost"} className={cn("justify-start", narrow && "justify-center px-0")} aria-current={item === activeItem ? "page" : undefined}>
              {narrow ? item.slice(0, 1) : item}
            </Button>
          ))}
        </nav>
        <Separator />
        <div className="flex items-center gap-2 p-3">
          {sidebar === "collapsible" ? (
            <Button variant="ghost" size="sm" onClick={() => setCollapsed((value) => !value)} aria-expanded={!narrow} aria-label={narrow ? "Expand sidebar" : "Collapse sidebar"}>
              {narrow ? "»" : "«"}
            </Button>
          ) : null}
          {narrow ? null : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="min-w-0 flex-1 justify-start gap-2">
                  <Avatar>
                    <AvatarFallback>
                      {userName
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm">{userName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" container={portalContainer ?? undefined}>
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-(length:--border-width) border-border px-6">
          <p className="text-sm text-muted-foreground">
            {brand} · {activeItem}
          </p>
        </div>
        <main className="min-w-0 flex-1 p-6">{main}</main>
      </div>
    </div>
  );
}

export { AppShell, appShellVariants };
