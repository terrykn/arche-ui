"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, X } from "lucide-react";
import { WORD_CHIPS } from "@arche/registry-core/picker";
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
import { PaletteVariantPreview } from "@/components/palette-variant-preview";
import { TypefaceOptionPreview } from "@/components/typeface-option-preview";
import { GENERATION_PROMPT_MAX_LENGTH } from "@/lib/hero-prompt";

type Phase = "idle" | "dreaming" | "failed" | "palettes" | "typefaces" | "words" | "creating";

const STEP_LABEL: Record<string, { n: string; title: string; lede: string }> = {
  palettes: {
    n: "Step 1 of 3",
    title: "Pick a palette",
    lede: "",
  },
  typefaces: {
    n: "Step 2 of 3",
    title: "Pick a typeface",
    lede: "Three header/body pairings from your prompt — a separate choice, never bundled with a palette. The winner sets the draft's fonts.",
  },
  words: {
    n: "Step 3 of 3",
    title: "Describe it in words",
    lede: "",
  },
};



/**
 * Creation dock + modal (dashboard hub). The prompt lives in the bottom
 * dock; generating opens a modal with the palette and typeface picker steps.
 * What the user picks is what the draft uses — there is no reference-
 * identity retune step. Everything before
 * the final Create is in-memory — closing the modal (X, backdrop, Escape)
 * discards the preview and no library is ever created. The single insert
 * happens in finishGenerationAction, which lands straight in the Studio.
 */
export function CreationDock({ prefill }: { prefill: string }) {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [prompt, setPrompt] = React.useState("");
  const [preview, setPreview] = React.useState<GenerationPreview | null>(null);
  const [paletteId, setPaletteId] = React.useState("");
  const [typefaceId, setTypefaceId] = React.useState("");
  const [chipIds, setChipIds] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState(false);
  const autoStarted = React.useRef(false);
  const router = useRouter();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const open = phase !== "idle";

  const close = React.useCallback(() => {
    setPhase("idle");
    setPreview(null);
    setPaletteId("");
    setTypefaceId("");
    setChipIds([]);
    setError(null);
    window.history.replaceState(null, "", "/dashboard");
  }, []);

  const confirmClose = React.useCallback(() => {
    if (window.confirm("Are you sure you want to cancel? This will delete your progress.")) {
      close();
    }
  }, [close]);

  const start = React.useCallback(async (text: string) => {
    const trimmed = text.trim().slice(0, GENERATION_PROMPT_MAX_LENGTH);
    if (!trimmed) return;
    setPrompt(trimmed);
    setError(null);
    setPreview(null);
    setPaletteId("");
    setTypefaceId("");
    setChipIds([]);
    setPhase("dreaming");
    const result = await startGenerationAction(trimmed);
    if (!result.ok) {
      setError(result.message);
      setPhase("failed");
      return;
    }
    setPreview(result.preview);
    // Default to the model's first proposal in each step; the user narrows
    // from there. Anything unpicked stays as the model dreamed it.
    setPaletteId(result.preview.paletteOptions[0]?.id ?? "");
    setTypefaceId(result.preview.typeOptions[0]?.id ?? "");
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

  const paletteOptions = preview?.paletteOptions ?? [];
  const typeOptions = preview?.typeOptions ?? [];

  const finish = async () => {
    if (preview == null) return;
    setError(null);
    setPhase("creating");
    const selections: FinishSelections = {
      paletteId: paletteId || paletteOptions[0]?.id || "as-dreamed",
      typefaceId: typefaceId || undefined,
      chipIds,
    };
    const result = await finishGenerationAction(preview, prompt, selections);
    // Success navigates to the Studio; failure lands back on the last step
    // with the message and nothing was stored.
    if (result.ok) {
      router.push(`/dashboard/identities/${result.libraryId}/edit`);
      return;
    }
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
                {phase === "palettes" || phase === "typefaces" || phase === "words" || phase === "creating" ? (
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
                        : (phase === "palettes" || phase === "typefaces" || phase === "words"
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
                onClick={confirmClose}
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

            {phase === "typefaces" && preview != null && STEP_LABEL[phase]?.lede ? (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {STEP_LABEL[phase]?.lede}
              </p>
            ) : null}

            {error != null && (phase === "palettes" || phase === "typefaces" || phase === "words") ? (
              <p role="alert" className="mt-4 rounded-md border-(length:--border-width) border-destructive/40 bg-card p-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            {phase === "palettes" && preview != null ? (
              <div className="mt-4 flex flex-col gap-3">
                {paletteOptions.map((option) => (
                  <label
                    key={option.id}
                    className="flex cursor-pointer flex-col gap-2 rounded-lg border-(length:--border-width) border-border bg-card p-4 has-checked:border-primary"
                  >
                    <span className="flex items-center gap-2">
                      <Input
                        type="radio"
                        name="palette"
                        value={option.id}
                        checked={(paletteId || paletteOptions[0]?.id) === option.id}
                        onChange={() => setPaletteId(option.id)}
                        className="h-4 w-4"
                      />
                      <span className="font-medium">{option.name}</span>
                    </span>
                    <PaletteVariantPreview swatches={option.swatches} />
                    <span className="text-sm text-muted-foreground">{option.reason}</span>
                  </label>
                ))}
                <div className="mt-2 flex gap-2">
                  <Button onClick={() => setPhase("typefaces")} className="w-fit">
                    Continue to typefaces
                  </Button>
                  <Button variant="outline" onClick={close}>
                    Discard
                  </Button>
                </div>
              </div>
            ) : null}

            {phase === "typefaces" && preview != null ? (
              <div className="mt-4 flex flex-col gap-3">
                {typeOptions.map((option) => (
                  <label
                    key={option.id}
                    className="flex cursor-pointer flex-col gap-2 rounded-lg border-(length:--border-width) border-border bg-card p-4 has-checked:border-primary"
                  >
                    <span className="flex items-center gap-2">
                      <Input
                        type="radio"
                        name="typeface"
                        value={option.id}
                        checked={(typefaceId || typeOptions[0]?.id) === option.id}
                        onChange={() => setTypefaceId(option.id)}
                        className="h-4 w-4"
                      />
                      <span className="font-medium">{option.name}</span>
                    </span>
                    <TypefaceOptionPreview option={option} />
                    <span className="text-sm text-muted-foreground">{option.reason}</span>
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
                  <Button variant="outline" onClick={() => setPhase("typefaces")}>
                    Back
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
