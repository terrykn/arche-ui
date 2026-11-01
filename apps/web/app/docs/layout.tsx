import Link from "next/link";
import { SiteNav } from "@/components/site-nav";

const SECTIONS = [
  { href: "/docs", label: "Overview" },
  { href: "/docs/getting-started", label: "Getting started" },
  { href: "/docs/install-identity", label: "Install an identity" },
  { href: "/docs/create-edit", label: "Create / edit an identity" },
  { href: "/docs/token-contract", label: "Token contract" },
  { href: "/docs/mcp", label: "MCP overview + setup" },
  { href: "/docs/cli", label: "CLI (as specced)" },
  { href: "/docs/registry-auth", label: "Registry auth" },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <div className="mx-auto flex max-w-6xl gap-8 px-6 py-12">
        <nav className="flex w-56 shrink-0 flex-col gap-1 text-sm">
          {SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-md px-2 py-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {section.label}
            </Link>
          ))}
        </nav>
        <article className="min-w-0 flex-1">{children}</article>
      </div>
    </>
  );
}
