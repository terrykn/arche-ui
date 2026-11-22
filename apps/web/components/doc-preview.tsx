"use client";

import * as React from "react";
import { SINK_EXAMPLES, SINK_EXAMPLES_COMPACT } from "@/components/sink-examples";
import { RegistryExample, hasRegistryExample } from "@/components/registry-example";
import { ComponentDemo, hasComponentDemo } from "@/components/component-demos";
import { PreviewBoundary } from "@/components/preview-boundary";

/**
 * Live preview per doc component id. Definitions live in
 * sink-examples.tsx — the same source the enterprise demo renders.
 *
 * Wrapped in its own boundary: the indexes render every entry at once, so one
 * preview that throws must not take the page down with it.
 */
export function DocPreview({ id, compact = false }: { id: string; compact?: boolean }) {
  return (
    <PreviewBoundary name={id}>
      <PreviewContent id={id} compact={compact} />
    </PreviewBoundary>
  );
}

function PreviewContent({ id, compact }: { id: string; compact: boolean }) {
  // Small index cards show one variant instead of the full matrix.
  if (compact && SINK_EXAMPLES_COMPACT[id]) return <>{SINK_EXAMPLES_COMPACT[id]}</>;
  if (hasRegistryExample(id)) return <RegistryExample name={id} compact={compact} />;
  if (SINK_EXAMPLES[id]) return <>{SINK_EXAMPLES[id]}</>;
  if (hasComponentDemo(id)) return <ComponentDemo name={id} />;
  return null;
}
