/** GENERATED from the Default identity (fixtures/identity.default.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
import type * as React from "react"
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Overall opacity of the aurora blobs */
  intensity?: "subtle" | "medium" | "vivid";
}

const intensityClass = {
  subtle: "opacity-25 dark:opacity-20",
  medium: "opacity-40 dark:opacity-30",
  vivid: "opacity-60 dark:opacity-45",
};

/**
 * Velora's signature animated aurora backdrop. Absolutely positioned —
 * place inside a `relative overflow-hidden` section.
 */
export function AuroraBackground({
  className,
  intensity = "medium",
  ...props
}: AuroraBackgroundProps) {
  return (
    <div
      aria-hidden
      data-slot="aurora-background"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        intensityClass[intensity],
        className
      )}
      {...props}
    >
      <div className="motion-safe:animate-aurora-1 absolute -top-1/4 left-[10%] size-[44rem] rounded-full bg-brand-from blur-[7.5rem] will-change-transform" />
      <div className="motion-safe:animate-aurora-2 absolute top-[5%] right-[5%] size-[38rem] rounded-full bg-brand-via blur-[8.125rem] will-change-transform" />
      <div className="motion-safe:animate-aurora-3 absolute -bottom-1/4 left-[35%] size-[40rem] rounded-full bg-brand-to blur-[8.75rem] will-change-transform" />
    </div>
  );
}
