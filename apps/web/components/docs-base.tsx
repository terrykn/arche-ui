"use client";

import * as React from "react";
import Link from "next/link";

// Base path for docs links: "/docs" on the public site, "/dashboard/docs" in
// the dashboard. Every docs page links through DocsLink so the same content
// component renders correct links in both places — the copy lives in exactly
// one file per page under app/docs.
const DocsBaseContext = React.createContext("/docs");

export function DocsBaseProvider({ base, children }: { base: string; children: React.ReactNode }) {
  return <DocsBaseContext.Provider value={base}>{children}</DocsBaseContext.Provider>;
}

export function useDocsBase() {
  return React.useContext(DocsBaseContext);
}

export function DocsLink({
  path,
  children,
  className,
  style,
}: {
  path: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const base = useDocsBase();
  return (
    <Link href={`${base}${path}`} className={className} style={style}>
      {children}
    </Link>
  );
}
