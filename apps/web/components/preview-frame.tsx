"use client";

import * as React from "react";
import { blockBackgroundAttr, surfaceScopeAttrs } from "@/components/surface-attrs";
import type { SurfaceSlot } from "@/components/surface-attrs";
import { PreviewPortalHost } from "@/components/preview-portal";
import { SourceCodeDialog } from "@/components/source-code-dialog";

/**
 * Preview box for catalog items — the identity editor and the docs render the
 * same frame so a component previews identically in both places.
 *
 * The canvas carries the library tokens (`style` and `.dark`), so its
 * `bg-background` is the identity background filling the whole preview box.
 * The box, its header, and everything outside the canvas use the app's own
 * theme, so library edits never restyle the editor chrome. Blocks span the
 * canvas edge to edge (`flush`); intrinsically sized component content stays
 * centered. Overlays mount inside it via PreviewPortalHost.
 *
 * Surfaces: the scope attributes (`data-surface-*`) are derived from the same
 * `style` record, so `apps/web/app/surfaces.css` paints card descendants
 * from the global card token. Block backgrounds are per-block: the content
 * wrapper carries the block's own `data-surface-page` (or nothing, leaving
 * the identity background), and the same recipes paint it flush.
 */
export function PreviewFrame({
  title,
  actions,
  children,
  style,
  dark = false,
  className,
  canvasClassName,
  contentClassName = "m-auto flex w-full max-w-full flex-col items-center justify-center",
  /** Which structural slot the previewed item demonstrates (default "page"). */
  surfaceSlot = "page",
  /**
   * Per-block background choice. When set, the content wrapper carries it as
   * its own `data-surface-page`; when unset the wrapper stays transparent
   * and the identity background shows through.
   */
  blockBackground,
  /**
   * Flush block mode: no canvas padding, wrapper spans edge to edge. Blocks
   * are standalone full views that handle their own spacing; the page surface
   * becomes their background with no gap to the frame.
   */
  flush = false,
  /** Copy-paste source button: item kind + name, shown left of the actions. */
  sourceKind,
  sourceName,
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
  dark?: boolean;
  className?: string;
  canvasClassName?: string;
  contentClassName?: string;
  surfaceSlot?: SurfaceSlot;
  sourceKind?: "component" | "block";
  sourceName?: string;
  flush?: boolean;
  blockBackground?: string;
}) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border border-border bg-background ${className ?? ""}`}
    >
      {title !== undefined || actions || (sourceKind && sourceName) ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-3 py-2">
          <p className="min-w-0 flex-1 truncate text-sm font-medium">{title}</p>
          {actions || (sourceKind && sourceName) ? (
            <span className="flex shrink-0 items-center gap-1">
              {sourceKind && sourceName ? <SourceCodeDialog kind={sourceKind} name={sourceName} /> : null}
              {actions}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-auto">
        <div
          style={style}
          {...surfaceScopeAttrs(style)}
          className={`relative flex min-h-full bg-background font-sans text-foreground ${dark ? "dark" : ""} ${flush ? "p-0" : "p-6"} ${canvasClassName ?? ""}`}
        >
          <PreviewPortalHost>
            <div
              className={flush ? "m-auto flex w-full flex-col items-center justify-center" : contentClassName}
              {...(surfaceSlot === "band"
                ? { "data-arche-band": "" }
                : surfaceSlot === "section"
                  ? { "data-arche-section": "" }
                  : {})}
              {...blockBackgroundAttr(blockBackground)}
            >
              {children}
            </div>
          </PreviewPortalHost>
        </div>
      </div>
    </div>
  );
}
