"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
 * The menu is a full-screen panel — large listed links over a blurred
 * backdrop — because a compact dropdown is hard to hit with a thumb.
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
  const [open, setOpen] = React.useState(false);

  // Tapping a link navigates; the panel closes with the route change too.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} title={label} className={className}>
          <Menu aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent
        size="full"
        overlayOpacity={0.6}
        backdropBlur="lg"
        className="flex h-dvh w-screen max-w-none flex-col gap-0 rounded-none border-0 bg-background/80 p-0 backdrop-blur-2xl [&>button[data-slot=dialog-close]]:hidden"
      >
        <DialogDescription className="sr-only">
          Site navigation. Choose a page to open it.
        </DialogDescription>
        <div className="flex items-center justify-between px-6 pt-5">
          <DialogTitle className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            Menu
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close menu">
              <X aria-hidden />
            </Button>
          </DialogClose>
        </div>
        <nav
          aria-label="Menu"
          className="flex-1 overflow-y-auto px-6 pt-4"
          style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
        >
          <ul className="flex flex-col">
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block border-b-(length:--border-width) border-border py-5 font-display text-3xl font-bold tracking-tight transition-colors",
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {footer ? <div className="mt-8">{footer}</div> : null}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
