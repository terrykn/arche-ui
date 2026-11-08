import Link from "next/link";
import { ProtoAurora, ProtoNav, ProtoFooter } from "@/components/proto-shell";

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <ProtoAurora />
      <ProtoNav />
      <div className="proto-view">
        <div className="proto-wrap">
          <section className="py-16">
            <p className="text-sm text-muted-foreground">
              <Link href="/" className="underline">Arche</Link> · accessibility
            </p>
            <h1 className="mt-2 text-5xl font-extrabold tracking-tight">Accessibility statement</h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Contrast is not a guideline in Arche — it is a gate. Nothing publishes that fails it.
            </p>
            <div className="mt-8 flex max-w-3xl flex-col gap-4 text-sm leading-relaxed">
              <p>
                Every Arche identity declares eight text-on-surface contrast pairs (foreground, card, popover,
                primary, secondary, accent, destructive, muted). The publish validator measures each pair in both
                light and dark mode and refuses to publish anything under <strong>WCAG 2.2 AA (4.5:1)</strong>.
                AI-generated identities are adjusted into compliance automatically; hand edits that break a pair
                are rejected at save and at publish.
              </p>
              <p>
                The design rulebook adds structural guarantees on top of contrast: text tokens are chroma-capped so
                they stay quiet, display type is capped per profile, component transitions stay within 50–400ms,
                and <code>prefers-reduced-motion</code> is a fixed, non-negotiable part of every identity.
              </p>
              <p>
                The components themselves are Radix primitives: focus management, keyboard interaction, and ARIA
                semantics come from the primitive, and Arche templates add visible focus rings without altering
                behavior. The kitchen sink (<Link href="/kitchen-sink" className="underline">/kitchen-sink</Link>) is
                the visual QA surface where every state ships screenshot-stable.
              </p>
              <p className="text-muted-foreground">
                Known limitation: this statement covers the Arche system and this site. Libraries you publish carry
                the same gates, but content you write inside them (images without alt text, color-only meaning) is
                your responsibility — the <code>badge-text-describes-status</code> standard is one example of the
                guidance the manifests give your agents.
              </p>
            </div>
          </section>
        </div>
      </div>
      <ProtoFooter />
    </div>
  );
}
