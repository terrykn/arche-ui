import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArcheLogo } from "@/components/arche-logo";
import { signOut } from "../(auth)/actions";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const DASH_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/identities", label: "Identities" },
  { href: "/dashboard/mcp", label: "MCP" },
  { href: "/dashboard/docs", label: "Docs" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border bg-card p-4 text-card-foreground">
        <Link href="/" aria-label="Arche UI home" className="inline-flex items-center px-2 py-2">
          <ArcheLogo size={36} />
        </Link>
        <nav className="mt-2 flex flex-col gap-1" aria-label="Dashboard">
          {DASH_LINKS.map((link) => (
            <Button key={link.href} variant="ghost" asChild className="justify-start">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>
        <div className="mt-4">
          <Button variant="default" asChild className="w-full">
            <Link href="/dashboard/identities/new">
              <Plus aria-hidden="true" /> New Identity
            </Link>
          </Button>
        </div>
        <div className="mt-auto pt-3">
          <span className="block truncate text-sm text-muted-foreground">{user.email}</span>
        </div>
        <Separator className="my-3" />
        <form action={signOut}>
          <Button variant="outline" size="sm" type="submit" className="w-full">
            Sign out
          </Button>
        </form>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
