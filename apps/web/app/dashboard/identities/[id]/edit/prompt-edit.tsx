"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { applyPromptEditAction } from "../../actions";

/**
 * Prompt edit (§7): natural-language nudge applied as a DNA delta, then
 * recompiled. Draft only — never auto-publishes. Only rendered for
 * identities that carry stored DNA; hand-built ones have no DNA to edit.
 */
export function PromptEdit({ libraryId }: { libraryId: string }) {
  const router = useRouter();
  const [prompt, setPrompt] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<
    | { ok: true; delta: Record<string, unknown>; diffCount: number }
    | { ok: false; message: string }
    | null
  >(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setResult(null);
    const out = await applyPromptEditAction(libraryId, prompt);
    setBusy(false);
    if (out.ok) {
      setResult({ ok: true, delta: out.delta ?? {}, diffCount: out.diffCount ?? 0 });
      setPrompt("");
      router.refresh();
    } else {
      setResult({ ok: false, message: out.issues?.[0]?.message ?? "edit failed" });
    }
  };

  return (
    <section className="rounded-lg border-(length:--border-width) border-border p-4">
      <h2 className="font-medium">Prompt edit</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Describe the change (“warmer, less playful”) — only the implicated DNA
        fields recompile. Unrelated fields stay byte-identical.
      </p>
      <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="sr-only">Edit prompt</span>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={280}
            placeholder="make it calmer and more formal"
            className="rounded-md border-(length:--border-width) border-input bg-background px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !prompt.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Recompiling…" : "Apply edit"}
        </button>
      </form>
      {result?.ok ? (
        <p role="status" className="mt-2 text-sm text-muted-foreground">
          Applied — {result.diffCount} fields changed.{" "}
          <code className="text-xs">{JSON.stringify(result.delta).slice(0, 160)}</code>
        </p>
      ) : null}
      {result && !result.ok ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {result.message}
        </p>
      ) : null}
    </section>
  );
}
