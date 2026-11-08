"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { cn } from "../templates/lib/utils.js";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "../templates/navigation-menu.js";
import { Button } from "../templates/button.js";
import { Avatar, AvatarFallback } from "../templates/avatar.js";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../templates/dropdown-menu.js";

export interface SiteHeaderLink {
  label: string;
  href: string;
}

export interface SiteHeaderAction {
  label: string;
  href: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
}

export interface SiteHeaderProps {
  logo?: string;
  links?: SiteHeaderLink[];
  actions?: SiteHeaderAction[];
  userName?: string;
  className?: string;
}

const DEFAULT_LINKS: SiteHeaderLink[] = [
  { label: "Boards", href: "#boards" },
  { label: "Orders", href: "#orders" },
  { label: "Capacity", href: "#capacity" },
  { label: "Docs", href: "#docs" },
];

function SiteHeader({ logo = "Acme", links = DEFAULT_LINKS, actions = [{ label: "Get started", href: "#get-started" }], userName, className }: SiteHeaderProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <header data-block="site-header" className={cn("sticky top-0 z-40 border-b border-(length:--border-width) border-border bg-background", className)}>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-6">
        <a href="#top" className="text-lg font-extrabold tracking-tight text-foreground">
          {logo}
        </a>
        <NavigationMenu className="hidden md:block">
          <NavigationMenuList>
            {links.map((link) => (
              <NavigationMenuItem key={link.label}>
                <NavigationMenuLink href={link.href} className="text-sm text-muted-foreground">
                  {link.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <div className="ml-auto flex items-center gap-2">
          {userName ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`${userName} account menu`}>
                  <Avatar>
                    <AvatarFallback>
                      {userName
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>{userName}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            actions.slice(0, 2).map((action) => (
              <Button key={action.label} variant={action.variant ?? "default"} asChild className="hidden md:inline-flex">
                <a href={action.href}>{action.label}</a>
              </Button>
            ))
          )}
          <Button variant="ghost" size="icon" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((value) => !value)} className="md:hidden">
            <Menu aria-hidden />
          </Button>
        </div>
      </div>
      {open ? (
        <nav aria-label="Mobile" className="border-t border-(length:--border-width) border-border px-6 py-3 md:hidden">
          <ul className="flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.label}>
                <a href={link.href} onClick={() => setOpen(false)} className="block rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

export { SiteHeader };
