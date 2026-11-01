"use client";

import * as React from "react";
import Link from "next/link";
import { ProtoAurora, ProtoNav, ProtoFooter } from "@/components/proto-shell";
import { AcmeTasks } from "@/components/acme-tasks";
import { DEMO_IDENTITIES } from "@/components/demo-identities";
import { writeDemoIndex } from "@/lib/demo-sync";

const ROTATE_MS = 5000;

const COMP_CHIPS = [
  "Button",
  "Card",
  "Tabs",
  "Checkbox",
  "Badge",
  "Progress",
  "Input",
  "Switch",
  "Avatar",
  "Sidebar nav",
];

export default function Examples() {
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [visible, setVisible] = React.useState(true);
  const [reduced, setReduced] = React.useState(false);
  const [swapping, setSwapping] = React.useState(false);
  const frameRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry!.isIntersecting), {
      threshold: 0.2,
    });
    if (frameRef.current) {
      observer.observe(frameRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const go = React.useCallback((next: number) => {
    setSwapping(true);
    window.setTimeout(() => {
      setIndex(next % DEMO_IDENTITIES.length);
      writeDemoIndex(next % DEMO_IDENTITIES.length);
      setSwapping(false);
    }, 180);
  }, []);

  React.useEffect(() => {
    writeDemoIndex(index);
  }, [index]);

  React.useEffect(() => {
    if (paused || !visible || reduced) {
      return;
    }
    const timer = setTimeout(() => go(index + 1), ROTATE_MS);
    return () => clearTimeout(timer);
  }, [index, paused, visible, reduced, go]);

  const identity = DEMO_IDENTITIES[index]!;

  return (
    <div className="proto-root">
      <ProtoAurora />
      <ProtoNav />
      <div className="proto-view">
        <div className="proto-wrap">
          <section className="proto-section">
            <h2>One app. Every library.</h2>
            <p className="proto-lede">
              The same mini application — Acme Tasks — never changes its layout, content, or components. Only the
              library changes. Watch it cycle through generated identities on its own, or jump to one below.
            </p>
            <div className="proto-promptbar">
              <p className="proto-prompt-line proto-mono">
                <span>$ arche generate</span>
                <span className={`proto-prompt-text${swapping ? " swap" : ""}`}>{identity.prompt}</span>
              </p>
              <div className="proto-prompt-meta">
                <span className="proto-lib-chip">{identity.name}</span>
                <span className="proto-lib-chip">{identity.components} components</span>
                <span className="proto-dots" role="tablist" aria-label="Identities">
                  {DEMO_IDENTITIES.map((item, i) => (
                    <button
                      key={item.name}
                      type="button"
                      role="tab"
                      aria-selected={i === index}
                      aria-label={item.name}
                      className={`proto-dot${i === index ? " active" : ""}`}
                      onClick={() => go(i)}
                    />
                  ))}
                </span>
                <button type="button" className="proto-pause-btn" onClick={() => setPaused((p) => !p)}>
                  {paused ? "▶ Resume rotation" : "⏸ Pause rotation"}
                </button>
              </div>
              <div className="proto-progress run" key={`${index}-${paused}-${reduced}`}>
                {!paused && visible && !reduced ? <i /> : null}
              </div>
            </div>
            <div
              ref={frameRef}
              className={`proto-browser${swapping ? " swap" : ""}`}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div className="proto-chrome">
                <span className="proto-chrome-dots" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
                <span className="proto-url">acme.app/tasks</span>
                <span className="proto-lib-tag">{identity.name}</span>
              </div>
              <AcmeTasks identity={identity} />
            </div>
            <div className="proto-comp-chips">
              {COMP_CHIPS.map((chip) => (
                <span key={chip} className="proto-chip">
                  {chip}
                </span>
              ))}
            </div>
            <p className="proto-demo-caption">
              Same Radix behavior underneath every version — focus, keyboard, and ARIA never change. An identity only
              picks tokens and legal knob values, and the whole interface follows. That&apos;s the demo the web-app
              spec (§A1.9) now requires, in the hero and here.
            </p>
            <div className="proto-cta-row" style={{ marginTop: 22 }}>
              <Link href="/sign-up" className="proto-btn proto-btn-dark">
                Build a library like these →
              </Link>
              <Link href="/docs/brief-3" className="proto-btn proto-btn-ghost">
                Read Brief #3 — the web app build
              </Link>
            </div>
          </section>
        </div>
      </div>
      <ProtoFooter />
    </div>
  );
}
