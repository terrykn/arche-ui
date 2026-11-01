"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProtoThemeToggle } from "./proto-theme";
import { SignInModal } from "./sign-in-modal";

export function ProtoAurora() {
  return (
    <div className="proto-aurora" aria-hidden>
      <i />
      <i />
      <i />
      <i />
    </div>
  );
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
      <header className="proto-nav">
        <div className="proto-wrap proto-nav-inner">
          <Link href="/" className="proto-logo">
            <span className="proto-logo-mark">AR</span>
            Arche
          </Link>
          <nav className="proto-nav-links" aria-label="Public">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="proto-nav-right">
            <ProtoThemeToggle compact />
            <button type="button" className="proto-btn proto-btn-ghost proto-btn-sm" onClick={() => setSignInOpen(true)}>
              Sign in
            </button>
            <Link href="/sign-up" className="proto-btn proto-btn-dark proto-btn-sm">
              Get Started →
            </Link>
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
    <footer className="proto-footer">
      <div className="proto-wrap proto-footer-inner">
        <span>AR Arche © 2026 Arche UI — prototype · Styled by the Arche identity (light + dark)</span>
        <nav className="proto-footer-links" aria-label="Footer">
          {FOOTER_LINKS.map((link) =>
            link.href === "/sign-in" ? (
              <FooterSignIn key={link.href} label={link.label} current={pathname} />
            ) : (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </footer>
  );
}

function FooterSignIn({ label, current }: { label: string; current: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", font: "inherit", padding: 0 }}
      >
        {label}
      </button>
      <SignInModal open={open} onClose={() => setOpen(false)} redirectTo={current} />
    </>
  );
}
