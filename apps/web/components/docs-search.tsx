"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useDocsBase } from "@/components/docs-base";
import { DOC_SEARCH_GROUPS } from "@/components/docs-nav";

type SearchItem = {
  heading: string;
  path: string;
  label: string;
};

const ITEMS: SearchItem[] = DOC_SEARCH_GROUPS.flatMap((group) =>
  group.links.map((link) => ({
    heading: group.heading,
    path: link.path,
    label: link.label,
  })),
);

function matches(item: SearchItem, query: string) {
  if (!query) return true;
  const haystack = `${item.label} ${item.heading} ${item.path}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

// Command-palette style docs search: trigger lives in the public nav, the
// panel is a centered dialog with keyboard navigation over every docs page.
export function DocsSearch() {
  const base = useDocsBase();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const results = React.useMemo(
    () => ITEMS.filter((item) => matches(item, query)),
    [query],
  );

  const close = React.useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  const openSearch = React.useCallback(() => {
    setOpen(true);
    setQuery("");
    setActive(0);
  }, []);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    // Keep the page behind the dialog from scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focus = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focus);
    };
  }, [open, close]);

  // Cmd/Ctrl+K opens search from anywhere on the site.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => {
          if (current) setQuery("");
          return !current;
        });
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    setActive(0);
  }, [query]);

  React.useEffect(() => {
    if (!open) return;
    const item = listRef.current?.querySelector<HTMLElement>(
      '[data-active="true"]',
    );
    item?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const go = (item: SearchItem) => {
    close();
    router.push(`${base}${item.path}`);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) =>
        results.length ? (current + 1) % results.length : 0,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) =>
        results.length ? (current - 1 + results.length) % results.length : 0,
      );
    } else if (event.key === "Enter") {
      const item = results[active];
      if (item) {
        event.preventDefault();
        go(item);
      }
    }
  };

  let cursor = -1;
  const grouped = DOC_SEARCH_GROUPS.map((group) => ({
    heading: group.heading,
    items: results.filter((item) => item.heading === group.heading),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      <button
        type="button"
        className="proto-search-trigger"
        onClick={openSearch}
        aria-haspopup="dialog"
        aria-label="Search"
      >
        <Search size={15} aria-hidden="true" />
        <span>Search</span>
        <kbd aria-hidden="true">⌘K</kbd>
      </button>
      {open && mounted
        ? createPortal(
            <div
              className="proto-search-backdrop"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) close();
              }}
            >
              <div
                className="proto-search-panel"
                role="dialog"
                aria-modal="true"
                aria-label="Search"
              >
                <div className="proto-search-field">
                  <Search size={18} aria-hidden="true" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={onInputKeyDown}
                    placeholder="Search the docs..."
                    aria-label="Search the docs"
                    role="combobox"
                    aria-expanded="true"
                    aria-controls="proto-search-results"
                    aria-autocomplete="list"
                    autoComplete="off"
                  />
                  <kbd>esc</kbd>
                </div>
                <div
                  className="proto-search-results"
                  id="proto-search-results"
                  role="listbox"
                  ref={listRef}
                >
                  {grouped.length === 0 ? (
                    <p className="proto-search-empty">
                      No pages match “{query}”.
                    </p>
                  ) : (
                    grouped.map((group) => (
                      <div
                        key={group.heading}
                        className="proto-search-group"
                        role="group"
                        aria-label={group.heading}
                      >
                        <p className="proto-search-group-label">
                          {group.heading}
                        </p>
                        {group.items.map((item) => {
                          cursor += 1;
                          const index = cursor;
                          const isActive = index === active;
                          return (
                            <Link
                              key={`${group.heading}${item.path}`}
                              href={`${base}${item.path}`}
                              role="option"
                              aria-selected={isActive}
                              data-active={isActive ? "true" : "false"}
                              className={`proto-search-item${isActive ? " active" : ""}`}
                              onMouseEnter={() => setActive(index)}
                              onClick={close}
                            >
                              <span>{item.label}</span>
                              <span className="proto-search-item-path">
                                {group.heading}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
                <div className="proto-search-foot" aria-hidden="true">
                  <span>
                    <kbd>↑</kbd>
                    <kbd>↓</kbd> to navigate
                  </span>
                  <span>
                    <kbd>↵</kbd> to open
                  </span>
                  <span>
                    <kbd>esc</kbd> to close
                  </span>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
