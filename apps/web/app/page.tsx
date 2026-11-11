"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ProtoAurora, ProtoNav, ProtoFooter } from "@/components/proto-shell";
// Demo screens live on /examples; this section re-skins the whole site instead.
import GradientBg from "@/components/gradient-bg";

import { ArrowUp } from "lucide-react";
import {
  HERO_PROMPT_COOKIE,
  HERO_PROMPT_MAX_AGE_SECONDS,
  HERO_PROMPT_MAX_LENGTH,
} from "@/lib/hero-prompt";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    title: "You describe. Arche builds.",
    code: '$ npx @arche/cli generate "playful, warm, and bubbly educational app"',
  },
  {
    title: "Install what you need. Own the source code.",
    code: "$ npx @arche/cli login\n$ npx @arche/cli init\n$ npx @arche/cli add button",
  },
  {
    title: "Agents follow your system via MCP.",
    code: 'mcp: arche get_component("button")',
  },
];


function HeroPrompt() {
  const router = useRouter();
  const [value, setValue] = React.useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim().slice(0, HERO_PROMPT_MAX_LENGTH);
    if (trimmed) {
      document.cookie = `${HERO_PROMPT_COOKIE}=${encodeURIComponent(trimmed)}; path=/; max-age=${HERO_PROMPT_MAX_AGE_SECONDS}; SameSite=Lax`;
    }
    router.push("/sign-up");
  };
  return (
    <form
      onSubmit={submit}
      role="search"
      aria-label="Describe your product or brand identity"
      className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full border-2 border-white/30 bg-white/95 py-1.5 pl-5 pr-1.5 shadow-xl backdrop-blur"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={HERO_PROMPT_MAX_LENGTH}
        placeholder="Describe your product or brand identity..."
        aria-label="Describe your product or brand identity"
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        aria-label="Get started"
        className="shrink-0 rounded-full bg-primary p-2 text-primary-foreground transition-opacity hover:opacity-90"
      >
        <ArrowUp size={20} aria-hidden="true" />
      </button>
    </form>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <ProtoAurora />
      <ProtoNav />
      <div className="proto-view">
        <div className="proto-wrap">
          <div className="pt-6">
            <section className="relative overflow-hidden rounded-3xl py-20">
              <div aria-hidden="true" className="absolute inset-0">
                <GradientBg
                  className="hero-bg"
                  speed={28}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    // Same palette, darker: dims the gradient without shifting hues.
                    filter: "brightness(0.8) saturate(1.05)",
                  }}
                />
              </div>
              <div className="relative mx-auto max-w-2xl text-center">
                <h1 className="font-display text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
                  Create a design system for your application
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-base text-white/85">
                  Generate React components and tokens tailored to your brand. Install with
                  shadcn-style CLI commands and connect your AI through our MCP server.
                </p>
                <HeroPrompt />
              </div>
            </section>
          </div>
          <section className="grid gap-4 py-10 md:grid-cols-3">
            {FEATURES.map((feature) => (
              // Flat panel like the hero: hairline edge, hero radius, no elevation.
              <Card key={feature.title} shadow="none" className="rounded-3xl border border-border/70 bg-card py-8">
                <CardHeader>
                  <CardTitle className="text-2xl font-extrabold tracking-tight">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap rounded-2xl bg-muted/70 px-4 py-3 font-mono text-[13px] text-muted-foreground">
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
