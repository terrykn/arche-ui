"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel } from "@/components/carousel";

export type IdentityRow = {
  id: string;
  name: string;
  slug: string;
  visibility: string;
  updated_at: string;
  payload: unknown;
};

/** Gradient built from the identity's own light color tokens. */
function paletteGradient(payload: unknown): string {
  const stops = paletteStops(payload);
  if (stops.length === 1) return stops[0]!;
  return `linear-gradient(135deg, ${stops.join(", ")})`;
}

/**
 * Flowing palette gradient — the same strategy as GradientBg: a canvas
 * painted on requestAnimationFrame, paused offscreen / on hidden tab, and
 * frozen to a single frame under prefers-reduced-motion. The only
 * difference is the recipe: instead of the fixed aurora it animates the
 * identity's own palette stops (angle + stop drift), so each card moves
 * but keeps its own colors.
 */
function FlowingPaletteGradient({ stops, speed = 10 }: { stops: string[]; speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = stops.join("|");
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resolved = stops.map((stop) => {
      const match = /^var\((--[^)]+)\)$/.exec(stop.trim());
      if (!match) return stop;
      const value = getComputedStyle(document.documentElement).getPropertyValue(match[1]!).trim();
      return value || "#a1a1aa";
    });
    let raf = 0;
    let t = Math.random() * 100;
    let visible = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = () => {
      const { width: w, height: h } = canvas;
      if (w < 2 || h < 2) return;
      const angle = Math.PI / 4 + Math.sin(t * 0.35) * 0.55;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const cx = w / 2;
      const cy = h / 2;
      const half = (Math.abs(dx) * w + Math.abs(dy) * h) / 2;
      let gradient: CanvasGradient;
      try {
        gradient = ctx.createLinearGradient(cx - dx * half, cy - dy * half, cx + dx * half, cy + dy * half);
        const n = resolved.length;
        resolved.forEach((stop, i) => {
          const base = n === 1 ? 0.5 : i / (n - 1);
          const pos = Math.min(1, Math.max(0, base + Math.sin(t * 0.6 + i * 1.7) * 0.1));
          gradient.addColorStop(pos, stop);
        });
      } catch {
        return;
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(2, Math.round(rect.width * dpr));
      canvas.height = Math.max(2, Math.round(rect.height * dpr));
      draw();
    };
    const tick = () => {
      t += (Math.max(0, speed) / 60) * 0.12;
      draw();
      raf = requestAnimationFrame(tick);
    };
    resize();
    if (reduced || speed <= 0) return;
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (visible && raf === 0) {
        raf = requestAnimationFrame(tick);
      }
    };
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = entry?.isIntersecting ?? true;
            if (!visible) {
              cancelAnimationFrame(raf);
              raf = 0;
            } else if (!document.hidden && raf === 0) {
              raf = requestAnimationFrame(tick);
            }
          });
    observer?.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, speed]);
  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}

/**
 * Palette stops for the card aurora: at most 3 colors (primary, accent,
 * secondary when present). Two to three stops flow like an aurora; five
 * bands read as stripes no matter how they are animated.
 */
function paletteStops(payload: unknown): string[] {
  const tokens =
    (payload as { tokens?: { light?: Record<string, { $value?: unknown }> } | null })?.tokens
      ?.light ?? {};
  const preferred = [
    "--primary",
    "--accent",
    "--secondary",
    "--muted",
    "--card",
    "--background",
    "--foreground",
  ];
  const stops: string[] = [];
  for (const key of preferred) {
    const v = tokens[key]?.$value;
    if (typeof v === "string" && v.length > 0 && !v.includes(";") && !stops.includes(v)) {
      stops.push(v);
      if (stops.length === 3) break;
    }
  }
  if (stops.length === 0) return ["var(--muted)", "var(--accent)", "var(--card)"];
  return stops;
}

export function IdentityCarousel({ libraries }: { libraries: IdentityRow[] }) {
  return (
    <div className="pt-6">
      <Carousel slideClassName="w-64 shrink-0 snap-start" label="Your identities">
        {libraries.map((library) => (
          <Card key={library.id} className="overflow-hidden pt-0">
            <div className="relative h-16 overflow-hidden border-b border-border">
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background: paletteGradient(library.payload),
                  filter: "brightness(0.9) saturate(1.3)",
                }}
              >
                <FlowingPaletteGradient stops={paletteStops(library.payload)} speed={10} />
              </div>
              <Badge variant="secondary" className="absolute right-3 top-3">
                {library.visibility}
              </Badge>
            </div>
            <CardHeader>
              <CardTitle>
                <Link
                  href={`/dashboard/identities/${library.id}/edit`}
                  className="underline-offset-4 hover:underline"
                >
                  {library.name}
                </Link>
              </CardTitle>
              <CardDescription>
                updated {new Date(library.updated_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </Carousel>
    </div>
  );
}
