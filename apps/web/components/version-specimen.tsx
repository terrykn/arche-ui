"use client";

import * as React from "react";

/**
 * Versioned specimen image (Part 5.1/5.3): renders a publish-pipeline asset
 * URL and hides itself when the version predates captures (v1 of older
 * libraries) — no broken-image icons, no invented placeholders.
 */
export function VersionSpecimen({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [missing, setMissing] = React.useState(false);
  if (missing) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setMissing(true)} loading="lazy" />;
}

