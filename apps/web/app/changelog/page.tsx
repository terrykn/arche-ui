import Link from "next/link";
import { ProtoAurora, ProtoNav, ProtoFooter } from "@/components/proto-shell";
import { CHANGELOG } from "@/lib/changelog";

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <ProtoAurora />
      <ProtoNav />
      <div className="proto-view">
        <div className="proto-wrap">
          <section className="py-16">
            <p className="text-sm text-muted-foreground">
              <Link href="/" className="underline">Arche</Link> · changelog
            </p>
            <h1 className="mt-2 text-5xl font-extrabold tracking-tight">Changelog</h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Real product changes, newest first. The project is a prototype — entries are honest about what shipped.
            </p>
            <ol className="mt-10 flex max-w-3xl flex-col gap-6">
              {CHANGELOG.map((entry) => (
                <li key={`${entry.date}-${entry.title}`} className="rounded-lg border border-border bg-card p-5">
                  <p className="font-mono text-xs text-muted-foreground">{entry.date}</p>
                  <h2 className="mt-1 text-xl font-bold">{entry.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{entry.body}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
      <ProtoFooter />
    </div>
  );
}
