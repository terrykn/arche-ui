import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArcheLogo } from "./arche-logo";
import { Button } from "@/components/ui/button";

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
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-3">
        <Link href="/" aria-label="Arche UI home" className="inline-flex items-center">
          <ArcheLogo size={36} />
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
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
