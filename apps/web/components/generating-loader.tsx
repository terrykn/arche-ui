"use client";

import { ArcheLogo } from "./arche-logo";

/**
 * Shared full-screen loader: blurs whatever is behind it, spins the logo,
 * and labels the wait. Used by the creation flow while the model call runs;
 * reusable anywhere else a blocking wait needs a branded cover.
 */
export function GeneratingLoader({ label = "Generating…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-background/60 backdrop-blur-md"
    >
      <span className="animate-[spin_3s_linear_infinite] drop-shadow-[0_0_24px_rgba(255,255,255,0.25)]">
        <ArcheLogo size={64} />
      </span>
      <p className="font-display text-lg text-foreground">{label}</p>
    </div>
  );
}
