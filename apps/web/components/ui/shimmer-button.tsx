/** GENERATED from the Default identity (fixtures/identity.default.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
import type * as React from "react"
import { cn } from "@/lib/utils";

interface ShimmerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function ShimmerButton({
  className,
  children,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      data-slot="shimmer-button"
      className={cn(
        "group/shimmer relative inline-flex h-(--shimmer-button-height,3rem) cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-(--shimmer-button-corner-shape,624.9375rem) bg-primary px-8 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-[transform,box-shadow] duration-(--motion-normal-duration) hover:scale-[1.03] hover:shadow-xl hover:shadow-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98]",
        className
      )}
      {...props}
    >
      <style href="arche-shimmer" precedence="medium">{"@keyframes arche-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}"}</style>
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
      <span
        aria-hidden
        className="motion-safe:animate-[arche-shimmer_2.5s_linear_infinite] absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,color-mix(in_oklab,var(--primary-foreground)_35%,transparent)_50%,transparent_70%)] bg-[length:250%_100%]"
      />
    </button>
  );
}
