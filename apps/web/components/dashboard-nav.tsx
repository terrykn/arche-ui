"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const DASH_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/docs", label: "Docs" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function DashboardNav({ orientation = "row" }: { orientation?: "row" | "column" }) {
  const pathname = usePathname();
  const vertical = orientation === "column";

  return (
    <nav
      className={vertical ? "flex flex-col gap-1 text-sm" : "flex items-center gap-4 text-sm"}
      aria-label="Dashboard"
    >
      {DASH_LINKS.map((link) => {
        const active =
          link.href === "/dashboard"
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        const className = vertical
          ? active
            ? "rounded-md bg-muted px-2 py-1.5 font-medium text-foreground"
            : "rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          : active
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground";
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={className}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
