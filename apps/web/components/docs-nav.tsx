"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDocsBase } from "@/components/docs-base";

const GROUPS: Array<{ heading: string; links: Array<{ path: string; label: string }> }> = [
  {
    heading: "Getting Started",
    links: [
      { path: "", label: "Installation" },
      { path: "/quick-start", label: "Quick Start" },
      { path: "/configuration", label: "Configuration" },
    ],
  },
  {
    heading: "Components",
    links: [
      { path: "/components", label: "All components" },
      { path: "/blocks", label: "All blocks" },
    ],
  },
  {
    heading: "Advanced",
    links: [
      { path: "/mcp", label: "Model Context Protocol" },
      { path: "/customization", label: "Customization" },
    ],
  },
];

// Full docs index for the nav search modal. Larger than the sidebar on
// purpose: pages that are only reachable from other pages stay searchable.
export const DOC_SEARCH_GROUPS: Array<{
  heading: string;
  links: Array<{ path: string; label: string }>;
}> = [
  {
    heading: "Getting Started",
    links: [
      { path: "", label: "Installation" },
      { path: "/quick-start", label: "Quick Start" },
      { path: "/getting-started", label: "Getting started" },
      { path: "/install-identity", label: "Install an identity" },
      { path: "/configuration", label: "Configuration" },
    ],
  },
  {
    heading: "Guides",
    links: [
      { path: "/registry-auth", label: "Registry auth" },
      { path: "/token-contract", label: "Token contract" },
      { path: "/cli", label: "CLI" },
      { path: "/create-edit", label: "Create / edit an identity" },
    ],
  },
  {
    heading: "Components",
    links: [
      { path: "/components", label: "All components" },
      { path: "/blocks", label: "All blocks" },
    ],
  },
  {
    heading: "Advanced",
    links: [
      { path: "/mcp", label: "Model Context Protocol" },
      { path: "/customization", label: "Customization" },
    ],
  },
  {
    heading: "Specs & Briefs",
    links: [
      { path: "/web-app-spec", label: "Web App Spec" },
      { path: "/brief-3", label: "Brief #3 — Web App" },
    ],
  },
];

// Reading order for the docs pager. Every docs page appears once, including
// pages that are linked from other pages instead of the sidebar.
export const DOC_ORDER = [
  "",
  "/quick-start",
  "/getting-started",
  "/install-identity",
  "/configuration",
  "/registry-auth",
  "/token-contract",
  "/cli",
  "/create-edit",
  "/components",
  "/blocks",
  "/mcp",
  "/customization",
  "/web-app-spec",
  "/brief-3",
];

export function DocsNav() {
  const base = useDocsBase();
  const pathname = usePathname();
  return (
    <aside className="proto-docs-side">
      {GROUPS.map((group) => (
        <div key={group.heading} className="proto-docs-group">
          <h4>{group.heading}</h4>
          {group.links.map((link) => {
            const href = `${base}${link.path}`;
            return (
              <Link key={link.path} href={href} className={pathname === href ? "active" : ""}>
                {link.label}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
