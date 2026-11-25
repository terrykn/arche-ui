"use client";

import * as React from "react";
import { BlockPreview } from "@/components/block-preview";
import { DEMO_IDENTITIES, type DemoIdentity } from "@/components/demo-identities";
import { useSiteTheme } from "@/components/site-theme";
import { demoSkin, toDark } from "@/components/story-screens";

const BLOCKS = [
  "status-2",
  "status-3",
  "steps-2",
  "ai-01",
  "ai-03",
  "grid-list-02",
  "search-3",
  "profile-2",
  "page-header-6",
  "onboarding-2",
  "notifications-4",
  "file-upload-4",
  "error-3",
  "table-04",
  "command-palette-1",
  "charts-2",
  "calendar-1",
  "billing-1",
  "auth-1",
  "logos-grid",
  "cta-vortex",
] as const;

/**
 * Blocks that already render their own outer card edge-to-edge. They skip
 * the shared frame — their own surface uses the same radius/border tokens —
 * so the grid never shows a doubled border. Everything else gets the frame,
 * which keeps every card in the grid consistent.
 */
const SELF_FRAMED: ReadonlySet<string> = new Set(["file-upload-4"]);

/**
 * Blocks whose roots are full-bleed by design (no outer padding of their
 * own). They get breathing room inside the example card so content never
 * sits flush against the frame. The block sources are generated, so the
 * padding lives here in the grid rather than in the blocks.
 */
const PADDED: ReadonlySet<string> = new Set(["ai-01", "ai-03"]);

/**
 * Masonry grid of catalog blocks. Each card wraps its block's natural
 * height — scaled down, non-interactive, faded at the bottom — with a max
 * cap so full-page sections stay concise. Scrolling snaps the card interiors through
 * the identities one at a time: there is no mid-blend state, crossing a
 * cutoff swaps the whole skin at once and plays a short fade. The page
 * behind the cards never changes; only the insides do. Skins are written
 * straight to the DOM (no re-renders) so scrolling stays smooth.
 */
export function ExamplesThemeGrid() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const bodyRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const [theme] = useSiteTheme();

  React.useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    // Follow the site's own light/dark mode so the blocks always match
    // the website's theming; the scroll snap moves within that mode.
    const stops: DemoIdentity[] =
      theme === "dark" ? DEMO_IDENTITIES.map(toDark) : DEMO_IDENTITIES;
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let active = -1;

    const paintSkin = (identity: DemoIdentity) => {
      // Reuse the shared skin mapping so the grid can never drift from
      // the story screens — except radius and overflow, which stay with
      // the card frame so the interior background always meets the frame
      // edge-to-edge. The skin radius still reaches inner components
      // through the --radius variable.
      const { borderRadius: _radius, overflow: _overflow, ...skin } = demoSkin(identity);
      void _radius;
      void _overflow;
      for (const body of bodyRefs.current) {
        if (!body) continue;
        for (const [key, value] of Object.entries(skin)) {
          if (value == null) continue;
          if (key.startsWith("--")) body.style.setProperty(key, String(value));
          else (body.style as unknown as Record<string, string>)[key] = String(value);
        }
      }
    };

    const paint = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      // Quantize to the nearest identity — the grid is ever only in one
      // theme, with cutoffs halfway between stops.
      const next = Math.round(p * (stops.length - 1));
      if (next === active) return;
      const first = active === -1;
      active = next;
      paintSkin(stops[next]!);
      if (first || reduceMotion) return;
      for (const body of bodyRefs.current) {
        body?.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 220,
          easing: "ease-out",
        });
      }
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [theme]);

  return (
    <section ref={sectionRef} id="examples" aria-label="Examples" className="scroll-mt-24">
      {/* Full-page sections (min-h-svh) collapse to their content so cards
          stay concise, and fixed-width roots cap at the column width. */}
      <div className="columns-1 gap-6 md:columns-2 lg:columns-3 [&_.min-h-svh]:min-h-0 [&_.w-xl]:max-w-full">
        {BLOCKS.map((name, index) => (
          <div
            key={name}
            className={
              SELF_FRAMED.has(name)
                ? "mb-6 break-inside-avoid overflow-hidden rounded-(--radius)"
                : "mb-6 break-inside-avoid overflow-hidden rounded-(--radius) border border-border bg-card"
            }
          >
            <div
              ref={(node) => {
                bodyRefs.current[index] = node;
              }}
              className="max-h-[560px] min-w-0 overflow-hidden"
            >
              {/* Flex centers fixed-width roots (e.g. the AI chats) in the
                  card; direct children cap at the column width so nothing
                  can grow wider than the grid container. */}
              <div
                className={`pointer-events-none flex w-full min-w-0 justify-center [zoom:0.7] [mask-image:linear-gradient(to_bottom,black_72%,transparent)] [&>*]:max-w-full [&>*]:min-w-0${PADDED.has(name) ? " p-6" : ""}`}
              >
                <BlockPreview name={name} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
