"use client";

import * as React from "react";
import Link from "next/link";
import { ProtoAurora, ProtoNav, ProtoFooter } from "@/components/proto-shell";
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
                  Create your own
                  <br />
                  {/* EXCEPTION: hero headline gradient — the one allowed hardcoded brand treatment. */}
                  <span className="proto-grad-text">component libraries</span>
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
                  Trusted by 10k+ developers
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
                  <p className="rounded-md border border-border bg-muted px-4 py-3 font-mono text-[13px] text-muted-foreground">
                    {feature.code}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>
        </div>
      </div>
      <ProtoFooter />
    </div>
  );
}
