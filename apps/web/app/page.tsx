import Link from "next/link";
import { getDemoFixtures, tokenVars } from "@/lib/fixtures";
import { getManifests } from "@arche/registry-core";
import { SiteNav } from "@/components/site-nav";
import { DemoRotation } from "@/components/demo-rotation";
import { MiniRender } from "@/components/mini-render";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/plans";

const HOW_IT_WORKS = [
  { title: "Describe it", text: "Say a word. Tokens and knob selections are recorded as data — never hand-written CSS." },
  { title: "Validate it", text: "The payload must cover the contract, pass contrast pairs, and stay inside each manifest's surface." },
  { title: "Install it", text: "Deterministic codegen emits a shadcn-compatible registry. Add it with the stock CLI." },
];

const FAQS = [
  { q: "Do components depend on Arche at runtime?", a: "No. Installation copies source files into your project; behavior comes from Radix Primitives, styling from your identity's tokens." },
  { q: "Can I edit the installed code?", a: "Yes — it is yours. Re-running install overwrites with the registry version; your edits in between are your own." },
  { q: "How do versions work?", a: "Each publish stores an immutable snapshot. Installs pin to a version or track the latest." },
];

export default function Home() {
  const fixtures = getDemoFixtures();
  const catalog = getManifests();

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-6">
        <section className="py-16 text-center">
          <h1 className="font-display mx-auto max-w-3xl text-5xl leading-tight">
            Say a word. Get an identity.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Complete, installable React component libraries — generated from data.
          </p>
          <div className="mt-6">
            <DemoRotation />
          </div>
        </section>

        <section className="border-t border-border py-12">
          <h2 className="font-display text-3xl">One identity, every surface</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            The same payload skins components, docs, and the dashboard. Change the data, change everything.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {fixtures.slice(0, 2).map((fixture) => (
              <div key={fixture.key} className="rounded-xl border border-border p-3">
                <p className="mb-2 text-sm text-muted-foreground">{fixture.prompt}</p>
                <MiniRender vars={tokenVars(fixture.payload, "light")} />
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border py-12">
          <h2 className="font-display text-3xl">How it works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} className="rounded-xl border border-border bg-card p-5 text-card-foreground">
                <p className="font-display text-2xl text-muted-foreground">{i + 1}</p>
                <h3 className="mt-2 font-medium">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border py-12">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-3xl">Live components</h2>
            <Link href="/components" className="text-sm underline">
              All {catalog.length} components
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button>Get started</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Badge>New</Badge>
            <Badge variant="secondary">Beta</Badge>
          </div>
        </section>

        <section className="border-t border-border py-12">
          <h2 className="font-display text-3xl">Examples</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            The same sample app, re-skinned by data alone. Hover to pause; pick a prompt to jump.
          </p>
          <div className="mt-6">
            <DemoRotation />
          </div>
        </section>

        <section className="border-t border-border py-12">
          <h2 className="font-display text-3xl">AI workflow</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Agents read the same manifests and token contract your editor does — placements are checked
            against each component&apos;s standards before code is written. MCP access ships with the
            hosted service; the docs describe the setup.
          </p>
          <Link href="/docs/mcp" className="mt-3 inline-block text-sm underline">
            MCP setup
          </Link>
        </section>

        <section className="border-t border-border py-12">
          <h2 className="font-display text-3xl">Pricing</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div key={plan.id} className="rounded-xl border border-border bg-card p-5 text-card-foreground">
                <h3 className="font-medium">{plan.name}</h3>
                <p className="font-display mt-1 text-2xl">{plan.create} <span className="text-sm font-normal text-muted-foreground">{plan.createNote}</span></p>
                <p className="mt-1 text-sm text-muted-foreground">Apply {plan.apply} {plan.applyNote} · {plan.blurb}</p>
              </div>
            ))}
          </div>
          <Link href="/pricing" className="mt-3 inline-block text-sm underline">
            Full pricing
          </Link>
        </section>

        <section className="border-t border-border py-12">
          <h2 className="font-display text-3xl">FAQ</h2>
          <div className="mt-6 flex flex-col gap-4">
            {FAQS.map((faq) => (
              <div key={faq.q}>
                <h3 className="font-medium">{faq.q}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border py-16 text-center">
          <h2 className="font-display text-4xl">Your library is data.</h2>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/sign-up" className="rounded-md bg-primary px-5 py-2.5 text-sm text-primary-foreground">
              Create an identity
            </Link>
            <ThemeToggle />
          </div>
        </section>
      </main>
    </>
  );
}
