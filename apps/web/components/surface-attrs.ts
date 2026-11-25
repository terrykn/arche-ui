import * as React from "react";
import { isSurfaceId } from "@arche-ui/foundation/dna";
import type { SurfaceId } from "@arche-ui/foundation/dna";

/**
 * Surface scope attributes — the single bridge between the identity's global
 * surface tokens (`--surface-card`, plus the photo/scrim globals) and the
 * static recipes in `apps/web/app/surfaces.css`.
 *
 * Any preview scope that carries the library tokens (editor PreviewFrame,
 * expanded-block dialog, /preview shell, docs frames) spreads these
 * attributes onto the same element that carries the token vars. The CSS then
 * paints the card slot from the token values — one sidebar edit reaches all
 * cards with no per-component code.
 *
 * Block backgrounds are per-block, not global: each block preview hook
 * carries its own `data-surface-page` attribute (the block's choice, or
 * nothing for the identity background) and the same recipes paint it.
 *
 * Unknown or missing values fall back to `flat` (a solid token color), so the
 * helper never throws and switching identities always resets the previous
 * treatment.
 */

export type SurfaceScopeAttributes = {
  "data-surface-card": SurfaceId;
  /** Readability veil over the photo treatments ("on" by default). */
  "data-surface-scrim": "on" | "off";
};

const SURFACE_TOKENS = {
  "data-surface-card": "--surface-card",
} as const;

function surfaceIdFrom(vars: Record<string, unknown> | undefined, token: string): SurfaceId {
  const value = vars?.[token];
  return isSurfaceId(value) ? value : "flat";
}

/** Read the surface tokens out of a token-vars record (style or vars). */
export function surfaceScopeAttrs(
  vars: React.CSSProperties | Record<string, string> | undefined,
): SurfaceScopeAttributes {
  const record = vars as Record<string, unknown> | undefined;
  return {
    "data-surface-card": surfaceIdFrom(record, SURFACE_TOKENS["data-surface-card"]),
    "data-surface-scrim": record?.["--surface-photo-scrim"] === "off" ? "off" : "on",
  };
}

/**
 * Per-block background attribute for a block preview hook. Valid choices
 * become the hook's own `data-surface-page` (painted flush by the shared
 * recipes); anything else yields no attribute, leaving the identity
 * background to show through.
 */
export function blockBackgroundAttr(value: unknown): { "data-surface-page": SurfaceId } | Record<string, never> {
  return isSurfaceId(value) ? { "data-surface-page": value } : {};
}

/**
 * Structural slot a preview item demonstrates. Blocks preview as a section
 * (or a band for full-bleed CTA strips); bare components preview as page —
 * there is no section container around them, so only the page background
 * applies and the section treatment cannot misfire.
 */
export type SurfaceSlot = "page" | "section" | "band";

/**
 * Which structural slot a catalog block demonstrates. CTA-section blocks are
 * bands (full-bleed strips); everything else previews as a section. Kept next
 * to the attrs helper so editor, docs, and /preview agree.
 */
export function surfaceSlotForBlock(sectionKey: string | undefined): "section" | "band" {
  return sectionKey === "CTA" ? "band" : "section";
}
