import Link from "next/link";
import { ProtoAurora, ProtoNav, ProtoFooter } from "@/components/proto-shell";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <ProtoAurora />
      <ProtoNav />
      <div className="proto-view">
        <div className="proto-wrap">
          <section className="py-16">
            <p className="text-sm text-muted-foreground">
              <Link href="/" className="underline">Arche</Link> · terms
            </p>
            <h1 className="mt-2 text-5xl font-extrabold tracking-tight">Terms</h1>
            <div className="mt-6 flex max-w-3xl flex-col gap-4 text-sm leading-relaxed">
              <p>
                Arche is a working prototype provided as-is, without warranties. Generated identities are a
                starting point: review tokens, contrast pairings, and knob selections before shipping them in your
                own product.
              </p>
              <p>
                Identities and code you create are yours. Public libraries are visible to anyone with the link and
                installable through the registry — do not publish secrets, personal data, or content you do not
                have the rights to share.
              </p>
              <p>
                Acceptable use: no unlawful content, no attempts to access other users&apos; private libraries, and
                no abuse of the generation allowance that degrades the service for others. Accounts that do so may
                be suspended.
              </p>
            </div>
          </section>
        </div>
      </div>
      <ProtoFooter />
    </div>
  );
}
