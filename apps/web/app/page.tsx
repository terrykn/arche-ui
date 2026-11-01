"use client";

import * as React from "react";
import Link from "next/link";
import { ProtoAurora, ProtoNav, ProtoFooter } from "@/components/proto-shell";
import { readDemoIndex } from "@/lib/demo-sync";
import { DEMO_IDENTITIES } from "@/components/demo-identities";

const TRUST = [
  { initials: "JK", bg: "#7a5af8" },
  { initials: "AS", bg: "#e754c8" },
  { initials: "MR", bg: "#ff9e57" },
  { initials: "TL", bg: "#3ec6a7" },
  { initials: "NP", bg: "#6ea8ff" },
];

const FEATURES = [
  {
    title: "Describe it. Arche builds it.",
    text: "Turn a word, a picture, or a phrase into a full identity — tokens, variants, and all 30 Radix-based components, styled as one system.",
    code: '$ npx @arche/cli generate "quiet luxury fintech"',
  },
  {
    title: "Install like shadcn. Own the code.",
    text: "Log in once, then add components by name. Source files land in your project — no dependency lock-in, no runtime.",
    code: "$ npx @arche/cli login · init · add dialog",
  },
  {
    title: "Agents speak Arche via MCP",
    text: "Your AI agents read the same manifests you do — every component's variants, tokens, and usage standards, straight from the server.",
    code: 'mcp: arche get_component("dialog")',
  },
];

function HeroArt() {
  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    setIndex(readDemoIndex() % DEMO_IDENTITIES.length);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "arche-demo-index" && e.newValue !== null) {
        const n = Number(e.newValue);
        if (Number.isInteger(n)) {
          setIndex(n % DEMO_IDENTITIES.length);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    const timer = setInterval(() => setIndex(readDemoIndex() % DEMO_IDENTITIES.length), 1000);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(timer);
    };
  }, []);
  return (
    <div className="proto-hero-art">
      <div className="proto-app-tile">AR</div>
      <div className="proto-mini-tile proto-mono">{DEMO_IDENTITIES[index]!.prompt}</div>
      <div className="proto-mini-tile proto-mono">npx @arche/cli add button</div>
      <div className="proto-mini-tile">Standards checked</div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="proto-root">
      <ProtoAurora />
      <ProtoNav />
      <div className="proto-view">
        <div className="proto-wrap">
          <section className="proto-hero">
            <div>
              <span className="proto-pill">This site runs on the Arche identity — our own product, applied to itself</span>
              <h1>
                Create your own
                <br />
                <span className="proto-grad-text">component libraries</span>
              </h1>
              <p className="proto-sub">
                Generate complete React component libraries with AI, tailored to your brand identity. Install with a
                shadcn-style CLI and connect AI agents directly through our MCP server.
              </p>
              <div className="proto-cta-row">
                <Link href="/sign-up" className="proto-btn proto-btn-dark proto-btn-lg">
                  Get Started →
                </Link>
                <Link href="/examples" className="proto-btn proto-btn-ghost proto-btn-lg">
                  View Examples
                </Link>
              </div>
              <div className="proto-trust">
                <span className="proto-avatars" aria-hidden>
                  {TRUST.map((avatar) => (
                    <span key={avatar.initials} style={{ background: avatar.bg }}>
                      {avatar.initials}
                    </span>
                  ))}
                </span>
                Trusted by 10k+ developers
              </div>
            </div>
            <HeroArt />
          </section>
          <p className="proto-scroll-hint">Scroll to explore ↓</p>
          <section className="proto-features">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="proto-card proto-feature">
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                <div className="proto-code proto-mono">{feature.code}</div>
              </article>
            ))}
          </section>
        </div>
      </div>
      <ProtoFooter />
    </div>
  );
}
