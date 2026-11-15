"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArcheLogo } from "./arche-logo";
import { SignInModal } from "./sign-in-modal";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import { DocsSearch } from "@/components/docs-search";

// Backdrop wash derived only from identity tokens (primary/secondary/accent).
// No hardcoded colors here — the hero headline gradient is the single exception.
export function ProtoAurora() {
  return <div className="proto-aurora" aria-hidden />;
}

const NAV_LINKS = [
  { href: "/docs", label: "Docs" },
  { href: "/examples", label: "Examples" },
  { href: "/pricing", label: "Pricing" },
];

export function ProtoNav() {
  const [signInOpen, setSignInOpen] = React.useState(false);
  return (
    <>
      <header className="proto-focus-scope sticky top-0 z-40 bg-card/82 backdrop-blur-md">
        <div className="proto-wrap flex h-16 items-center justify-between">
          <Link href="/" aria-label="Arche home" className="inline-flex items-center">
            <ArcheLogo size={36} />
          </Link>
          <NavigationMenu aria-label="Public">
            <NavigationMenuList>
              {NAV_LINKS.map((link) => (
                <NavigationMenuItem key={link.href}>
                  <NavigationMenuLink asChild>
                    <Link href={link.href}>{link.label}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          <div className="flex items-center gap-2">
            <DocsSearch />
            <Button variant="default" size="sm" asChild>
              <Link href="/sign-up">
                Get Started <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  );
}

const FOOTER_GROUPS: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: "Product",
    links: [
      { href: "/examples", label: "Examples" },
      { href: "/kitchen-sink", label: "Demo site" },
      { href: "/pricing", label: "Pricing" },
      { href: "/changelog", label: "Changelog" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/docs", label: "Docs" },
      { href: "/components", label: "Components" },
      { href: "/docs/mcp", label: "MCP" },
      { href: "/accessibility", label: "Accessibility" },
    ],
  },
  {
    title: "Company",
    links: [{ href: "/about", label: "About" }],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function ProtoFooter() {
  const pathname = usePathname();
  return (
    <footer className="proto-focus-scope border-t-(length:--border-width) border-border py-10 text-sm text-muted-foreground">
      <div className="proto-wrap">
      <div className="grid gap-8 md:grid-cols-[1fr_repeat(4,minmax(0,auto))]">
        <div>
          <p>
            <ArcheLogo size={36} />
          </p>
          <p className="mt-2 max-w-xs">© 2026 Arche UI</p>
        </div>
        {FOOTER_GROUPS.map((group) => (
          <nav key={group.title} aria-label={`Footer — ${group.title}`}>
            <p className="font-semibold text-foreground">{group.title}</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-foreground hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
              {group.title === "Company" ? (
                <li>
                  <FooterSignIn label="Sign in" current={pathname} />
                </li>
              ) : null}
            </ul>
          </nav>
        ))}
      </div>
      <Separator className="mt-8" />
      </div>
    </footer>
  );
}

function FooterSignIn({ label, current }: { label: string; current: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="hover:text-foreground hover:underline">
        {label}
      </button>
      <SignInModal open={open} onClose={() => setOpen(false)} redirectTo={current} />
    </>
  );
}
