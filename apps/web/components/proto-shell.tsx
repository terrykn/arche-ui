"use client";

import * as React from "react";
import Link from "next/link";
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
import { DocsSearch } from "@/components/docs-search";
import { MobileNavMenu } from "@/components/mobile-nav-menu";

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

/** The inline row hides below `md`; the menu carries the same links plus the CTA. */
const MOBILE_NAV_LINKS = [...NAV_LINKS, { href: "/sign-up", label: "Get Started" }];

export function ProtoNav() {
  const [signInOpen, setSignInOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <>
      <header
        className={`proto-focus-scope sticky top-0 z-40 transition-colors ${scrolled ? "bg-card/82 backdrop-blur-md" : "bg-transparent"}`}
      >
        <div className="proto-wrap flex h-16 items-center justify-between">
          <Link href="/" aria-label="Arche home" className="inline-flex items-center">
            <ArcheLogo size={36} />
          </Link>
          <div className="hidden md:block">
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
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <DocsSearch />
            <Button variant="default" size="sm" asChild className="hidden md:inline-flex">
              <Link href="/sign-up">
                Get Started <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <MobileNavMenu links={MOBILE_NAV_LINKS} className="md:hidden" />
          </div>
        </div>
      </header>
      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  );
}

export function ProtoFooter() {
  return (
    <footer className="proto-focus-scope border-t-(length:--border-width) border-border py-5 text-sm text-muted-foreground">
      <div className="proto-wrap flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Link href="/" aria-label="Arche home" className="inline-flex items-center">
          <ArcheLogo size={28} />
        </Link>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <a href="mailto:terrynguyen.dev@gmail.com" className="hover:text-foreground hover:underline">
          Contact
        </a>
        <span aria-hidden="true">·</span>
        <a
          href="https://www.linkedin.com/in/terrykn"
          target="_blank"
          rel="noreferrer"
          className="hover:text-foreground hover:underline"
        >
          LinkedIn
        </a>
        <span aria-hidden="true">·</span>
        <span>© 2026 Terry Nguyen</span>
        </nav>
      </div>
    </footer>
  );
}
