"use client";

import * as React from "react";
import { SINK_EXAMPLES } from "@/components/sink-examples";
import { RegistryExample, hasRegistryExample } from "@/components/registry-example";
import { ComponentDemo, hasComponentDemo } from "@/components/component-demos";

/**
 * Live preview per doc component id. Definitions live in
 * sink-examples.tsx — the same source the enterprise demo renders.
 */
export function DocPreview({ id }: { id: string }) {
  if (hasRegistryExample(id)) return <RegistryExample name={id} />;
  if (SINK_EXAMPLES[id]) return <>{SINK_EXAMPLES[id]}</>;
  if (hasComponentDemo(id)) return <ComponentDemo name={id} />;
  return null;
}
