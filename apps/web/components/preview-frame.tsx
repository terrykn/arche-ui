"use client";

import * as React from "react";
import { PreviewPortalHost } from "@/components/preview-portal";

/**
 * Preview box for catalog items — the identity editor and the docs render the
 * same frame so a component previews identically in both places.
 *
 * Only the inner content wrapper carries the library tokens (`style` and
 * `.dark`): the box, its header and the canvas behind it all use the app's own
 * theme, so library edits never restyle the chrome. The content wrapper spans
 * the canvas so components that size off their parent (backgrounds, full-width
 * surfaces) have a box to fill; intrinsically sized content stays centered.
 * Overlays mount inside it via PreviewPortalHost.
 */
export function PreviewFrame({
  title,
  actions,
  children,
  style,
  dark = false,
  className,
  canvasClassName,
  contentClassName = "m-auto flex w-full max-w-full flex-col items-center",
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
  dark?: boolean;
  className?: string;
  canvasClassName?: string;
  contentClassName?: string;
}) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border border-border bg-background ${className ?? ""}`}
    >
      {title !== undefined || actions ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-3 py-2">
          <p className="min-w-0 flex-1 truncate text-sm font-medium">{title}</p>
          {actions ? <span className="flex shrink-0 items-center gap-1">{actions}</span> : null}
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-auto">
        <div
          style={style}
          className={`relative flex min-h-full bg-background p-6 font-sans text-foreground ${dark ? "dark" : ""} ${canvasClassName ?? ""}`}
        >
          <PreviewPortalHost>
            <div className={contentClassName}>{children}</div>
          </PreviewPortalHost>
        </div>
      </div>
    </div>
  );
}
