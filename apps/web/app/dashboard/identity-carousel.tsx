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

export function IdentityCarousel({ libraries }: { libraries: IdentityRow[] }) {
  return (
    <div className="pt-6">
      <Carousel slideClassName="w-64 shrink-0 snap-start" label="Your identities">
        {libraries.map((library) => (
          <Card key={library.id} className="relative min-h-40 overflow-hidden">
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
