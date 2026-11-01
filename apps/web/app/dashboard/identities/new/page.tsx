import { createIdentity } from "../actions";

export default async function NewIdentity({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-3xl">New identity</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Starts from the Arche Default payload — manifest defaults, monochrome tokens.
      </p>
      <form action={createIdentity} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            name="name"
            required
            maxLength={80}
            placeholder="My identity"
            className="rounded-md border border-input bg-background px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Visibility
          <select name="visibility" className="rounded-md border border-input bg-background px-3 py-2">
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </label>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          Create and edit
        </button>
      </form>
    </main>
  );
}
