"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface MobileNavLink {
  href: string;
  label: string;
}

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Small-screen navigation: the inline link row is hidden below `md`, so the
 * same destinations live behind a menu button instead of being dropped.
 * Callers pass the visibility class (`md:hidden` etc.) for their breakpoint.
 */
export function MobileNavMenu({
  links,
  footer,
  label = "Open menu",
  className,
}: {
  links: MobileNavLink[];
  footer?: React.ReactNode;
  label?: string;
  className?: string;
}) {
  const pathname = usePathname() ?? "";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} title={label} className={className}>
          <Menu aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-52">
        {links.map((link) => (
          <DropdownMenuItem key={link.href} asChild>
            <Link
              href={link.href}
              aria-current={isActive(pathname, link.href) ? "page" : undefined}
              className={cn("w-full", isActive(pathname, link.href) && "font-medium text-foreground")}
            >
              {link.label}
            </Link>
          </DropdownMenuItem>
        ))}
        {footer ? (
          <>
            <DropdownMenuSeparator />
            {footer}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
