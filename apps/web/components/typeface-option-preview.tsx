"use client";

import type { CSSProperties } from "react";
import type { TypefacePreviewOption } from "@/lib/generation/service";

/**
 * Typography specimen: the variant's real header + body stacks rendered as
 * a headline and a paragraph. Fontshare faces load through their official
 * stylesheets; Google faces load through the Google Fonts CSS API; anything
 * else falls back to the stack's system fallbacks (the family name still
 * shows the intent).
 */
function stylesheetUrl(face: { family: string; cssUrl: string | null }): string | null {
  if (face.cssUrl) return face.cssUrl;
  const family = face.family.trim().replace(/\s+/g, "+");
  if (!family) return null;
  return `https://fonts.googleapis.com/css2?family=${family}:wght@400;500;600;700&display=swap`;
}

export function TypefaceOptionPreview({ option }: { option: TypefacePreviewOption }) {
  const headerUrl = stylesheetUrl(option.display);
  const bodyUrl = stylesheetUrl(option.body);
  const headerStyle: CSSProperties = { fontFamily: option.display.stack };
  const bodyStyle: CSSProperties = { fontFamily: option.body.stack };
  return (
    <span className="flex flex-col gap-2 rounded-md border border-border bg-card p-3" data-testid="typeface-option-preview">
      {headerUrl ? <link rel="stylesheet" href={headerUrl} /> : null}
      {bodyUrl && bodyUrl !== headerUrl ? <link rel="stylesheet" href={bodyUrl} /> : null}
      <span aria-hidden className="text-xl font-semibold leading-tight tracking-tight" style={headerStyle}>
        Design with intent
      </span>
      <span aria-hidden className="text-[13px] leading-relaxed text-muted-foreground" style={bodyStyle}>
        The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
      </span>
      <span className="text-xs text-muted-foreground">
        {option.display.family} <span aria-hidden>·</span> {option.body.family}
      </span>
    </span>
  );
}
