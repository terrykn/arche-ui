"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ProtoAurora, ProtoNav, ProtoFooter } from "@/components/proto-shell";
import { ExamplesThemeGrid } from "@/components/examples-theme-grid";
import ResponsiveGradientBg from "@/components/gradient-bg-adaptive";

import { ArrowUp } from "lucide-react";
import {
  HERO_PROMPT_COOKIE,
  HERO_PROMPT_MAX_AGE_SECONDS,
  HERO_PROMPT_MAX_LENGTH,
} from "@/lib/hero-prompt";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AutosizeTextarea } from "@/components/autosize-textarea";

// Per-column shift of the full-grid gradient copy inside each card.
// On mobile the cards stack, so each just shows its own full gradient.
const GRID_OFFSETS = [
  "md:left-0 md:w-[calc(300%+2rem)]",
  "md:left-[calc(-100%-1rem)] md:w-[calc(300%+2rem)]",
  "md:left-[calc(-200%-2rem)] md:w-[calc(300%+2rem)]",
];

const FEATURES = [
  {
    title: "Install what you need. Own the source code.",
    code: "$ npx @arche-ui/cli login\n$ npx @arche-ui/cli init <user>/<library>\n$ npx @arche-ui/cli add button dialog",
  },
  {
    title: "Check your code against the system.",
    code: "$ npx @arche-ui/cli check --strict",
  },
  {
    title: "Agents follow your system via MCP.",
    code: 'mcp: arche get_component("button")',
  },
];


function HeroPrompt() {
  const router = useRouter();
  const [value, setValue] = React.useState("");
  const [expanded, setExpanded] = React.useState(false);
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
      aria-label="Describe your design system"
      className={`mx-auto mt-8 flex max-w-xl items-end gap-2 border-2 border-white/30 bg-white/95 py-1.5 pl-5 pr-1.5 backdrop-blur ${expanded ? "rounded-3xl" : "rounded-full"}`}
    >
      <AutosizeTextarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
        onExpandChange={setExpanded}
        maxLength={HERO_PROMPT_MAX_LENGTH}
        placeholder="Describe your design system..."
        aria-label="Describe your design system"
        className="min-w-0 flex-1 resize-none bg-transparent py-2 text-sm leading-snug text-gray-900 outline-none placeholder:text-gray-500"
      />
      <button
        type="submit"
        aria-label="Get started"
        className="shrink-0 rounded-full bg-black p-2 text-white transition-opacity hover:opacity-90"
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
            <section className="relative overflow-hidden rounded-3xl px-4 py-14 sm:px-6 sm:py-20">
              <div aria-hidden="true" className="absolute inset-0">
                <ResponsiveGradientBg
                  className="hero-bg"
                  speed={28}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    // Dark + vibrant: dims the gradient while pushing saturation.
                    filter: "brightness(0.82) saturate(1.35)",
                  }}
                />
              </div>
              <div className="relative mx-auto max-w-2xl text-center">
                <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
                  Create a React design system in minutes
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
            {FEATURES.map((feature, index) => (
              // Three separate cards, one flowing background: each card
              // clips a full-grid-sized copy of the same gradient, shifted
              // by its column, so the pattern runs continuously across all
              // three (grid gap is gap-4 = 1rem).
              <Card key={feature.title} shadow="none" className="relative overflow-hidden rounded-3xl border-0 bg-[#3A1F83] py-8 text-white">
                <div
                  aria-hidden="true"
                  className={`absolute inset-0 opacity-60 ${GRID_OFFSETS[index]}`}
                  style={{ filter: "brightness(0.5) saturate(1.25)" }}
                >
                  <ResponsiveGradientBg
                    className="feature-bg"
                    speed={14}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                    }}
                  />
                </div>
                <CardHeader className="relative">
                  <CardTitle className="text-[28px] font-black leading-tight tracking-tight text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="whitespace-pre-wrap rounded-2xl bg-white/15 px-4 py-3 font-mono text-[13px] font-semibold text-white">
                    {feature.code}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>
          <div className="pb-10">
            <ExamplesThemeGrid />
          </div>
        </div>
      </div>
      <ProtoFooter />
    </div>
  );
}
