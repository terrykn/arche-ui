"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDocsBase } from "@/components/docs-base";

// Full docs index for the nav search modal. The sidebar shows this same
// list: only the pages in the tabs exist as far as readers are concerned.
export const DOC_SEARCH_GROUPS: Array<{
  heading: string;
  links: Array<{ path: string; label: string }>;
}> = [
  {
    heading: "Getting Started",
    links: [
      { path: "/configuration", label: "Configuration" },
      { path: "/installation", label: "Installation" },
      { path: "/customization", label: "Customization" },
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

// Reading order for the docs pager. Every docs page appears once, including
// pages that are linked from other pages instead of the sidebar.
export const DOC_ORDER = ["/configuration", "/installation", "/customization", "/components", "/blocks", "/mcp"];

// The sidebar renders every docs page — one shared list, so the tabs can
// never drift out of sync with what actually exists.
const GROUPS = DOC_SEARCH_GROUPS;

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
