import { createIdentity, generatePhraseAction } from "../actions";

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
        Start blank or describe a vibe — generated identities land as private
        drafts you edit before publishing.
      </p>
      {error ? (
        <p role="alert" className="mt-4 rounded-md border border-destructive/40 bg-card p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <section className="mt-8 rounded-lg border border-border p-4">
        <h2 className="font-medium">Describe a vibe</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A phrase like “90s arcade” or “quiet hospital calm” becomes design DNA.
        </p>
        <form action={generatePhraseAction} className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Phrase
            <input
              name="prompt"
              required
              maxLength={120}
              placeholder="ember glow"
              className="rounded-md border border-input bg-background px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Name <span className="text-muted-foreground">(optional — defaults to the phrase)</span>
            <input
              name="name"
              maxLength={80}
              placeholder="My identity"
              className="rounded-md border border-input bg-background px-3 py-2"
            />
          </label>
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            Generate draft
          </button>
        </form>
      </section>

      <section className="mt-4 rounded-lg border border-border p-4">
        <h2 className="font-medium">Start blank</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          From the Arche Default payload — manifest defaults, monochrome tokens.
        </p>
        <form action={createIdentity} className="mt-3 flex flex-col gap-3">
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
          <button type="submit" className="rounded-md border border-border px-4 py-2 text-sm">
            Create and edit
          </button>
        </form>
      </section>
    </main>
  );
}
