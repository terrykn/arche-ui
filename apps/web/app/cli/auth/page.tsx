import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { authorizeCallback, denyCallback } from "./actions";
import { isLoopbackCallback } from "./loopback";

export default async function CliAuth({
  searchParams,
}: {
  searchParams: Promise<{ callback?: string; state?: string }>;
}) {
  const { callback = "", state = "" } = await searchParams;
  if (!isLoopbackCallback(callback) || !state) {
    return (
      <main className="mx-auto max-w-md px-3 py-16">
        <h1 className="font-display text-2xl">Invalid authorization request</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The callback URL must be a loopback address (http://127.0.0.1:port/…). This page never
          redirects a token anywhere else.
        </p>
      </main>
    );
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const next = `/cli/auth?callback=${encodeURIComponent(callback)}&state=${encodeURIComponent(state)}`;
    redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  }
  return (
    <main className="mx-auto max-w-md px-3 py-16">
      <h1 className="font-display text-2xl">Authorize this machine?</h1>
      <p className="mt-3 text-sm leading-relaxed">
        The Arche CLI on this computer is asking to sign in as{" "}
        <strong>{user.email}</strong>.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Authorizing stores this account&apos;s registry token on this machine so the CLI can
        install your private libraries. Anyone with access to this computer could use it. You can
        revoke it anytime in dashboard settings.
      </p>
      <div className="mt-6 flex gap-3">
        <form action={authorizeCallback}>
          <input type="hidden" name="callback" value={callback} />
          <input type="hidden" name="state" value={state} />
          <Button type="submit">Authorize</Button>
        </form>
        <form action={denyCallback}>
          <input type="hidden" name="callback" value={callback} />
          <input type="hidden" name="state" value={state} />
          <Button type="submit" variant="outline">
            Deny
          </Button>
        </form>
      </div>
    </main>
  );
}
