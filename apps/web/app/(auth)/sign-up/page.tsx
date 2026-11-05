import Link from "next/link";
import { signInWithGoogle, signUp } from "../actions";

export default async function SignUp({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-3xl">Sign up</h1>
      <form action={signUp} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-md border border-input bg-background px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded-md border border-input bg-background px-3 py-2"
          />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Create account
        </button>
      </form>
      <form action={signInWithGoogle} className="mt-3">
        <button
          type="submit"
          className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm"
        >
          Continue with Google
        </button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Have an account? <Link href="/sign-in" className="underline">Sign in</Link>
      </p>
    </main>
  );
}
