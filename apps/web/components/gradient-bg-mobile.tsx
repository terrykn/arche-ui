"use client";

import type { CSSProperties } from "react";

type GradientBgMobileProps = {
  className?: string;
  style?: CSSProperties;
  speed?: number;
  paused?: boolean;
};

// CSS-only stand-in for the canvas "Raspberry dusk" FLOW gradient in
// gradient-bg.tsx. Same palette and the same slow drift, but it is painted
// once and then only moved by compositor transforms, so a phone never runs
// the per-pixel JS loop that stalls the real one.
//
// Styles live in app/globals.css under "Mobile gradient background".
export default function GradientBgMobile({
  className,
  style,
  speed = 28,
  paused = false,
}: GradientBgMobileProps) {
  // The canvas engine treats speed as "higher is faster"; map the same dial
  // onto a CSS cycle length so callers keep passing their existing values.
  const clamped = Math.max(1, Math.min(100, speed));
  const duration = Math.round(36 * (28 / clamped));
  const still = paused || speed === 0;

  return (
    <div
      aria-hidden="true"
      className={className ? `arche-mg-root ${className}` : "arche-mg-root"}
      data-paused={still ? "true" : undefined}
      style={
        {
          "--arche-mg-duration": `${duration}s`,
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          backgroundColor: "#0B1B5B",
          backgroundImage:
            "linear-gradient(155deg, #0B1B5B 0%, #2E3FD1 46%, #6D3DF5 74%, #FF074E 100%)",
          contain: "paint",
          ...style,
        } as CSSProperties
      }
    >
      <div className="arche-mg-blob arche-mg-blob-raspberry" />
      <div className="arche-mg-blob arche-mg-blob-violet" />
      <div className="arche-mg-blob arche-mg-blob-blue" />
    </div>
  );
}
