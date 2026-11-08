"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ProtoAurora, ProtoNav, ProtoFooter } from "@/components/proto-shell";
import { AcmeTasks } from "@/components/acme-tasks";
import { LatestIdentities } from "@/components/latest-identities";
import { readDemoIndex } from "@/lib/demo-sync";
import { DEMO_IDENTITIES } from "@/components/demo-identities";
import { ArrowRight, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Trust row uses the identity Avatar with default muted styling —
// no per-avatar hardcoded colors. Initials only; tokens supply the rest.
const TRUST = [{ initials: "JK" }, { initials: "AS" }, { initials: "MR" }, { initials: "TL" }, { initials: "NP" }];

const FEATURES = [
  {
    title: "Describe it. Arche builds it.",
    text: "Turn a word or a phrase into a full identity — tokens, variants, and all 37 catalog components, styled as one system.",
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
    <Card className="items-center p-6 text-center">
      <span className="flex h-24 w-24 items-center justify-center rounded-xl bg-primary text-4xl font-extrabold italic text-primary-foreground">
        AR
      </span>
      <CardContent className="flex flex-col items-center gap-2 p-0 pt-4">
        <Badge variant="secondary" className="font-mono">
          {DEMO_IDENTITIES[index]!.prompt}
        </Badge>
        <Badge variant="outline" className="font-mono">
          npx @arche/cli add button
        </Badge>
        <Badge>Standards checked</Badge>
      </CardContent>
    </Card>
  );
}

const STORY_BEATS = [
  {
    prompt: "playful saas, bold violet",
    headline: "Say the word.",
    line: "A sentence becomes a design direction — no mood boards, no tokens yet.",
    identity: 0,
  },
  {
    prompt: "quiet luxury fintech, deep teal",
    headline: "It becomes an identity.",
    line: "Design DNA compiles to tokens: color, type, radius, motion.",
    identity: 1,
  },
  {
    prompt: "90s arcade, neon on midnight",
    headline: "A whole component system.",
    line: "All 37 components re-skin at once — same behavior, new voice.",
    identity: 2,
  },
  {
    prompt: "warm wanderlust, sunset amber",
    headline: "Installed in a real app.",
    line: "One arche add later, Acme Tasks wears it.",
    identity: 3,
  },
];

function TransformationStory() {
  const [index, setIndex] = React.useState(0);
  const [reduced, setReduced] = React.useState(false);
  const refs = React.useRef<Array<HTMLElement | null>>([]);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  // Scroll-linked identity crossfade: the visible beat drives the demo skin.
  React.useEffect(() => {
    if (reduced) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const i = Number((entry.target as HTMLElement).dataset.beat);
            if (Number.isInteger(i)) setIndex(i);
          }
        }
      },
      { rootMargin: "-40% 0px -40% 0px" },
    );
    for (const el of refs.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);
  // Reduced motion: fall back to the standard rotation, no scroll effects.
  React.useEffect(() => {
    if (!reduced) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % STORY_BEATS.length), 4000);
    return () => clearInterval(timer);
  }, [reduced]);
  const beat = STORY_BEATS[index]!;
  return (
    <section id="story" aria-label="How Arche works" className="grid gap-8 py-16 lg:grid-cols-2">
      <div className="flex flex-col">
        {STORY_BEATS.map((b, i) => (
          <article
            key={b.headline}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-beat={i}
            aria-current={i === index ? "true" : undefined}
            className="flex min-h-[46vh] flex-col justify-center border-l-2 py-8 pl-6"
            style={{ borderColor: i === index ? "var(--primary)" : "var(--border)" }}
          >
            <p className="font-mono text-xs text-muted-foreground">“{b.prompt}”</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">{b.headline}</h2>
            <p className="mt-2 max-w-md text-muted-foreground">{b.line}</p>
          </article>
        ))}
      </div>
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-xl border border-border">
          <AcmeTasks identity={DEMO_IDENTITIES[beat.identity]!} />
        </div>
        <p className="mt-2 text-center font-mono text-xs text-muted-foreground">{beat.prompt}</p>
      </div>
    </section>
  );
}

const TERMINAL_TRANSCRIPT = `$ arche init qafilm/ember-glow --app http://localhost:3000
Wired library \`qafilm/ember-glow\` (namespace @arche).
Registry: http://localhost:3000/r/qafilm/ember-glow/{name}.json (auth header uses the \${ARCHE_TOKEN} placeholder).
Next: \`arche list\`, \`arche install\`, or \`arche add <component>\`.
$ arche add button --library qafilm/ember-glow
Checking registry.
Installing dependencies.
Created 2 files:
  - lib/utils.ts
  - components/ui/button.tsx
$ ls components/ui lib
button.tsx
utils.ts`;

const FILM_BEATS = [
  "Sign in to the dashboard (dark sign-in form).",
  "New identity: type the phrase \u201cember glow\u201d, name it \u201cEmber Glow\u201d, Generate draft — DNA compiles in seconds.",
  "Studio review: token list in oklch next to a live kitchen-sink preview; scroll the full catalog.",
  "Identity detail: Publish validates and stores v1; the install commands appear with the registry URL.",
  "Public page: the whole catalog rendered live under the new Ember Glow identity, light mode, type scale included.",
  "Terminal (transcript below): arche init wires the registry, arche add button installs two files.",
];

function Film() {
  return (
    <section id="film" aria-label="Watch Arche work" className="py-16">
      <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Watch it work</h2>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Forty seconds, no mockups: sign in, describe a vibe, review the kitchen sink, publish v1,
        open the live public page — then install it into a real app from the terminal.
      </p>
      <figure className="mt-8">
        <div className="overflow-hidden rounded-xl border border-border">
          <video
            src="/film/film.mp4"
            poster="/film/poster.jpg"
            muted
            loop
            playsInline
            controls
            preload="metadata"
            className="aspect-video w-full"
          />
        </div>
        <figcaption className="mt-2 text-sm text-muted-foreground">
          Captured 2026-11-08 against a local build of this app: 56 stills from an automated run
          (sign-in → generate → studio → publish → public page) at 1.4 fps, muted, with a poster.
          The install step ran headless right after against the same published identity — transcript below.
        </figcaption>
      </figure>
      <details className="mt-4 rounded-lg border border-border p-4">
        <summary className="cursor-pointer font-medium">Terminal transcript (verbatim stdout)</summary>
        <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-4 font-mono text-[13px] text-muted-foreground">
          {TERMINAL_TRANSCRIPT}
        </pre>
      </details>
      <details className="mt-4 rounded-lg border border-border p-4">
        <summary className="cursor-pointer font-medium">Text alternative: what the film shows</summary>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          {FILM_BEATS.map((beat) => (
            <li key={beat}>{beat}</li>
          ))}
        </ol>
      </details>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <ProtoAurora />
      <ProtoNav />
      <div className="proto-view">
        <div className="proto-wrap">
          <section className="grid items-center gap-12 py-20">
            <div className="lg:grid lg:grid-cols-[1.25fr_0.75fr] lg:gap-12">
              <div>
                <Badge variant="secondary">Arche identity · light + dark tokens</Badge>
                <h1 className="mt-4 text-5xl font-extrabold leading-[1.04] tracking-tight md:text-6xl">
                  Create your own component libraries
                </h1>
                <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                  Generate complete React component libraries with AI, tailored to your brand identity. Install with a
                  shadcn-style CLI and connect AI agents directly through our MCP server.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button variant="default" size="lg" asChild>
                    <Link href="/sign-up">
                      Get Started <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/examples">View Examples</Link>
                  </Button>
                </div>
                <div className="mt-7 flex items-center gap-3 text-sm font-semibold text-muted-foreground">
                  <span className="flex" aria-hidden>
                    {TRUST.map((avatar) => (
                      <Avatar key={avatar.initials} size="sm" className="-ml-2 border-2 border-background first:ml-0">
                        <AvatarFallback>{avatar.initials}</AvatarFallback>
                      </Avatar>
                    ))}
                  </span>
                  Every publish passes a WCAG AA contrast gate
                </div>
              </div>
              <HeroArt />
            </div>
          </section>
          <p className="pb-6 text-center text-sm text-muted-foreground">
            Scroll to explore <ArrowDown size={14} aria-hidden="true" className="inline" />
          </p>
          <Separator />
          <section className="grid gap-4 py-10 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.text}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="rounded-md border-(length:--border-width) border-border bg-muted px-4 py-3 font-mono text-[13px] text-muted-foreground">
                    {feature.code}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>
          <Separator />
          <section id="specimens" aria-label="Published identities, rendered" className="py-16">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Real identities, rendered large</h2>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
              Finished identities the way hardware makers show finished hardware: full kitchen-sink renders under
              real payloads — never mockups, never stock imagery.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <figure>
                <div className="overflow-hidden rounded-xl border border-border">
                  <Image src="/specimens/sink-arche.png" alt="Kitchen sink rendered under the Arche identity" width={1440} height={2400} className="w-full" />
                </div>
                <figcaption className="mt-2 text-sm text-muted-foreground">Arche — from “ancient Greece”</figcaption>
              </figure>
              <figure>
                <div className="overflow-hidden rounded-xl border border-border">
                  <Image src="/specimens/sink-arcade-dark.png" alt="Kitchen sink rendered under the 90s Arcade identity, dark mode" width={1440} height={2400} className="w-full" />
                </div>
                <figcaption className="mt-2 text-sm text-muted-foreground">90s Arcade — from “90s arcade” · dark</figcaption>
              </figure>
              <figure>
                <div className="overflow-hidden rounded-xl border border-border">
                  <Image src="/specimens/sink-default.png" alt="Kitchen sink rendered under the Arche Default identity" width={1440} height={900} className="w-full" />
                </div>
                <figcaption className="mt-2 text-sm text-muted-foreground">Arche Default — from “Arche Default”</figcaption>
              </figure>
              <figure>
                <div className="overflow-hidden rounded-xl border border-border">
                  <Image src="/specimens/sink-hospital.png" alt="Kitchen sink rendered under the Hospital identity" width={1440} height={900} className="w-full" />
                </div>
                <figcaption className="mt-2 text-sm text-muted-foreground">Hospital — from “calm hospital”</figcaption>
              </figure>
            </div>
          </section>
          <Separator />
          <TransformationStory />
          <Separator />
          <Film />
          <Separator />
          <LatestIdentities />
        </div>
      </div>
      <ProtoFooter />
    </div>
  );
}
