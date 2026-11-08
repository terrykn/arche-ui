"use client";

import * as React from "react";
import { DemoApp } from "./demo-app";
import type { FixtureIdentity } from "@/lib/fixtures";
import { tokenVars } from "@/lib/fixtures-client";

const ROTATE_MS = 5000;
const TRANSITION_MS = 750;

/**
 * Canonical demo pattern: one fixed sample app, rotating fixture identities.
 * Switches are token transitions only (no layout movement, no DOM swap).
 * Pauses on hover/focus/off-screen; honors prefers-reduced-motion.
 */
export function IdentityDemo({
  fixtures,
}: {
  fixtures: Array<{ key: string; prompt: string; tokens: FixtureIdentity["payload"]["tokens"] }>;
}) {
  const [index, setIndex] = React.useState(0);
  // The demo renders in the visitor's selected mode — fixtures define both sets.
  const [mode, setMode] = React.useState<"light" | "dark">("light");
  React.useEffect(() => {
    const sync = () =>
      setMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  const [paused, setPaused] = React.useState(false);
  const [visible, setVisible] = React.useState(true);
  const [reduced, setReduced] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry!.isIntersecting), {
      threshold: 0.2,
    });
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (paused || !visible || reduced) {
      return;
    }
    const timer = setTimeout(() => setIndex((i) => (i + 1) % fixtures.length), ROTATE_MS);
    return () => clearTimeout(timer);
  }, [index, paused, visible, reduced, fixtures.length]);

  const fixture = fixtures[index]!;

  return (
    <div
      ref={ref}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={mode === "dark" ? "dark" : ""}
    >
      <div className="mx-auto max-w-md">
        <p aria-live="polite" className="mb-3 rounded-full border-(length:--border-width) border-border bg-card px-4 py-1.5 text-center text-sm text-card-foreground">
          “{fixture.prompt}”
        </p>
        <div
          style={{ ...tokenVars({ tokens: fixture.tokens }, mode), transition: `background-color ${TRANSITION_MS}ms, color ${TRANSITION_MS}ms, border-color ${TRANSITION_MS}ms` } as React.CSSProperties}
          className="demo-surface rounded-xl bg-background text-foreground [&_*]:transition-[background-color,color,border-color]! [&_*]:duration-700!"
        >
          <DemoApp />
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {fixtures.map((f, i) => (              <button
                key={f.key}
                type="button"
                data-testid={`demo-chip-${f.key}`}
                onClick={() => setIndex(i)}
                aria-pressed={i === index}
              className={`rounded-full border-(length:--border-width) px-3 py-1 text-xs ${i === index ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
            >
              {f.prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
