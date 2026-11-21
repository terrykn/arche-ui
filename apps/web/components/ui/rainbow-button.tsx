/** GENERATED from the Default identity (fixtures/identity.default.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
import type * as React from "react"
import { cn } from "@/lib/utils";

interface RainbowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Seconds for one full colour cycle */
  speed?: number;
  children: React.ReactNode;
}

/**
 * CTA with a colour ramp that cycles through the brand gradient and casts a
 * matching glow beneath it. Zero dependencies — the motion is one keyframe.
 */
export function RainbowButton({
  speed = 4,
  children,
  className,
  style,
  ...props
}: RainbowButtonProps) {
  return (
    <button
      {...props}
      data-slot="rainbow-button"
      style={{ "--rainbow-duration": `${speed}s`, ...style } as React.CSSProperties}
      className={cn(
        "group/rainbow relative inline-flex h-(--rainbow-button-height,2.75rem) cursor-pointer items-center justify-center rounded-xl px-6 text-sm font-medium text-brand-foreground transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        // The ramp itself, plus a blurred copy behind it for the glow.
        "motion-safe:animate-[arche-rainbow_var(--rainbow-duration,4s)_linear_infinite] bg-[linear-gradient(90deg,var(--brand),color-mix(in_oklab,var(--brand)_75%,var(--primary)),color-mix(in_oklab,var(--brand)_75%,var(--chart-3)),color-mix(in_oklab,var(--brand)_75%,var(--primary)),var(--brand))] bg-[length:200%_100%]",
        "before:absolute before:inset-x-3 before:-bottom-1 before:-z-10 before:h-full motion-safe:before:animate-[arche-rainbow_var(--rainbow-duration,4s)_linear_infinite] before:bg-[linear-gradient(90deg,var(--brand),color-mix(in_oklab,var(--brand)_75%,var(--primary)),color-mix(in_oklab,var(--brand)_75%,var(--chart-3)),color-mix(in_oklab,var(--brand)_75%,var(--primary)),var(--brand))] before:bg-[length:200%_100%] before:blur-lg before:transition-opacity before:content-[''] before:opacity-60 hover:before:opacity-90",
        className
      )}
    >
      <style href="arche-rainbow" precedence="medium">{"@keyframes arche-rainbow{from{background-position:0% 50%}to{background-position:200% 50%}}"}</style>
      {children}
    </button>
  );
}
