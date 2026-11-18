"use client";

import type { CSSProperties } from "react";
import type { PalettePreviewSwatches } from "@/lib/generation/service";

/**
 * The picker's mini component (palette + brand rows).
 *
 * Never a lone swatch: every option is previewed as a small real component —
 * a sample page with wordmark, hero line (focal word in the brand color),
 * primary and secondary buttons, plus the primary focal: a brand-solid deal
 * card running the full height of the preview with its accent action.
 * A primary-only swatch is identical across remixes by construction; the
 * composed component is what makes three options visibly different.
 *
 * Values come from the compiled payload (emitted light-mode tokens), never
 * from illustrative fills, so what the preview shows is what the draft gets.
 */
export function MiniSystemPreview({
  swatches,
  size = "compact",
  label,
}: {
  swatches: PalettePreviewSwatches;
  size?: "compact" | "full";
  /** Accessible name for the surface (defaults to a generic sample page). */
  label?: string;
}) {
  const full = size === "full";
  const surface: CSSProperties = {
    backgroundColor: swatches.surface,
    color: swatches.surfaceText,
    borderColor: swatches.surfaceText,
  };
  const muted: CSSProperties = { color: swatches.secondaryText };
  const focal: CSSProperties = { color: swatches.brand };
  const primaryButton: CSSProperties = {
    backgroundColor: swatches.primary,
    color: swatches.onPrimary,
  };
  const secondaryButton: CSSProperties = {
    backgroundColor: swatches.secondary,
    color: swatches.secondaryText,
  };
  const dealCard: CSSProperties = {
    backgroundColor: swatches.brand,
    color: swatches.onBrand,
  };
  const dealButton: CSSProperties = {
    backgroundColor: swatches.accent,
    color: swatches.onAccent,
  };
  return (
    <span
      data-testid="mini-system-preview"
      data-size={size}
      data-brand={swatches.brand}
      data-brand-foreground={swatches.onBrand}
      data-primary={swatches.primary}
      data-surface={swatches.surface}
      aria-label={label ?? "Identity preview"}
      role="img"
      className="flex items-stretch overflow-hidden rounded-md border opacity-95"
      style={surface}
    >
      <span
        className={`flex min-w-0 flex-1 flex-col justify-between ${
          full ? "gap-4 p-5" : "gap-2 p-3"
        }`}
      >
        <span
          className={`font-semibold uppercase tracking-[0.18em] ${
            full ? "text-[11px]" : "text-[9px]"
          }`}
          style={muted}
        >
          Acme
        </span>          <span className={`font-display font-bold leading-tight ${full ? "text-2xl" : "text-sm"}`}>
            Reserve your{" "}
            <span style={focal}>seat</span>
          </span>
        <span className={`flex flex-wrap items-center ${full ? "gap-2" : "gap-1.5"}`}>
          <span
            className={`rounded-md font-medium ${
              full ? "px-3.5 py-1.5 text-sm" : "px-2 py-0.5 text-[10px]"
            }`}
            style={primaryButton}
          >
            Reserve
          </span>
          <span
            className={`rounded-md font-medium ${
              full ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-[10px]"
            }`}
            style={secondaryButton}
          >
            About Us
          </span>
        </span>
      </span>
      <span
        className={`flex shrink-0 flex-col justify-between ${
          full ? "w-44 gap-4 p-5" : "w-32 gap-2.5 p-3"
        }`}
        style={dealCard}
      >
        <span className={`flex flex-col ${full ? "gap-1.5" : "gap-1"}`}>
          <span className={`font-medium leading-tight ${full ? "text-sm" : "text-[10px]"}`}>
            Limited Time Deal
          </span>
          <span
            className={`font-display font-bold leading-none ${
              full ? "text-3xl" : "text-xl"
            }`}
          >
            20% off
          </span>
        </span>
        <span
          className={`rounded-full text-center font-medium leading-tight ${
            full ? "px-3 py-1.5 text-sm" : "px-2 py-1 text-[11px]"
          }`}
          style={dealButton}
        >
          Check availability
        </span>
      </span>
    </span>
  );
}
