"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel } from "@/components/carousel";

export type IdentityRow = {
  id: string;
  name: string;
  slug: string;
  visibility: string;
  updated_at: string;
  payload: unknown;
};

/** Emitted brand pair from the stored payload (honest values, never illustrative fills). */
function brandOf(payload: unknown): { brand: string; onBrand: string } {
  const tokens = (payload as { tokens?: { light?: Record<string, { $value?: unknown }> } } | null)?.tokens
    ?.light;
  const str = (name: string, fallback: string): string => {
    const v = tokens?.[name]?.$value;
    return typeof v === "string" && v.length > 0 ? v : fallback;
  };
  return { brand: str("--brand", "#333333"), onBrand: str("--brand-foreground", "#ffffff") };
}

export function IdentityCarousel({ libraries }: { libraries: IdentityRow[] }) {
  return (
    <div className="pt-6">
      <Carousel slideClassName="w-64 shrink-0 snap-start" label="Your identities">
        {libraries.map((library) => {
          const { brand, onBrand } = brandOf(library.payload);
          return (
            <Link
              key={library.id}
              href={`/dashboard/identities/${library.id}/edit`}
              aria-label={`Open ${library.name}`}
              className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              style={{ "--card-hover": brand, "--card-hover-fg": onBrand } as CSSProperties}
            >
              <Card className="relative min-h-40 gap-4 overflow-hidden bg-transparent py-4 transition-colors group-hover:bg-(--card-hover) group-hover:text-(--card-hover-fg)">
                <CardHeader className="px-4">
                  <CardTitle className="font-display text-lg">{library.name}</CardTitle>
                  <Badge
                    variant="secondary"
                    className="w-fit border-transparent group-hover:bg-white/15 group-hover:text-(--card-hover-fg)"
                  >
                    {library.visibility}
                  </Badge>
                </CardHeader>
                <span
                  aria-hidden="true"
                  className="absolute right-4 bottom-4 rounded-full p-1 transition-colors"
                >
                  <ArrowRight size={22} aria-hidden="true" />
                </span>
              </Card>
            </Link>
          );
        })}
      </Carousel>
    </div>
  );
}
