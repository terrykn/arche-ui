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
      <header className="sticky top-0 z-40 border-b border-border bg-card/82 backdrop-blur-md">
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

const FOOTER_LINKS = [
  { href: "/docs", label: "Docs" },
  { href: "/examples", label: "Examples" },
  { href: "/pricing", label: "Pricing" },
  { href: "/sign-in", label: "Sign in" },
];

export function ProtoFooter() {
  const pathname = usePathname();
  return (
    <footer className="border-t border-border py-6 text-sm text-muted-foreground">
      <div className="proto-wrap flex flex-wrap items-center justify-between gap-4">
        <span>AR Arche © 2026 Arche UI — prototype · Styled by the Arche identity (light + dark)</span>
        <nav className="flex items-center gap-1" aria-label="Footer">
          {FOOTER_LINKS.map((link) =>
            link.href === "/sign-in" ? (
              <FooterSignIn key={link.href} label={link.label} current={pathname} />
            ) : (
              <Button key={link.href} variant="link" size="sm" asChild>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ),
          )}
        </nav>
      </div>
      <Separator className="mt-4" />
    </footer>
  );
}

function FooterSignIn({ label, current }: { label: string; current: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="link" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <SignInModal open={open} onClose={() => setOpen(false)} redirectTo={current} />
    </>
  );
}
