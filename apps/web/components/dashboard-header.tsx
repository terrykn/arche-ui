"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { ArcheLogo } from "@/components/arche-logo";
import { DASH_LINKS, DashboardNav } from "@/components/dashboard-nav";
import { MobileNavMenu } from "@/components/mobile-nav-menu";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(auth)/actions";

/**
 * Dashboard chrome. Non-editor pages get a left sidebar (plus a compact top
 * bar on small screens). The identity editor is isolated — it renders its own
 * top bar, so the header renders nothing there.
 */
export function DashboardHeader() {
  const pathname = usePathname();
  if (pathname?.endsWith("/edit") ?? false) {
    return null;
  }

  return (
    <>
      {/* Compact top bar on small screens: links + sign out live in the menu. */}
      <header className="border-b-(length:--border-width) border-border md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/" aria-label="Arche UI home" className="inline-flex items-center">
            <ArcheLogo size={32} />
          </Link>
          <MobileNavMenu
            links={DASH_LINKS}
            label="Open dashboard menu"
            footer={
              <form action={signOut}>
                <Button variant="outline" size="sm" type="submit" className="w-full">
                  Sign out
                </Button>
              </form>
            }
          />
        </div>
      </header>
      {/* Sidebar on medium screens and up */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r-(length:--border-width) border-border p-4 md:flex">
        <Link href="/" aria-label="Arche UI home" className="inline-flex items-center px-2">
          <ArcheLogo size={36} />
        </Link>
        <DashboardNav orientation="column" />
        <div className="mt-auto flex flex-col gap-2">
          <Button variant="default" size="sm" asChild className="w-full">
            <Link href="/dashboard">
              <Plus aria-hidden="true" /> New Identity
            </Link>
          </Button>
          <form action={signOut}>
            <Button variant="outline" size="sm" type="submit" className="w-full">
              Sign out
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}
