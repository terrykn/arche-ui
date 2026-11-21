/** GENERATED from the Default identity (fixtures/identity.default.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";

import type * as React from "react"

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  /** Size of the beam in px */
  size?: number;
  /** Seconds for one full loop */
  duration?: number;
  /** Seconds of delay before starting */
  delay?: number;
  reverse?: boolean;
  colorFrom?: string;
  colorTo?: string;
}

/**
 * Animated beam that travels around the border-(length:--border-width) of its nearest
 * positioned ancestor. Parent needs `position: relative` and a border.
 */
export function BorderBeam({
  className,
  size = 64,
  duration = 6,
  delay = 0,
  reverse = false,
  colorFrom = "var(--brand)",
  colorTo = "color-mix(in_oklab,var(--brand)_75%,var(--chart-3))",
}: BorderBeamProps) {
  // Hide via CSS + skip the animation under reduced motion; never branch the
  // rendered tree on it — the server can't know the preference and would
  // mismatch on hydration.
  const reducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden
      data-slot="border-beam"
      className="pointer-events-none absolute inset-0 rounded-[inherit] border-(length:--border-width) border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(black,black)] motion-reduce:hidden"
    >
      <motion.div
        className={cn(
          "absolute aspect-square bg-gradient-to-l from-(--beam-from) via-(--beam-to) to-transparent",
          className
        )}
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
            "--beam-from": colorFrom,
            "--beam-to": colorTo,
          } as React.CSSProperties
        }
        initial={{ offsetDistance: reverse ? "100%" : "0%" }}
        animate={
          reducedMotion
            ? undefined
            : { offsetDistance: reverse ? "0%" : "100%" }
        }
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration,
          delay: -delay,
        }}
      />
    </div>
  );
}
