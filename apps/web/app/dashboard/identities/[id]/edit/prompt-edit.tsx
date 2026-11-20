"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { applyPromptEditAction } from "../../actions";
import { AutosizeTextarea } from "@/components/autosize-textarea";

/**
 * Prompt edit (§7): natural-language nudge applied as a DNA delta, then
 * recompiled. Draft only — never auto-publishes. Only rendered for
 * identities that carry stored DNA; hand-built ones have no DNA to edit.
 * The input mirrors the dashboard creation dock: autosizing textarea in a
 * pill with a round arrow submit.
 */
export function PromptEdit({ libraryId }: { libraryId: string }) {
  const router = useRouter();
  const [prompt, setPrompt] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
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
    <div>
      {result?.ok ? (
        <p role="status" className="mb-2 text-xs text-muted-foreground">
          Applied — {result.diffCount} fields changed.{" "}
          <code>{JSON.stringify(result.delta).slice(0, 160)}</code>
        </p>
      ) : null}
      {result && !result.ok ? (
        <p role="alert" className="mb-2 text-xs text-destructive">
          {result.message}
        </p>
      ) : null}
      <form onSubmit={submit}>
        <div
          className={`flex items-end gap-2 border-(length:--border-width) border-input bg-background py-1.5 pl-5 pr-1.5 ${expanded ? "rounded-3xl" : "rounded-full"}`}
        >
          <AutosizeTextarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onExpandChange={setExpanded}
            maxLength={280}
            placeholder="Describe your change"
            aria-label="Describe your change"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            className="min-w-0 flex-1 resize-none bg-transparent py-2 text-sm leading-snug outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={busy || !prompt.trim()}
            aria-label="Apply AI edit"
            className="shrink-0 rounded-full bg-primary p-2 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <ArrowUp size={20} aria-hidden="true" />
          </button>
        </div>
      </form>
      {busy ? (
        <p role="status" className="mt-2 text-xs text-muted-foreground">
          Recompiling…
        </p>
      ) : null}
    </div>
  );
}
