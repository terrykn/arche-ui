import Link from "next/link";
import { ProtoAurora, ProtoNav, ProtoFooter } from "@/components/proto-shell";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <ProtoAurora />
      <ProtoNav />
      <div className="proto-view">
        <div className="proto-wrap">
          <section className="py-16">
            <p className="text-sm text-muted-foreground">
              <Link href="/" className="underline">Arche</Link> · about
            </p>
            <h1 className="mt-2 text-5xl font-extrabold tracking-tight">What Arche is</h1>
            <div className="mt-6 flex max-w-3xl flex-col gap-4 text-sm leading-relaxed">
              <p>
                Arche generates complete React component libraries from a text description. You describe a vibe;
                the system produces design DNA, compiles it deterministically into a token contract and
                per-component knob selections, and emits an installable registry — source files you own, in the
                shadcn format your tooling already understands.
              </p>
              <p>
                Two things make it different from a theme generator. First, the design rulebook: taught
                calibration plus enforced checks with compiler repair, so generated identities land inside
                published envelopes instead of near them. Second, the gates: WCAG AA contrast is absolute, drafts
                never auto-publish, and agents use the same manifests and validators you do through MCP.
              </p>
              <p>
                Arche is a working prototype. There is no billing, no SLA, and hosted data lives in a managed
                Postgres database. Libraries you publish as public are visible to anyone with the link.
              </p>
              <p>
                Start with <Link href="/examples" className="underline">the Examples</Link>, inspect the{" "}
                <Link href="/kitchen-sink" className="underline">demo site</Link>, or read{" "}
                <Link href="/docs" className="underline">the docs</Link>.
              </p>
            </div>
          </section>
        </div>
      </div>
      <ProtoFooter />
    </div>
  );
}
