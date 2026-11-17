"use client";

import type { CSSProperties } from "react";
import type { DnaPalette } from "@arche/registry-core";

/**
 * Mini component preview per palette option (Brief: prompt-adherence Part 6).
 * Renders a button + card + text on a surface — never a single color swatch —
 * so accent-only (Loud Signal) and neutral-only (Quiet Ground) options are
 * visibly distinct whenever their underlying anchors differ.
 *
 * Illustrative fills (fixed lightness/chroma, option hues): the compiler
 * owns real tokens; this preview only needs to separate the three options.
 */
export function PaletteOptionPreview({ anchors }: { anchors: DnaPalette }) {
  const surface: CSSProperties = {
    backgroundColor: `oklch(0.95 0.02 ${anchors.neutralHue})`,
  };
  const title: CSSProperties = {
    color: `oklch(0.3 0.02 ${anchors.neutralHue})`,
  };
  const primaryBtn: CSSProperties = {
    backgroundColor: `oklch(0.55 0.16 ${anchors.primaryHue})`,
    color: "white",
  };
  const accentPill: CSSProperties = {
    backgroundColor: `oklch(0.62 0.16 ${anchors.accentHue})`,
    color: "white",
  };
  // Brand Token brief: the style-page preview also separates the brand
  // anchor, so a loud brand on a quiet trio reads as its own swatch.
  const brandHue = anchors.brandHue ?? anchors.primaryHue;
  const brandPill: CSSProperties = {
    backgroundColor: `oklch(0.56 0.16 ${brandHue})`,
    color: "white",
  };
  const muted: CSSProperties = {
    color: `oklch(0.55 0.03 ${anchors.neutralHue})`,
  };
  return (
    <span
      aria-hidden
      data-testid="palette-option-preview"
      data-primary-hue={anchors.primaryHue}
      data-accent-hue={anchors.accentHue}
      data-neutral-hue={anchors.neutralHue}
      data-brand-hue={anchors.brandHue ?? anchors.primaryHue}
      className="flex flex-col gap-1.5 rounded-md border border-border p-2.5"
      style={surface}
    >
      <span className="text-xs font-semibold" style={title}>
        Gallery opening
      </span>
      <span className="text-[11px] leading-snug" style={muted}>
        Twelve new works on the quiet wall.
      </span>
      <span className="mt-0.5 flex items-center gap-1.5">
        <span className="rounded-full px-2.5 py-1 text-[11px] font-medium" style={primaryBtn}>
          Reserve
        </span>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={accentPill}>
          New
        </span>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={brandPill}>
          Sale
        </span>
      </span>
    </span>
  );
}
