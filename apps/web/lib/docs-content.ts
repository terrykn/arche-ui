import type { DocsBlockName } from "@/components/docs/registry";

/**
 * A docs page is pure data: a title, an optional lede, and an ordered list of
 * blocks. A block is either markdown (rendered at build/request time on the
 * server) or a named custom component from the single registry in
 * components/docs/registry.tsx — used for layouts markdown can't express,
 * like interactive install tabs or manifest-driven indexes.
 */
export type DocsBlock =
  | { kind: "markdown"; body: string }
  | { kind: "code"; code: string; caption?: string }
  | { kind: "steps"; items: Array<{ title: string; body: string }> }
  | { kind: "cards"; items: Array<{ title: string; body: string }> }
  | { kind: "callout"; body: string; link?: { label: string; path: string } }
  | { kind: "component"; name: DocsBlockName; props?: Record<string, unknown> };

export type DocsPageData = {
  /** Docs path relative to the docs base: "" for the index, "/quick-start", … */
  slug: string;
  title: string;
  lede?: string;
  blocks: DocsBlock[];
};
