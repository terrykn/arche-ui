"use client";

import * as React from "react";
import { ArrowUp, X } from "lucide-react";
import {
  derivePaletteOptions,
  EXAMPLE_RECORDS,
  WORD_CHIPS,
  type PaletteOption,
} from "@arche/registry-core/picker";
import type {
  FinishSelections,
  GenerationPreview,
} from "@/lib/generation/service";
import {
  createIdentity,
  finishGenerationAction,
  startGenerationAction,
} from "./identities/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutosizeTextarea } from "@/components/autosize-textarea";
import { GENERATION_PROMPT_MAX_LENGTH } from "@/lib/hero-prompt";

type Phase = "idle" | "dreaming" | "failed" | "palettes" | "examples" | "words" | "creating";

const STEP_LABEL: Record<string, { n: string; title: string; lede: string }> = {
  palettes: {
    n: "Step 1 of 3",
    title: "Pick a palette",
    lede: "Three ways to play the generation's own hues. Only As Dreamed is what the model actually asked for — the other two are deterministic remixes of the same anchors.",
  },
  examples: {
    n: "Step 2 of 3",
    title: "Which feels closest?",
    lede: "Reference identities, each a palette plus its typefaces and stack. Choosing one retunes the draft's anchors — or keep your palette untouched.",
  },
  words: {
    n: "Step 3 of 3",
    title: "Describe it in words",
    lede: "Chips map straight onto the design DNA — calm quiets the energy axis, retro bends the era axis. Combine freely, or skip.",
  },
};

function hueSwatch(hue: number): React.CSSProperties {
  return { backgroundColor: `oklch(0.62 0.16 ${hue})` };
}

/**
 * Creation dock + modal (dashboard hub). The prompt lives in the bottom
 * dock; generating opens a modal with the 3 picker steps. Everything before
 * the final Create is in-memory — closing the modal (X, backdrop, Escape)
 * discards the preview and no library is ever created. The single insert
 * happens in finishGenerationAction, which lands straight in the Studio.
 */
export function CreationDock({ prefill }: { prefill: string }) {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [prompt, setPrompt] = React.useState("");
  const [preview, setPreview] = React.useState<GenerationPreview | null>(null);
  const [paletteId, setPaletteId] = React.useState("as-dreamed");
  const [exampleId, setExampleId] = React.useState("");
  const [chipIds, setChipIds] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState(false);
  const autoStarted = React.useRef(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const open = phase !== "idle";

  const close = React.useCallback(() => {
    setPhase("idle");
    setPreview(null);
    setPaletteId("as-dreamed");
    setExampleId("");
    setChipIds([]);
    setError(null);
    window.history.replaceState(null, "", "/dashboard");
  }, []);

  const start = React.useCallback(async (text: string) => {
    const trimmed = text.trim().slice(0, GENERATION_PROMPT_MAX_LENGTH);
    if (!trimmed) return;
    setPrompt(trimmed);
    setError(null);
    setPreview(null);
    setPaletteId("as-dreamed");
    setExampleId("");
    setChipIds([]);
    setPhase("dreaming");
    const result = await startGenerationAction(trimmed);
    if (!result.ok) {
      setError(result.message);
      setPhase("failed");
      return;
    }
    setPreview(result.preview);
    setPhase("palettes");
  }, []);

  // Hero handoff (?prompt=): open the modal and dream once.
  React.useEffect(() => {
    if (prefill && !autoStarted.current) {
      autoStarted.current = true;
      window.history.replaceState(null, "", "/dashboard");
      void start(prefill);
    }
  }, [prefill, start]);

  // Escape closes (= discards); lock body scroll while open.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, phase, close]);

  const options: [PaletteOption, PaletteOption, PaletteOption] | null =
    preview != null ? derivePaletteOptions(preview.palette, preview.profile) : null;

  const finish = async () => {
    if (preview == null) return;
    setError(null);
    setPhase("creating");
    const selections: FinishSelections = {
      paletteId,
      exampleId: exampleId || undefined,
      chipIds,
    };
    const result = await finishGenerationAction(preview, prompt, selections);
    // Success redirects to the Studio (never resolves). Failure lands back
    // on the last step with the message; nothing was stored.
    setError(result.message);
    setPhase("words");
  };

  const toggleChip = (id: string) => {
    setChipIds((current) => (current.includes(id) ? current.filter((c) => c !== id) : [...current, id]));
  };

  return (
    <>
      <div className="mx-auto mt-8 w-full max-w-xl">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void start(String(data.get("prompt") ?? ""));
          }}
        >
          <div className={`flex items-end gap-2 border-(length:--border-width) border-input bg-background py-1.5 pl-5 pr-1.5 ${expanded ? "rounded-3xl" : "rounded-full"}`}>
            <AutosizeTextarea
              name="prompt"
              required
              onExpandChange={setExpanded}
              maxLength={GENERATION_PROMPT_MAX_LENGTH}
              placeholder="Describe your design system"
              aria-label="Describe your design system"
              defaultValue={prefill}
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
              aria-label="Generate identity"
              className="shrink-0 rounded-full bg-primary p-2 text-primary-foreground transition-opacity hover:opacity-90"
            >
              <ArrowUp size={20} aria-hidden="true" />
            </button>
          </div>
        </form>
        <form action={createIdentity} className="mt-2 text-center">
          <p className="text-sm text-muted-foreground">
            or{" "}
            <button type="submit" className="underline underline-offset-4 hover:text-foreground">
              Start from a Default Template
            </button>
          </p>
        </form>
      </div>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create identity"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            ref={panelRef}
            tabIndex={-1}
            className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-xl border-(length:--border-width) border-border bg-background p-6 outline-none"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                {phase === "palettes" || phase === "examples" || phase === "words" || phase === "creating" ? (
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {STEP_LABEL[phase === "creating" ? "words" : phase]?.n ?? "Creating"}
                  </p>
                ) : null}
                <h2 className="font-display text-2xl">
                  {phase === "dreaming"
                    ? "Dreaming…"
                    : phase === "failed"
                      ? "Generation failed"
                      : phase === "creating"
                        ? "Creating your identity…"
                        : (phase === "palettes" || phase === "examples" || phase === "words"
                          ? STEP_LABEL[phase]?.title
                          : "Create identity")}
                </h2>
                {prompt ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">“{prompt}”</span>
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close and discard"
                title="Close and discard"
                className="shrink-0 rounded-full border-(length:--border-width) border-border p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {phase === "dreaming" || phase === "creating" ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {phase === "dreaming"
                  ? "One model call turns your phrase into design DNA. Nothing is saved yet — closing discards it."
                  : "Compiling your selections into a private draft…"}
              </p>
            ) : null}

            {phase === "failed" ? (
              <div className="mt-4">
                <p role="alert" className="rounded-md border-(length:--border-width) border-destructive/40 bg-card p-3 text-sm text-destructive">
                  {error ?? "Generation failed."}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => void start(prompt)}>Try again</Button>
                  <Button variant="outline" onClick={close}>
                    Discard
                  </Button>
                </div>
              </div>
            ) : null}

            {(phase === "palettes" || phase === "examples" || phase === "words") && options != null ? (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {STEP_LABEL[phase]?.lede}
              </p>
            ) : null}

            {error != null && (phase === "palettes" || phase === "examples" || phase === "words") ? (
              <p role="alert" className="mt-4 rounded-md border-(length:--border-width) border-destructive/40 bg-card p-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            {phase === "palettes" && options != null ? (
              <div className="mt-4 flex flex-col gap-3">
                {options.map((option) => (
                  <label
                    key={option.id}
                    className="flex cursor-pointer flex-col gap-2 rounded-lg border-(length:--border-width) border-border bg-card p-4 has-checked:border-primary"
                  >
                    <span className="flex items-center gap-2">
                      <Input
                        type="radio"
                        name="palette"
                        value={option.id}
                        checked={paletteId === option.id}
                        onChange={() => setPaletteId(option.id)}
                        className="h-4 w-4"
                      />
                      <span className="font-medium">{option.name}</span>
                    </span>
                    <span className="flex gap-1.5" aria-hidden>
                      {[option.anchors.primaryHue, option.anchors.accentHue, option.anchors.neutralHue].map((hue) => (
                        <span key={hue} style={hueSwatch(hue)} className="h-6 w-10 rounded" />
                      ))}
                    </span>
                    <span className="text-sm text-muted-foreground">{option.reason}</span>
                  </label>
                ))}
                <div className="mt-2 flex gap-2">
                  <Button onClick={() => setPhase("examples")} className="w-fit">
                    Continue to examples
                  </Button>
                  <Button variant="outline" onClick={close}>
                    Discard
                  </Button>
                </div>
              </div>
            ) : null}

            {phase === "examples" ? (
              <div className="mt-4 flex flex-col gap-3">
                <label className="flex cursor-pointer flex-col gap-1 rounded-lg border-(length:--border-width) border-border bg-card p-4 has-checked:border-primary">
                  <span className="flex items-center gap-2">
                    <Input
                      type="radio"
                      name="example"
                      value=""
                      checked={exampleId === ""}
                      onChange={() => setExampleId("")}
                      className="h-4 w-4"
                    />
                    <span className="font-medium">Keep my palette</span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Skip the retune — carry the palette choice from step 1 into the words.
                  </span>
                </label>
                {EXAMPLE_RECORDS.map((record) => (
                  <label
                    key={record.id}
                    className="flex cursor-pointer flex-col gap-1 rounded-lg border-(length:--border-width) border-border bg-card p-4 has-checked:border-primary"
                  >
                    <span className="flex items-center gap-2">
                      <Input
                        type="radio"
                        name="example"
                        value={record.id}
                        checked={exampleId === record.id}
                        onChange={() => setExampleId(record.id)}
                        className="h-4 w-4"
                      />
                      <span className="font-medium">{record.title}</span>
                    </span>
                    <span className="text-sm text-muted-foreground">{record.blurb}</span>
                    <span className="text-xs text-muted-foreground">
                      {record.typefaces.join(" + ")} · {record.stack.join(" / ")}
                    </span>
                  </label>
                ))}
                <div className="mt-2 flex gap-2">
                  <Button onClick={() => setPhase("words")} className="w-fit">
                    Continue to words
                  </Button>
                  <Button variant="outline" onClick={() => setPhase("palettes")}>
                    Back
                  </Button>
                </div>
              </div>
            ) : null}

            {phase === "words" ? (
              <div className="mt-4 flex flex-col gap-3">
                <fieldset className="flex flex-wrap gap-2">
                  <legend className="sr-only">Descriptive words</legend>
                  {WORD_CHIPS.map((chip) => (
                    <label
                      key={chip.id}
                      className="cursor-pointer rounded-full border-(length:--border-width) border-border bg-card px-4 py-2 text-sm has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground"
                    >
                      <Input
                        type="checkbox"
                        name="chips"
                        value={chip.id}
                        checked={chipIds.includes(chip.id)}
                        onChange={() => toggleChip(chip.id)}
                        className="sr-only"
                      />
                      {chip.label}
                    </label>
                  ))}
                </fieldset>
                <div className="mt-2 flex gap-2">
                  <Button onClick={() => void finish()} className="w-fit">
                    Create identity
                  </Button>
                  <Button variant="outline" onClick={() => setPhase("examples")}>
                    Back
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Creates one private draft and opens it in the Studio. Closing now discards everything.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
