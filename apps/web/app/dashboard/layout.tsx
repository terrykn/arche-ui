import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard-header";

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
    // `isolate` makes this div a stacking context so its own background
    // paints before the page's negative-z aurora (bottom gradient) — without
    // it the opaque bg-background covers that layer instead.
    <div className="isolate min-h-screen bg-background text-foreground md:flex">
      <DashboardHeader />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
