import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeFromProfile } from "@/components/theme-from-profile";
import { createServiceClient } from "@/lib/supabase/service";
import { signOut } from "../(auth)/actions";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const DASH_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/applications", label: "Applications" },
  { href: "/dashboard/identities", label: "Identities" },
  { href: "/dashboard/components", label: "Components" },
  { href: "/dashboard/standards", label: "Standards" },
  { href: "/dashboard/mcp", label: "MCP" },
  { href: "/dashboard/docs", label: "Docs" },
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

  const service = createServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("theme")
    .eq("id", user.id)
    .maybeSingle();
  const theme = (profile as unknown as { theme?: "light" | "dark" | "system" } | null)?.theme ?? "system";
  const initials = (user.email ?? "A").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <ThemeFromProfile theme={theme} />
      <aside className="flex w-60 shrink-0 flex-col gap-1 border-r border-border bg-card p-4 text-card-foreground">
        <Link href="/" className="px-2 py-2 font-display text-lg text-foreground">
          Arche UI
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
        <div className="mt-auto flex items-center gap-2 pt-3">
          <Avatar size="sm">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{user.email}</span>
          <Badge variant="secondary">Pro</Badge>
        </div>
        <Separator className="my-3" />
        <div className="flex items-center justify-between gap-2">
          <ThemeToggle />
        </div>
        <form action={signOut}>
          <Button variant="outline" size="sm" type="submit" className="mt-2 w-full">
            Sign out
          </Button>
        </form>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
