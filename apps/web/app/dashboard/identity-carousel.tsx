"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel } from "@/components/carousel";

export type IdentityRow = {
  id: string;
  name: string;
  slug: string;
  visibility: string;
  updated_at: string;
  payload: unknown;
};

/** Palette swatches derived from the identity's own light color tokens. */
function paletteStops(payload: unknown): string[] {
  const tokens =
    (payload as { tokens?: { light?: Record<string, { $value?: unknown }> } | null })?.tokens
      ?.light ?? {};
  const preferred = [
    "--primary",
    "--accent",
    "--secondary",
    "--muted",
    "--card",
    "--background",
    "--foreground",
  ];
  const stops: string[] = [];
  for (const key of preferred) {
    const v = tokens[key]?.$value;
    if (typeof v === "string" && v.length > 0 && !v.includes(";") && !stops.includes(v)) {
      stops.push(v);
      if (stops.length === 5) break;
    }
  }
  if (stops.length === 0) return ["var(--muted)", "var(--accent)", "var(--card)"];
  return stops;
}

export function IdentityCarousel({ libraries }: { libraries: IdentityRow[] }) {
  return (
    <div className="pt-6">
      <Carousel slideClassName="w-64 shrink-0 snap-start" label="Your identities">
        {libraries.map((library) => (
          <Card key={library.id} className="overflow-hidden pt-0">
            <div className="relative flex h-16 border-b border-border">
              {paletteStops(library.payload).map((stop) => (
                <div key={stop} className="h-full flex-1" style={{ background: stop }} />
              ))}
              <Badge variant="secondary" className="absolute right-3 top-3">
                {library.visibility}
              </Badge>
            </div>
            <CardHeader>
              <CardTitle>
                <Link
                  href={`/dashboard/identities/${library.id}/edit`}
                  className="underline-offset-4 hover:underline"
                >
                  {library.name}
                </Link>
              </CardTitle>
              <CardDescription>
                updated {new Date(library.updated_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </Carousel>
    </div>
  );
}
