import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArcheLogo } from "./arche-logo";
import { Button } from "@/components/ui/button";
import { MobileNavMenu } from "./mobile-nav-menu";

const LINKS = [
  { href: "/identities", label: "Identities" },
  { href: "/components", label: "Components" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

export async function SiteNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b-(length:--border-width) border-border">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-3 sm:gap-4">
        <Link href="/" aria-label="Arche UI home" className="inline-flex items-center">
          <ArcheLogo size={36} />
        </Link>
        <nav aria-label="Public" className="hidden items-center gap-4 text-sm md:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <MobileNavMenu links={LINKS} className="md:hidden" />
          {user ? (
            <Button variant="default" size="sm" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
