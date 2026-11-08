import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CHANGELOG } from "@/lib/changelog";

export default async function DashboardHome() {
  const supabase = await createClient();
  const { data: libraries } = await supabase
    .from("libraries")
    .select("id,name,slug,visibility,updated_at")
    .order("updated_at", { ascending: false });

  const latest = CHANGELOG[0]!;
  const whatsNew = (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-lg">What&apos;s new</CardTitle>
        <CardDescription>
          {latest.date} — {latest.title}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button variant="outline" size="sm" asChild>
          <Link href="/changelog">Read the changelog</Link>
        </Button>
      </CardFooter>
    </Card>
  );
  if (!libraries || libraries.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-3xl">Your identities</CardTitle>
            <CardDescription>
              You don&apos;t have any identities yet. Create one to get an installable component library.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="default" asChild>
              <Link href="/dashboard/identities/new">Create identity</Link>
            </Button>
          </CardFooter>
        </Card>
        {whatsNew}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-foreground">Your identities</h1>
        <Button variant="default" asChild>
          <Link href="/dashboard/identities/new">New Identity</Link>
        </Button>
      </div>
      <Separator className="my-6" />
      {whatsNew}
      <ul className="mt-8 grid gap-4">
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
    </main>
  );
}
