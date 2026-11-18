"use client";

import * as React from "react";
import Link from "next/link";
import { ProtoAurora, ProtoNav, ProtoFooter } from "@/components/proto-shell";
import { EnterpriseDemo } from "@/components/enterprise-demo";
import { StoryScreen } from "@/components/story-screens";
import { DEMO_IDENTITIES } from "@/components/demo-identities";
import { BlockPreview } from "@/components/block-preview";
import { LatestIdentities } from "@/components/latest-identities";
import { writeDemoIndex } from "@/lib/demo-sync";
import { Play, Pause, ArrowRight } from "lucide-react";

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
  "Table",
];

export interface ExampleIdentity {
  id: string;
  name: string;
  prompt: string;
  components: number;
  vars: Record<string, string>;
}

export function ExamplesDemo({ identities }: { identities: ExampleIdentity[] }) {
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

  const go = React.useCallback(
    (next: number) => {
      setSwapping(true);
      window.setTimeout(() => {
        setIndex(next % identities.length);
        writeDemoIndex(next % identities.length);
        setSwapping(false);
      }, 180);
    },
    [identities.length],
  );

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

  const identity = identities[index]!;

  return (
    <div className="proto-root">
      <ProtoAurora />
      <ProtoNav />
      <div className="proto-view">
        <div className="proto-wrap">
          <section className="proto-section">
            <h2>One site. Every library.</h2>
            <p className="proto-lede">
              The same enterprise site — Acme Fulfillment — never changes its layout, content, or components. Only the
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
                  {identities.map((item, i) => (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={i === index}
                      aria-label={item.name}
                      className={`proto-dot${i === index ? " active" : ""}`}
                      onClick={() => go(i)}
                    />
                  ))}
                </span>
              </div>
              <div className={`proto-progress run`} key={`${index}-${paused}-${reduced}`}>
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
                <span className="proto-url">acmefulfillment.com</span>
                <span className="proto-lib-tag">{identity.name}</span>
              </div>
              <EnterpriseDemo vars={identity.vars} mode="light" />
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
              picks tokens and legal knob values, and the whole site follows.
            </p>
            <div className="proto-cta-row" style={{ marginTop: 22 }}>
              <Link href="/sign-up" className="proto-btn proto-btn-dark">
                Build a library like these <ArrowRight size={15} aria-hidden="true" style={{ verticalAlign: "-0.2em" }} />
              </Link>
            </div>
          </section>
          <section className="proto-section" aria-label="Prompt-built app screens">
            <h2>One prompt, one app</h2>
            <p className="proto-lede">
              The three homepage prompts, each rendered as the app it asked for — a dental booking flow,
              a retro game catalog, an enterprise review. Every screen is skinned live by its own
              generated identity. All people, titles, and figures are fictional.
            </p>
            <div className="grid items-start gap-8 pt-6 md:grid-cols-3">
              {DEMO_IDENTITIES.map((identity) => (
                <figure key={identity.name} style={{ margin: 0 }}>
                  <StoryScreen identity={identity} />
                  <figcaption className="flex flex-col gap-2 pt-3">
                    <span className="proto-lib-chip" style={{ alignSelf: "flex-start" }}>
                      {identity.name}
                    </span>
                    <span className="proto-mono" style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                      “{identity.prompt}”
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
          <section className="proto-section" aria-label="Blocks">
            <h2>Sections, not just components</h2>
            <p className="proto-lede">
              Blocks are complete page sections composed from the same catalog — installed with the same CLI and
              re-skinned by every identity. Live previews under the site identity.
            </p>
            <div className="proto-browser">
              <div className="proto-chrome">
                <span className="proto-url">blocks/hero</span>
              </div>
              <BlockPreview name="hero" />
            </div>
            <div className="proto-cta-row" style={{ marginTop: 22 }}>
              <Link href="/blocks" className="proto-btn proto-btn-dark">
                Browse all 20 blocks <ArrowRight size={15} aria-hidden="true" style={{ verticalAlign: "-0.2em" }} />
              </Link>
            </div>
          </section>
          <LatestIdentities />
        </div>
      </div>
      <ProtoFooter />
    </div>
  );
}
