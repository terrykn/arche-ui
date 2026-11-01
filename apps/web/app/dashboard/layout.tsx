import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeFromProfile } from "@/components/theme-from-profile";
import { createServiceClient } from "@/lib/supabase/service";
import { signOut } from "../(auth)/actions";

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

  return (
    <div className="flex min-h-screen">
      <ThemeFromProfile theme={theme} />
      <aside className="flex w-60 shrink-0 flex-col gap-1 border-r border-border bg-card p-4 text-card-foreground">
        <Link href="/" className="font-display px-2 py-2 text-lg">
          Arche UI
        </Link>
        <nav className="mt-2 flex flex-col gap-1 text-sm">
          <Link href="/dashboard" className="rounded-md px-2 py-1.5 hover:bg-accent hover:text-accent-foreground">
            Dashboard
          </Link>
          <Link href="/dashboard/applications" className="rounded-md px-2 py-1.5 hover:bg-accent hover:text-accent-foreground">
            Applications
          </Link>
          <Link href="/dashboard/identities" className="rounded-md px-2 py-1.5 hover:bg-accent hover:text-accent-foreground">
            Identities
          </Link>
          <Link href="/dashboard/components" className="rounded-md px-2 py-1.5 hover:bg-accent hover:text-accent-foreground">
            Components
          </Link>
          <Link href="/dashboard/standards" className="rounded-md px-2 py-1.5 hover:bg-accent hover:text-accent-foreground">
            Standards
          </Link>
          <Link href="/dashboard/mcp" className="rounded-md px-2 py-1.5 hover:bg-accent hover:text-accent-foreground">
            MCP
          </Link>
          <Link href="/dashboard/docs" className="rounded-md px-2 py-1.5 hover:bg-accent hover:text-accent-foreground">
            Docs
          </Link>
        </nav>
        <div className="mt-4">
          <Link
            href="/dashboard/identities/new"
            className="block rounded-md bg-primary px-3 py-2 text-center text-sm text-primary-foreground"
          >
            + New Identity
          </Link>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-sm">
          <span className="truncate px-1 text-muted-foreground">{user.email}</span>
          <ThemeToggle />
        </div>
        <form action={signOut}>
          <button type="submit" className="mt-2 w-full rounded-md border border-border px-3 py-1.5 text-sm">
            Sign out
          </button>
        </form>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
