"use client";

import { GeneratedBlockPreview, hasGeneratedBlockPreview } from "@/components/block-previews.generated";

/**
 * Live block preview: every catalog block is aggregator-sourced and ships its
 * own self-contained demo component, rendered by the generated lazy map under
 * the site's active identity. `axes` is accepted for callers that still pass
 * axis selections; aggregated blocks have no variant axes to apply.
 */
export function BlockPreview({ name }: { name: string; axes?: Record<string, string> }) {
  if (hasGeneratedBlockPreview(name)) return <GeneratedBlockPreview name={name} />;
  return (
    <p className="text-sm text-muted-foreground">
      Unknown block “{name}”.
    </p>
  );
}
