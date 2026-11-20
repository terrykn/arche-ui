import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The one place page gutters are defined.
 *
 * Every page renders its content inside this container, so horizontal padding
 * can never be forgotten or hand-rolled with a different value per page. Pages
 * only choose a content width and (optionally) their own vertical padding.
 *
 * `.proto-wrap` in app/proto.css stays the CSS twin used by the marketing
 * shell (home, about, pricing, …); both apply the same mobile gutter.
 */
const WIDTHS = {
  /** Auth and other single-field screens. */
  narrow: "max-w-sm",
  /** Short confirmation / authorization screens. */
  form: "max-w-md",
  /** Long-form reading (one component or block). */
  prose: "max-w-3xl",
  /** Catalog detail with previews. */
  content: "max-w-4xl",
  /** Indexes and dashboard pages. */
  wide: "max-w-6xl",
  /** Full public site width, matching `.proto-wrap`. */
  full: "max-w-[1180px]",
} as const;

export type PageWidth = keyof typeof WIDTHS;

type PageContainerProps = React.HTMLAttributes<HTMLElement> & {
  width?: PageWidth;
  as?: "main" | "div";
};

export function PageContainer({
  width = "wide",
  as: Tag = "main",
  className,
  ...props
}: PageContainerProps) {
  return <Tag className={cn("mx-auto w-full px-4 sm:px-6", WIDTHS[width], className)} {...props} />;
}
