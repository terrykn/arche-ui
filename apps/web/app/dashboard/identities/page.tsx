import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function IdentitiesPage() {
  const supabase = await createClient();
  const { data: libraries } = await supabase
    .from("libraries")
    .select("id,name,slug,visibility,updated_at")
    .order("updated_at", { ascending: false });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-foreground">Identities</h1>
        <Button variant="default" asChild>
          <Link href="/dashboard/identities/new">
            <Plus aria-hidden="true" /> New Identity
          </Link>
        </Button>
      </div>
      <Separator className="my-6" />
      {!libraries || libraries.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No identities yet.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4">
          {libraries.map((library) => (
            <li key={library.id}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Link
                      href={`/dashboard/identities/${library.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {library.name}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    updated {new Date(library.updated_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">{library.visibility}</Badge>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
