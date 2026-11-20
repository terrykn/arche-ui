import Link from "next/link";
import { signInWithGoogle, signUp } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/page-container";

export default async function SignUp({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <PageContainer width="narrow" className="py-16">
      <h1 className="font-display text-3xl">Sign up</h1>
      <form action={signUp} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <Input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit">Create account</Button>
      </form>
      <form action={signInWithGoogle} className="mt-3">
        <Button type="submit" variant="outline" className="w-full">
          Continue with Google
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Have an account? <Link href="/sign-in" className="underline">Sign in</Link>
      </p>
    </PageContainer>
  );
}
