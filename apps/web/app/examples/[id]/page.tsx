import Link from "next/link";
import { notFound } from "next/navigation";
import { ProtoAurora, ProtoNav, ProtoFooter } from "@/components/proto-shell";
import { DEMO_IDENTITIES } from "@/components/demo-identities";
import { StoryScreen } from "@/components/story-screens";
import { siteSlug } from "../page";

export function generateStaticParams() {
  return DEMO_IDENTITIES.map((identity) => ({ id: siteSlug(identity.name) }));
}

/**
 * Full site preview: the whole prompt-built site, large, under its own
 * generated identity.
 */
export default async function ExampleSitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const identity = DEMO_IDENTITIES.find((entry) => siteSlug(entry.name) === id);
  if (!identity) {
    notFound();
  }
  return (
    <div className="proto-root">
      <ProtoAurora />
      <ProtoNav />
      <div className="proto-view">
        <div className="proto-wrap">
          <section className="proto-section">
            <Link href="/examples" className="text-sm text-muted-foreground underline">
              ← All example sites
            </Link>
            <h2 className="mt-2">{identity.name}</h2>
            <p className="proto-lede">“{identity.prompt}” · {identity.components} components</p>
            <div className="proto-browser">
              <div className="proto-chrome">
                <span className="proto-chrome-dots" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
                <span className="proto-url">
                  examples/{siteSlug(identity.name)}
                </span>
                <span className="proto-lib-tag">{identity.name}</span>
              </div>
              <StoryScreen identity={identity} />
            </div>
            <p className="proto-demo-caption">
              Full site preview — every screen is skinned live by its own generated identity.
              All people, titles, and figures are fictional.
            </p>
          </section>
        </div>
      </div>
      <ProtoFooter />
    </div>
  );
}
