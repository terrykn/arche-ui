"use client";

import * as React from "react";

/**
 * Contains a single catalog preview. The indexes mount one live preview per
 * entry, so a component that throws (a demo missing its provider, a broken
 * lazy import) would otherwise trip the route's error boundary and blank the
 * whole page. Here it only blanks its own card.
 */
export class PreviewBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") console.error("Preview failed:", error);
  }

  render() {
    if (this.state.failed) {
      return <p className="text-xs text-muted-foreground">Preview unavailable</p>;
    }
    return this.props.children;
  }
}
