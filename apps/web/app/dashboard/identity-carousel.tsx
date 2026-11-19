"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel } from "@/components/carousel";
import { tokenVars } from "@/lib/fixtures-client";

export type IdentityRow = {
  id: string;
  name: string;
  slug: string;
  visibility: string;
  updated_at: string;
  payload: unknown;
};

/** The library's own tokens as CSS vars (dark by default); empty when unsaved. */
function libraryVars(payload: unknown, mode: "light" | "dark"): Record<string, string> {
  const tokens = (payload as { tokens?: unknown } | null)?.tokens;
  if (!tokens || typeof tokens !== "object") return {};
  return tokenVars(
    { tokens: tokens as Record<string, Record<string, { $type: string; $value: unknown }>> },
    mode,
  );
}

export function IdentityCarousel({ libraries }: { libraries: IdentityRow[] }) {
  return (
    <div className="pt-6">
      <Carousel slideClassName="w-64 shrink-0 snap-start" label="Your identities">
        {libraries.map((library) => (
          <Card
            key={library.id}
            style={libraryVars(library.payload, "dark")}
            className="dark relative min-h-40 overflow-hidden font-sans"
          >
            <CardHeader>
              <CardTitle className="font-display">
                <Link
                  href={`/dashboard/identities/${library.id}/edit`}
                  className="underline-offset-4 hover:underline"
                >
                  {library.name}
                </Link>
              </CardTitle>
              <Badge variant="secondary" className="w-fit">
                {library.visibility}
              </Badge>
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
