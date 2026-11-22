"use client";

import type { CSSProperties } from "react";
import type { PalettePreviewSwatches, TypefacePreviewFace } from "@/lib/generation/service";
import { stylesheetUrl } from "./typeface-option-preview";

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
/** Skeleton bar in a palette color: the card, its background and its
 *  colors stay intact while loading — only the text goes to pulse. */
function Bar({ color, className, style }: { color: string; className?: string; style?: CSSProperties }) {
  return (
    <span
      aria-hidden
      className={`block animate-pulse rounded ${className ?? ""}`}
      style={{ backgroundColor: color, opacity: 0.25, ...style }}
    />
  );
}

export function MiniSystemPreview({
  swatches,
  size = "compact",
  label,
  displayFont,
  bodyFont,
  loading,
}: {
  swatches: PalettePreviewSwatches;
  size?: "compact" | "full";
  /** Accessible name for the surface (defaults to a generic sample page). */
  label?: string;
  /** Picked typeface pair: hero + deal number render the display face,
   *  everything else the body face (same loader as the specimens). */
  displayFont?: TypefacePreviewFace;
  bodyFont?: TypefacePreviewFace;
  /** Recompiling: text swaps to palette-colored pulse bars; layout,
   *  backgrounds and colors stay put, then the fresh text lands with
   *  the fresh colors. */
  loading?: boolean;
}) {
  const full = size === "full";
  // Shape comes from the emitted tokens (words-step preview): radius and
  // border width recompile live off the word history; the root stays
  // borderless by design — borders render on the buttons, never the frame.
  const radius = swatches.radius ?? "0.625rem";
  const borderWidth = swatches.borderWidth ?? "1px";
  const shadow = swatches.shadow && swatches.shadow !== "none" ? swatches.shadow : undefined;
  const surface: CSSProperties = {
    backgroundColor: swatches.surface,
    color: swatches.surfaceText,
    borderColor: swatches.surfaceText,
    borderRadius: radius,
  };
  const displayUrl = displayFont ? stylesheetUrl(displayFont) : null;
  const bodyUrl = bodyFont ? stylesheetUrl(bodyFont) : null;
  const displayType: CSSProperties = displayFont ? { fontFamily: displayFont.stack } : {};
  const bodyType: CSSProperties = bodyFont ? { fontFamily: bodyFont.stack } : {};
  const muted: CSSProperties = { color: swatches.secondaryText };
  const focal: CSSProperties = { color: swatches.brand };
  const primaryButton: CSSProperties = {
    backgroundColor: swatches.primary,
    color: swatches.onPrimary,
    borderRadius: radius,
  };
  const secondaryButton: CSSProperties = {
    backgroundColor: swatches.secondary,
    color: swatches.secondaryText,
    borderRadius: radius,
  };
  // Brand deal card: the solid runs the full height and every word on it
  // is set in the emitted brand foreground (--brand-foreground), never the
  // surface text. The action inverts the pair (brand-foreground ground,
  // brand ink) so it always clears AA on the solid — the accent family
  // would clash with the brand here, so it stays out of this card.
  const brandInk: CSSProperties = { color: swatches.onBrand };
  // The borders voice lives on the deal card now that the buttons are
  // borderless: width from the winning borders slot, ink that always
  // clears AA on the solid.
  const dealCard: CSSProperties = {
    backgroundColor: swatches.brand,
    color: swatches.onBrand,
    borderTop: `${borderWidth} solid ${swatches.onBrand}`,
    borderRight: `${borderWidth} solid ${swatches.onBrand}`,
    borderBottom: `${borderWidth} solid ${swatches.onBrand}`,
    borderLeft: `8px solid ${swatches.accent}`,
    boxShadow: shadow,
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
      aria-busy={loading || undefined}
      role="img"
      className="flex items-stretch overflow-hidden rounded-md border border-border opacity-95"
      style={{ ...surface, ...bodyType }}
    >
      {displayUrl ? <link rel="stylesheet" href={displayUrl} /> : null}
      {bodyUrl && bodyUrl !== displayUrl ? <link rel="stylesheet" href={bodyUrl} /> : null}
      <span
        className={`flex min-w-0 flex-1 flex-col justify-between ${
          full ? "gap-3 p-4" : "gap-2 p-3"
        }`}
      >
        <span
          className={`font-semibold uppercase tracking-[0.18em] ${
            full ? "text-xs" : "text-[9px]"
          }`}
          style={muted}
        >
          {loading ? <Bar color={swatches.secondaryText} style={{ height: "1lh", width: "4rem" }} /> : "Acme"}
        </span>          <span className={`font-display font-bold leading-tight ${full ? "text-3xl" : "text-sm"}`} style={displayType}>
            {loading ? (
              <Bar color={swatches.surfaceText} style={{ height: "1lh", width: "75%" }} />
            ) : (
              <>Reserve your{" "}<span style={focal}>seat</span></>
            )}
          </span>
        <span className={`flex flex-wrap items-center ${full ? "gap-2" : "gap-1.5"}`}>
          <span
            className={`rounded-md font-medium ${
              full ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-[10px]"
            }`}
            style={primaryButton}
          >
            {loading ? <Bar color={swatches.onPrimary} style={{ height: "1lh", width: "3.5rem" }} /> : "Reserve"}
          </span>
          <span
            className={`rounded-md font-medium ${
              full ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-[10px]"
            }`}
            style={secondaryButton}
          >
            {loading ? <Bar color={swatches.secondaryText} style={{ height: "1lh", width: "3.5rem" }} /> : "About Us"}
          </span>
        </span>
      </span>
      <span
        className={`flex shrink-0 flex-col items-center justify-center text-center ${
          full ? "w-48 gap-1.5 p-4" : "w-36 gap-1.5 p-3"
        }`}
        style={dealCard}
      >
        <span className={`flex flex-col items-center ${full ? "gap-1.5" : "gap-1"}`}>
          <span
            className={`font-medium leading-tight ${full ? "text-xs" : "text-[10px]"}`}
            style={brandInk}
          >
            {loading ? <Bar color={swatches.onBrand} style={{ height: "1lh", width: "5rem" }} /> : "Limited Time Deal"}
          </span>
          <span
            className={`font-display font-bold leading-none ${
              full ? "text-4xl" : "text-[1.75rem]"
            }`}
            style={{ ...brandInk, ...displayType }}
          >
            {loading ? <Bar color={swatches.onBrand} style={{ height: "1lh", width: "6rem" }} /> : "20% off"}
          </span>
        </span>
      </span>
    </span>
  );
}
