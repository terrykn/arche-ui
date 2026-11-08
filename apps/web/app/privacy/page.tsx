import Link from "next/link";
import { ProtoAurora, ProtoNav, ProtoFooter } from "@/components/proto-shell";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <ProtoAurora />
      <ProtoNav />
      <div className="proto-view">
        <div className="proto-wrap">
          <section className="py-16">
            <p className="text-sm text-muted-foreground">
              <Link href="/" className="underline">Arche</Link> · privacy
            </p>
            <h1 className="mt-2 text-5xl font-extrabold tracking-tight">Privacy</h1>
            <div className="mt-6 flex max-w-3xl flex-col gap-4 text-sm leading-relaxed">
              <p>
                Arche stores what the product needs to function: your account (email), your identities and their
                versioned snapshots, generation logs (prompts, model responses, token counts), and registry
                tokens. Data lives in a managed Postgres database with row-level ownership checks — you can only
                read and write your own libraries, except public libraries, which anyone with the link can read.
              </p>
              <p>
                Prompts you submit for generation are sent to the configured language-model provider to produce
                design DNA. Provider API keys stay server-side and are never exposed to the browser.
              </p>
              <p>
                There is no advertising, no third-party tracking, and no sale of personal data — there is also no
                billing, so there are no payment processors involved. Account deletion is not self-serve yet during
                the prototype; deletion requests are honored manually.
              </p>
            </div>
          </section>
        </div>
      </div>
      <ProtoFooter />
    </div>
  );
}
