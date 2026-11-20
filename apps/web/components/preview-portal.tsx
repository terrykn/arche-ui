"use client";

import * as React from "react";

/**
 * Portal target for overlay previews (dialog, popover, tooltip, …) rendered
 * inside a themed wrapper. Radix portals mount into document.body by default,
 * which escapes the library token scope — the opened surface would inherit
 * the app theme instead of the edited library. Mounting this host inside the
 * themed tree and passing its element as `container` keeps overlay previews
 * on the library tokens. Outside a host (docs, public pages) the context is
 * null and components fall back to document.body as before.
 */
export const PreviewPortalContext = React.createContext<HTMLElement | null>(null);

export function PreviewPortalHost({ children }: { children: React.ReactNode }) {
  const [host, setHost] = React.useState<HTMLElement | null>(null);
  return (
    <PreviewPortalContext.Provider value={host}>
      <span ref={setHost} style={{ display: "contents" }} />
      {children}
    </PreviewPortalContext.Provider>
  );
}
