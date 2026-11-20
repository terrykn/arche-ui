import Link from "next/link";
import { signIn, signInWithGoogle } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/page-container";

export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next = "/dashboard" } = await searchParams;
  return (
    <PageContainer width="narrow" className="py-16">
      <h1 className="font-display text-3xl">Sign in</h1>
      <form action={signIn} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <label className="flex flex-col gap-1 text-sm">
          Email
          <Input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <Input name="password" type="password" required autoComplete="current-password" />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit">Sign in</Button>
      </form>
      <form action={signInWithGoogle} className="mt-3">
        <Button type="submit" variant="outline" className="w-full">
          Continue with Google
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        No account? <Link href="/sign-up" className="underline">Sign up</Link>
      </p>
    </PageContainer>
  );
}
