import type * as React from "react"
import { cn } from "./lib/utils.js";

interface MovingBorderProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Seconds for one lap of the border-(length:--border-width) */
  duration?: number;
  /** Length of the travelling light, in px */
  size?: number;
  /** Corner radius of the border-(length:--border-width) path, in px */
  radius?: number;
  children: React.ReactNode;
}

/**
 * Button with a light that laps its border, driven by `offset-path`.
 * Zero dependencies — one keyframe does the whole thing.
 */
export function MovingBorder({
  duration = 4,
  size = 90,
  radius = 12,
  children,
  className,
  style,
  ...props
}: MovingBorderProps) {
  return (
    <button
      {...props}
      data-slot="moving-border"
      style={
        {
          "--mb-duration": `${duration}s`,
          "--mb-size": `${size}px`,
          "--mb-radius": `${radius}px`,
          borderRadius: radius,
          ...style,
        } as React.CSSProperties
      }
      className={cn(
        "relative inline-flex h-11 cursor-pointer items-center justify-center overflow-hidden bg-background p-px text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50",
        className
      )}
    >
      {/* Under reduced motion the light is replaced by a static glow on two
          opposite corners, showing through the same hairline gap. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 motion-reduce:bg-[linear-gradient(135deg,color-mix(in_oklab,var(--brand)_75%,var(--primary)),transparent_35%,transparent_65%,color-mix(in_oklab,var(--brand)_75%,var(--primary)))]"
      >
        <span
          className="absolute aspect-square w-(--mb-size) bg-[radial-gradient(circle,color-mix(in_oklab,var(--brand)_75%,var(--primary)),transparent_65%)] motion-safe:animate-moving-border motion-reduce:hidden"
          style={{
            offsetPath: `rect(0 auto auto 0 round var(--mb-radius))`,
          }}
        />
      </span>
      <span className="relative z-10 flex h-full w-full items-center justify-center rounded-[inherit] border-(length:--border-width) bg-background px-6">
        {children}
      </span>
    </button>
  );
}
