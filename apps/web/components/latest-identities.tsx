"use client";

import * as React from "react";

interface LatestItem {
  id?: string;
  name: string;
  username: string;
  slug: string;
  version: number;
  publishedAt: string;
  prompt: string | null;
}

function CardThumb({ item }: { item: LatestItem }) {
  const [missing, setMissing] = React.useState(false);
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (missing || !base || !item.id) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${base}/storage/v1/object/public/identity-assets/${item.id}/v${item.version}/og.png`}
      alt={`${item.name} specimen`}
      loading="lazy"
      className="mb-3 w-full rounded-md border border-border"
      onError={() => setMissing(true)}
    />
  );
}

const FALLBACK: LatestItem[] = [
  { name: "90s Arcade", username: "arche", slug: "arcade", version: 1, publishedAt: "", prompt: "90s arcade" },
  { name: "Hospital", username: "arche", slug: "hospital", version: 1, publishedAt: "", prompt: "calm hospital" },
  { name: "Arche Default", username: "arche", slug: "default", version: 1, publishedAt: "", prompt: "Arche Default" },
];

/**
 * Latest-identities strip (Part 4.4a): fed by real publish data. Before any
 * user publishes, the canonical fixtures stand in — labeled as Arche-made
 * examples, never as user creations.
 */
export function LatestIdentities() {
  const [items, setItems] = React.useState<LatestItem[] | null>(null);
  React.useEffect(() => {
    let live = true;
    fetch("/api/latest")
      .then((r) => r.json())
      .then((data: { items: LatestItem[] }) => {
        if (live) setItems(data.items.length > 0 ? data.items : FALLBACK);
      })
      .catch(() => {
        if (live) setItems(FALLBACK);
      });
    return () => {
      live = false;
    };
  }, []);
  const list = items ?? FALLBACK;
  const seeded = items !== null && items === FALLBACK;
  return (
    <section aria-label="Latest identities" className="py-16">
      <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Latest identities</h2>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Fresh from the publish gate{seeded ? " — Arche-made examples while the gallery fills" : ""}.
      </p>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {list.map((item) => (
          <li key={`${item.username}/${item.slug}`} className="rounded-lg border border-border bg-card p-5">
            <CardThumb item={item} />
            <p className="font-mono text-xs text-muted-foreground">
              {seeded ? "Arche-made example" : `@${item.username}`} · v{item.version}
              {item.publishedAt ? ` · ${new Date(item.publishedAt).toLocaleDateString()}` : ""}
            </p>
            <p className="mt-1 text-lg font-bold">{item.name}</p>
            {item.prompt ? <p className="mt-1 text-sm text-muted-foreground">“{item.prompt}”</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
