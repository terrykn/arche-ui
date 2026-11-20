"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { useDocsBase } from "@/components/docs-base";
import { DOC_ORDER } from "@/components/docs-nav";

// Page title row for every docs page: title on the left, copy-page and
// prev/next controls on the right, both drawn from the same nav order.
export function DocsPageHeader({ title, className }: { title: string; className?: string }) {
  const base = useDocsBase();
  const pathname = usePathname();
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const index = DOC_ORDER.findIndex((path) => `${base}${path}` === pathname);
  const prev = index > 0 ? DOC_ORDER[index - 1] : undefined;
  const next = index >= 0 && index < DOC_ORDER.length - 1 ? DOC_ORDER[index + 1] : undefined;

  const copy = async () => {
    const page = document.querySelector(".proto-docs-main");
    let text = title;
    if (page) {
      const clone = page.cloneNode(true) as HTMLElement;
      // The actions live inside the page body; they are not page content.
      clone.querySelectorAll("[data-docs-actions]").forEach((node) => node.remove());
      clone
        .querySelectorAll("h1, h2, h3, h4, p, li, pre, [class*='proto-code'], .proto-step strong")
        .forEach((node) => node.append("\n"));
      text = (clone.textContent ?? "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context) — leave the label unchanged.
    }
  };

  return (
    <div className="proto-docs-head">
      <h1 className={className}>{title}</h1>
      <div className="proto-docs-actions" data-docs-actions>
        <button type="button" className="proto-docs-copy" onClick={copy} aria-label="Copy page">
          {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          <span>{copied ? "Copied" : "Copy Page"}</span>
        </button>
        <div className="proto-docs-pager" role="group" aria-label="Docs navigation">
          {prev !== undefined ? (
            <Link href={`${base}${prev}`} aria-label="Previous page" title="Previous page">
              <ChevronLeft size={16} aria-hidden="true" />
            </Link>
          ) : (
            <button type="button" aria-label="Previous page" title="Previous page" disabled>
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
          )}
          {next !== undefined ? (
            <Link href={`${base}${next}`} aria-label="Next page" title="Next page">
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          ) : (
            <button type="button" aria-label="Next page" title="Next page" disabled>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
