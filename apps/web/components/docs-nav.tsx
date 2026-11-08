"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const GROUPS: Array<{ heading: string; links: Array<{ href: string; label: string }> }> = [
  {
    heading: "Getting Started",
    links: [
      { href: "/docs", label: "Installation" },
      { href: "/docs/quick-start", label: "Quick Start" },
      { href: "/docs/configuration", label: "Configuration" },
    ],
  },
  {
    heading: "Components",
    links: [{ href: "/docs/components", label: "All components" }],
  },
  {
    heading: "Advanced",
    links: [
      { href: "/docs/generate", label: "Generate with AI" },
      { href: "/docs/ai-mcp", label: "AI & MCP" },
      { href: "/docs/theming", label: "Theming" },
      { href: "/docs/customization", label: "Customization" },
    ],
  },
  {
    heading: "Specs & Briefs",
    links: [
      { href: "/docs/spec-a1-9", label: "Web App Spec (§A1.9)" },
      { href: "/docs/brief-3", label: "Brief #3 — Web App" },
    ],
  },
];

export function DocsNav() {
  const pathname = usePathname();
  return (
    <aside className="proto-docs-side">
      <input className="proto-input" placeholder="Search docs..." aria-label="Search docs" />
      {GROUPS.map((group) => (
        <div key={group.heading} className="proto-docs-group">
          <h4>{group.heading}</h4>
          {group.links.map((link) => (
            <Link key={link.href} href={link.href} className={pathname === link.href ? "active" : ""}>
              {link.label}
            </Link>
          ))}
        </div>
      ))}
    </aside>
  );
}
