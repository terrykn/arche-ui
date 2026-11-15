import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { KitchenSink } from "@/components/kitchen-sink";
import { IdentityFontLinks } from "@/components/identity-fonts";
import { SiteNav } from "@/components/site-nav";

function loadFonts() {
  const found = [process.cwd(), join(process.cwd(), "..", "..")];
  for (const base of found) {
    try {
      return JSON.parse(readFileSync(join(base, "fixtures", "identity.arche.json"), "utf8")).fonts;
    } catch {
      continue;
    }
  }
  throw new Error("fixture not found: identity.arche.json");
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
      <main className="mx-auto max-w-6xl px-3 py-8">
        <p className="text-sm text-muted-foreground">
          <Link href="/" className="underline">Arche</Link> · kitchen sink
        </p>
        <h1 className="font-display text-3xl">Kitchen sink</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nine everyday product cards — auth, forms, lists, finance, chat, verification, preferences.
        </p>
        <div className="mt-6">
          <KitchenSink />
        </div>
      </main>
    </>
  );
}
