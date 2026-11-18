"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Pager carousel: no scrollbar, side arrows move one page at a time,
// centered dots below indicate the current page and jump to it.
export function Carousel({
  children,
  slideClassName,
  label,
}: {
  children: React.ReactNode;
  slideClassName: string;
  label: string;
}) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [page, setPage] = React.useState(0);
  const [pages, setPages] = React.useState(1);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);
  const slides = React.Children.toArray(children);

  const update = React.useCallback(() => {
    const el = trackRef.current;
    if (!el || el.clientWidth <= 0) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    // round, not ceil: the inter-slide gap makes maxScroll slightly larger
    // than a whole number of pages, which ceil would overcount (phantom
    // dot) and break the end-of-track wrap check below.
    const count = maxScroll <= 1 ? 1 : Math.round(maxScroll / el.clientWidth) + 1;
    setPages(count);
    setPage(Math.min(count - 1, Math.round(el.scrollLeft / el.clientWidth)));
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= maxScroll - 1);
  }, []);

  React.useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update, slides.length]);

  const goTo = (next: number) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(pages - 1, next));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  };

  const showControls = pages > 1;
  // Fade the edges where a slide is cut off; no fade on an edge with
  // nothing beyond it (single page, or resting at either end).
  const fadeClass =
    atStart && atEnd
      ? ""
      : atStart
        ? "[mask-image:linear-gradient(to_right,black_calc(100%-3rem),transparent)]"
        : atEnd
          ? "[mask-image:linear-gradient(to_right,transparent,black_3rem)]"
          : "[mask-image:linear-gradient(to_right,transparent,black_3rem,black_calc(100%-3rem),transparent)]";

  return (
    <div>
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={update}
          role="region"
          aria-roledescription="carousel"
          aria-label={label}
          className={`flex snap-x gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${fadeClass}`}
        >
          {slides.map((slide, index) => (
            <div key={index} className={slideClassName}>
              {slide}
            </div>
          ))}
        </div>
        {showControls ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Previous page"
              onClick={() => goTo(page - 1)}
              disabled={page === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label={atEnd ? "Back to first page" : "Next page"}
              onClick={() => goTo(atEnd ? 0 : page + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </Button>
          </>
        ) : null}
      </div>
      {showControls ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to page ${i + 1}`}
              aria-current={i === page}
              onClick={() => goTo(i)}
              className={
                i === page
                  ? "h-2 w-6 rounded-full bg-primary"
                  : "h-2 w-2 rounded-full bg-muted-foreground/40 hover:bg-muted-foreground"
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
