"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

// Command-line style prompt that types itself in when the slide scrolls
// into view, with a sparkle icon on the left and a blinking caret.
export function TypedPrompt({ text }: { text: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [started, setStarted] = React.useState(false);
  const [length, setLength] = React.useState(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStarted(true);
      setLength(text.length);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  React.useEffect(() => {
    if (!started || length >= text.length) return;
    const timer = window.setTimeout(() => setLength((n) => n + 1), 28);
    return () => window.clearTimeout(timer);
  }, [started, length, text.length]);

  const done = length >= text.length;

  return (
    <div ref={ref} className="flex items-center gap-2 font-mono text-[13px]">
      <Sparkles size={15} aria-hidden="true" className="shrink-0 text-primary" />
      <span aria-label={text} role="text">
        &ldquo;{text.slice(0, length)}
        {done ? null : <span aria-hidden="true" className="animate-pulse">▍</span>}&rdquo;
      </span>
    </div>
  );
}
