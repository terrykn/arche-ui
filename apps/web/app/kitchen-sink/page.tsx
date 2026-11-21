import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { KitchenSink } from "@/components/kitchen-sink";
import { Hero } from "@/components/blocks/hero";
import { Cta } from "@/components/blocks/cta";
import { Pricing } from "@/components/blocks/pricing";
import { IdentityFontLinks } from "@/components/identity-fonts";
import { SiteNav } from "@/components/site-nav";
import { PageContainer } from "@/components/page-container";

function loadFonts() {
  const found = [process.cwd(), join(process.cwd(), "..", "..")];
  for (const base of found) {
    try {
      return JSON.parse(readFileSync(join(base, "fixtures", "identity.default.json"), "utf8")).fonts;
    } catch {
      continue;
    }
  }
  throw new Error("fixture not found: identity.default.json");
}

/**
 * Kitchen sink: everyday product UI in one place, rendered in the site's
 * own theme. Interactive controls are live — sign in, quote form, chat,
 * verification code, and preferences all accept input.
 */
export default function KitchenSinkPage() {
  return (
    <>
      <IdentityFontLinks fonts={loadFonts()} />
      <SiteNav />
      <PageContainer width="wide" className="py-8">
        <p className="text-sm text-muted-foreground">
          <Link href="/" className="underline">Arche</Link> · kitchen sink
        </p>
        <h1 className="font-display text-3xl">Kitchen sink</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ten everyday product cards — auth, forms, lists, finance, chat, verification, preferences, brand moments —
          plus the brand block treatments: hero focal word + brand CTA, brand CTA section, featured pricing tier.
        </p>
        <div className="mt-6">
          <KitchenSink />
        </div>
        {/* Brand blocks (Brand Token brief): the only block surfaces that
            spend the brand. Rendered in the site theme, light and dark. */}
        <div className="mt-6 grid gap-6 rounded-xl border-(length:--border-width) border-border p-4">
          <Hero
            headline="Packing that pays for itself"
            focalWord="itself"
            subhead="One loud brand moment opens the page: the focal word and the primary CTA."
            actions={[{ label: "Start packing", href: "#get-started" }]}
            ctaVariant="brand"
          />
          <Cta
            variant="brand"
            headline="Sale week ends Sunday"
            body="The loudest brand moment on the page — exactly one per page."
            actionLabel="Shop the sale"
          />
          <Pricing headline="Brand on the featured tier only" />
        </div>
      </PageContainer>
    </>
  );
}
