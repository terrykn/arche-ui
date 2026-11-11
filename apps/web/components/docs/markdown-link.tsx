"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { useDocsBase } from "@/components/docs-base";

// Link convention for docs data files:
//   "./registry-auth"  -> docs page, resolved against the active docs base
//   "/sign-up"         -> site route, used as-is
export function DocsMarkdownLink({ href = "", children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const base = useDocsBase();
  const resolved = href.startsWith("./") ? `${base}${href.slice(1)}` : href;
  if (resolved.startsWith("/")) {
    return (
      <Link href={resolved} className="proto-docs-link" {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={resolved} className="proto-docs-link" {...rest}>
      {children}
    </a>
  );
}
