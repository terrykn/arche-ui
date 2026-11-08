import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "./theme-toggle";

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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="font-display text-xl">
          Arche UI
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <Link href="/dashboard" className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
              Dashboard
            </Link>
          ) : (
            <Link href="/sign-in" className="rounded-md border-(length:--border-width) border-border px-3 py-1.5 text-sm">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
