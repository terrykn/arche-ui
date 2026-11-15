import Link from "next/link";
import { ProtoAurora, ProtoNav, ProtoFooter } from "@/components/proto-shell";
import { DEMO_IDENTITIES } from "@/components/demo-identities";
import { StoryScreen } from "@/components/story-screens";
import { ArrowRight } from "lucide-react";

export function siteSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/**
 * Examples: cards with live mini previews of each prompt-built site.
 * Click a card to view the full site preview.
 */
export default function Examples() {
  return (
    <div className="proto-root">
      <ProtoAurora />
      <ProtoNav />
      <div className="proto-view">
        <div className="proto-wrap">
          <section className="proto-section">
            <h2>Example sites</h2>
            <p className="proto-lede">
              Each prompt below generated its own site — its own layout, content, and identity.
              Pick one to open the full site preview. All people, titles, and figures are fictional.
            </p>
            <div className="grid items-start gap-8 pt-6 md:grid-cols-3">
              {DEMO_IDENTITIES.map((identity) => {
                const slug = siteSlug(identity.name);
                return (
                  <article
                    key={identity.name}
                    className="overflow-hidden rounded-3xl border-2 border-[#FF074E] bg-card transition-shadow hover:shadow-lg"
                  >
                    <Link
                      href={`/examples/${slug}`}
                      aria-label={`View full ${identity.name} site preview`}
                      className="block"
                    >
                      <div
                        aria-hidden="true"
                        className="pointer-events-none h-[460px] select-none overflow-hidden"
                        style={{
                          WebkitMaskImage: "linear-gradient(to bottom, black 82%, transparent 100%)",
                          maskImage: "linear-gradient(to bottom, black 82%, transparent 100%)",
                        }}
                      >
                        <StoryScreen identity={identity} />
                      </div>
                    </Link>
                    <div className="flex flex-col gap-2 p-5 pt-3">
                      <span className="proto-lib-chip" style={{ alignSelf: "flex-start" }}>
                        {identity.name}
                      </span>
                      <span className="proto-mono" style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                        “{identity.prompt}”
                      </span>
                      <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                        {identity.components} components
                      </span>
                      <Link
                        href={`/examples/${slug}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-[#FF074E] underline-offset-4 hover:underline"
                      >
                        View full site <ArrowRight size={15} aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>
      <ProtoFooter />
    </div>
  );
}
