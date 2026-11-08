"use client";

import * as React from "react";
import { SINK_BLOCKS } from "@/components/sink-blocks";

export interface SinkManifest {
  name: string;
  title: string;
  description: string;
  category: string;
  axes: Record<string, { values: Array<string | number>; default: string | number }>;
}

export interface SinkTypeStep {
  role: string;
  sizePx: number;
  lineHeight: number;
}

/**
 * Manifest-driven kitchen sink (Part 2): one section per manifest category,
 * one block per catalog component. Sections, order, and coverage come from
 * the manifests prop — adding a component to the catalog adds its section
 * with no sink code changes (its block renders from SINK_BLOCKS; a missing
 * block renders a flagged placeholder and fails the coverage check).
 */
export function KitchenSink({
  manifests,
  vars,
  mode = "light",
  typeSteps = [],
}: {
  manifests: SinkManifest[];
  vars: Record<string, string>;
  mode?: "light" | "dark";
  typeSteps?: SinkTypeStep[];
}) {
  const categories = React.useMemo(() => {
    const order: string[] = [];
    const byCategory = new Map<string, SinkManifest[]>();
    for (const manifest of manifests) {
      if (!byCategory.has(manifest.category)) {
        byCategory.set(manifest.category, []);
        order.push(manifest.category);
      }
      byCategory.get(manifest.category)!.push(manifest);
    }
    return order.map((category) => ({ category, items: byCategory.get(category)! }));
  }, [manifests]);

  const colorTokens = Object.entries(vars).filter(([, value]) => value.startsWith("oklch("));
  const chartTokens = colorTokens.filter(([name]) => name.startsWith("--chart-"));
  const surfaceTokens = colorTokens.filter(([name]) => !name.startsWith("--chart-"));
  const radius = vars["--radius"];
  const borderWidth = vars["--border-width"];

  return (
    <div className={mode === "dark" ? "dark" : ""}>
      <div style={vars as React.CSSProperties} className="bg-background text-foreground">
        <div className="flex gap-8">
          <div className="min-w-0 flex-1">
            <section aria-label="Foundation" className="border-b border-border py-5">
              <h3 className="text-base font-semibold">Foundation</h3>
              <p className="mt-1 text-sm text-muted-foreground">The active identity, one screen: tokens, type, radius, border width, charts.</p>
              <div className="mt-3 flex flex-wrap gap-2" aria-label="Color tokens">
                {surfaceTokens.map(([name, value]) => (
                  <span key={name} className="flex items-center gap-1.5 rounded-md border-(length:--border-width) border-border px-2 py-1 text-xs">
                    <span aria-hidden className="size-4 rounded-sm border-(length:--border-width) border-border" style={{ backgroundColor: `var(${name}, ${value})` }} />
                    {name}
                  </span>
                ))}
              </div>
              {typeSteps.length > 0 ? (
                <div className="mt-4 grid gap-2" aria-label="Type scale">
                  {typeSteps.map((step) => (
                    <p key={step.role} style={{ fontSize: `${step.sizePx}px`, lineHeight: step.lineHeight }}>
                      <span className="mr-2 font-mono text-xs text-muted-foreground">{step.role} · {step.sizePx}px</span>
                      The quick packer ships order {step.sizePx}.
                    </p>
                  ))}
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  radius
                  <span aria-hidden className="inline-block size-8 bg-primary" style={{ borderRadius: radius ? `var(--radius, ${radius})` : undefined }} />
                  <code>{radius ?? "—"}</code>
                </span>
                <span className="flex items-center gap-2">
                  border width
                  <span aria-hidden className="inline-block h-8 w-8 border-border" style={{ borderWidth: borderWidth ? `var(--border-width, ${borderWidth})` : undefined, borderStyle: "solid" }} />
                  <code>{borderWidth ?? "—"}</code>
                </span>
              </div>
              {chartTokens.length > 0 ? (
                <div className="mt-3 flex gap-1" aria-label="Chart palette">
                  {chartTokens.map(([name, value]) => (
                    <span key={name} title={name} aria-label={name} className="h-8 flex-1 first:rounded-l-md last:rounded-r-md" style={{ backgroundColor: `var(${name}, ${value})` }} />
                  ))}
                </div>
              ) : null}
            </section>

            {categories.map(({ category, items }) => (
              <div key={category}>
                <h2 id={`sink-cat-${category}`} className="scroll-mt-24 pt-5 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                  {category}
                </h2>
                {items.map((manifest) =>
                  SINK_BLOCKS[manifest.name] ?? (
                    <section key={manifest.name} data-component={manifest.name} data-missing="true" className="border-b border-border py-5">
                      <h3 className="text-base font-semibold">{manifest.name}</h3>
                      <p className="mt-1 text-sm text-destructive">No sink block registered for this component.</p>
                    </section>
                  ),
                )}
              </div>
            ))}
          </div>

          <nav aria-label="Sink sections" className="hidden w-44 shrink-0 lg:block">
            <div className="sticky top-4 max-h-[80vh] overflow-auto text-sm">
              <p className="font-semibold">Sections</p>
              <ul className="mt-2 flex flex-col gap-2">
                {categories.map(({ category, items }) => (
                  <li key={category}>
                    <a href={`#sink-cat-${category}`} className="text-muted-foreground hover:text-foreground">{category}</a>
                    <ul className="mt-1 ml-3 flex flex-col gap-1">
                      {items.map((item) => (
                        <li key={item.name}>
                          <a href={`#sink-${item.name}`} className="text-muted-foreground hover:text-foreground">{item.name}</a>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
