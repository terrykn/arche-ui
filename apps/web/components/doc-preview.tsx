"use client";

import * as React from "react";
import { SINK_EXAMPLES } from "@/components/sink-examples";

/**
 * Live preview per doc component id. Definitions live in
 * sink-examples.tsx — the same source the enterprise demo renders.
 */
export function DocPreview({ id }: { id: string }) {
  return <>{SINK_EXAMPLES[id] ?? null}</>;
}
