"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useDocsBase } from "@/components/docs-base";
import { DOC_ORDER, DOC_SEARCH_GROUPS } from "@/components/docs-nav";

const LABELS = new Map<string, string>(
  DOC_SEARCH_GROUPS.flatMap((group) => group.links.map((link) => [link.path, link.label] as const)),
);

// Prev/next footer for every ordered docs page: previous on the left,
// next on the right, both drawn from the same reading order as the header
// pager. Pages outside the order (e.g. per-block detail pages) render nothing.
export function DocsPrevNext() {
  const base = useDocsBase();
  const pathname = usePathname();
  const index = DOC_ORDER.findIndex((path) => `${base}${path}` === pathname);
  if (index < 0) return null;
  const prev = index > 0 ? DOC_ORDER[index - 1]! : undefined;
  const next = index >= 0 && index < DOC_ORDER.length - 1 ? DOC_ORDER[index + 1]! : undefined;
  // `!== undefined`, not truthiness: the first docs page is "" (the base URL).
  if (prev === undefined && next === undefined) return null;

  return (
    <nav className="proto-docs-foot" data-docs-actions aria-label="Docs pages">
      {prev !== undefined ? (
        <Link className="proto-docs-foot-btn" href={`${base}${prev}`}>
          <ArrowLeft size={15} aria-hidden="true" />
          <span>{LABELS.get(prev) ?? "Previous"}</span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      {next !== undefined ? (
        <Link className="proto-docs-foot-btn" href={`${base}${next}`}>
          <span>{LABELS.get(next) ?? "Next"}</span>
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}
