"use client";

import type { PalettePreviewSwatches } from "@/lib/generation/service";

/**
 * Simple palette preview: just the colors, nothing else.
 * The option name + reason render above/below this in the picker step.
 */
export function PaletteVariantPreview({ swatches }: { swatches: PalettePreviewSwatches }) {
  const colors = [
    { label: "Background", value: swatches.surface },
    { label: "Primary", value: swatches.primary },
    { label: "Accent", value: swatches.accent },
    { label: "Brand", value: swatches.brand },
  ];
  return (
    <span
      aria-hidden
      data-testid="palette-variant-preview"
      className="flex gap-2"
    >
      {colors.map((color) => (
        <span
          key={color.label}
          title={color.label}
          className="h-14 flex-1 rounded-md border border-border"
          style={{ backgroundColor: color.value }}
        />
      ))}
    </span>
  );
}
