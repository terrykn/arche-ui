"use client";

import type { CSSProperties } from "react";
import type { PalettePreviewSwatches } from "@/lib/generation/service";

/**
 * The picker's mini component (palette + brand rows).
 *
 * Never a lone swatch: every option is previewed as a small real component on
 * a surface — wordmark, hero focal word in the brand color, the solid action
 * button, the brand button, and a badge. A primary-only swatch is identical
 * across remixes by construction; the composed component is what makes three
 * options visibly different.
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
  const brandText: CSSProperties = { color: swatches.brand };
  const primaryButton: CSSProperties = {
    backgroundColor: swatches.primary,
    color: swatches.onPrimary,
  };
  const brandButton: CSSProperties = {
    backgroundColor: swatches.brand,
    color: swatches.onBrand,
  };
  const badge: CSSProperties = {
    backgroundColor: swatches.brandSoft,
    color: swatches.brandSoftText,
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
      className={`flex flex-col justify-between rounded-md border opacity-95 ${
        full ? "min-h-[172px] gap-3 p-5" : "gap-1.5 p-3"
      }`}
      style={surface}
    >
      <span
        className={`font-semibold uppercase tracking-[0.18em] ${
          full ? "text-[11px]" : "text-[9px]"
        }`}
        style={muted}
      >
        Arche
      </span>
      <span className={`font-display leading-tight ${full ? "text-2xl" : "text-sm"}`}>
        Reserve your <span style={brandText}>evening</span>
      </span>
      <span className={`flex flex-wrap items-center ${full ? "gap-2" : "gap-1.5"}`}>
        <span
          className={`rounded-md font-medium ${
            full ? "px-3.5 py-1.5 text-sm" : "px-2 py-0.5 text-[10px]"
          }`}
          style={brandButton}
        >
          Reserve
        </span>
        <span
          className={`rounded-md font-medium ${
            full ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-[10px]"
          }`}
          style={primaryButton}
        >
          Details
        </span>
        <span
          className={`rounded-full font-medium ${
            full ? "px-2.5 py-1 text-xs" : "px-1.5 py-0.5 text-[9px]"
          }`}
          style={badge}
        >
          New season
        </span>
      </span>
    </span>
  );
}
