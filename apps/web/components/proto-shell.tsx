"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProtoThemeToggle } from "./proto-theme";
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
      <header className="proto-focus-scope sticky top-0 z-40 border-b-(length:--border-width) border-border bg-card/82 backdrop-blur-md">
        <div className="proto-wrap flex h-[62px] items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-extrabold text-foreground"
          >
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-md bg-primary text-sm font-extrabold text-primary-foreground">
              AR
            </span>
            Arche
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
            <ProtoThemeToggle compact />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSignInOpen(true)}
            >
              Sign in
            </Button>
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
      { href: "/kitchen-sink", label: "Kitchen Sink" },
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
      <div className="proto-wrap grid gap-8 md:grid-cols-[1fr_repeat(4,minmax(0,auto))]">
        <div>
          <p className="font-extrabold text-foreground">AR Arche</p>
          <p className="mt-2 max-w-xs">© 2026 Arche UI — prototype · Styled by the Arche identity (light + dark)</p>
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
