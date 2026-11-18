"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, X } from "lucide-react";
import { WORD_CHIPS } from "@arche/registry-core/picker";
import type {
  FinishSelections,
  GenerationPreview,
  PalettePreviewSwatches,
} from "@/lib/generation/service";
import {
  createIdentity,
  finishGenerationAction,
  startGenerationAction,
} from "./identities/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutosizeTextarea } from "@/components/autosize-textarea";
import { MiniSystemPreview } from "@/components/mini-system-preview";
import { TypefaceOptionPreview } from "@/components/typeface-option-preview";
import { GENERATION_PROMPT_MAX_LENGTH } from "@/lib/hero-prompt";

type Phase = "idle" | "generating" | "failed" | "palettes" | "typefaces" | "words" | "creating";

const STEP_LABEL: Record<string, { n: string; title: string; lede: string }> = {
  palettes: {
    n: "Step 1 of 3",
    title: "Pick your colors",
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

/** Brand-row reasons rendered as sentences (the draft stores the raw id). */
const BRAND_REASON: Record<string, string> = {
  "as-dreamed": "The generation's own brand hue, untouched.",
  "brand-equals-primary": "The mark takes the primary hue — one family, unified.",
  "bold-accentHue": "The accent hue as the mark; it clears the distinctness gate against primary.",
  "bold-rotated-60": "Brand hue rotated 60° for a mark that is clearly its own color.",
  "bold-rotated-120": "Brand hue rotated 120° — the accent candidate collapsed onto primary.",
};

/**
 * Plain color strip per palette/brand option (compiled light-mode tokens).
 * The shared live preview above already shows the composed UI — the rows
 * only need to separate the options by their colors.
 */
function SwatchStrip({ swatches }: { swatches: PalettePreviewSwatches }) {
  const chips = [
    { label: "Surface", value: swatches.surface },
    { label: "Primary", value: swatches.primary },
    { label: "Accent", value: swatches.accent },
    { label: "Brand", value: swatches.brand },
    { label: "Secondary", value: swatches.secondary },
  ];
  return (
    <span aria-hidden data-testid="palette-swatches" className="flex gap-1">
      {chips.map((chip) => (
        <span
          key={chip.label}
          title={chip.label}
          className="h-8 flex-1 rounded-md border border-border"
          style={{ backgroundColor: chip.value }}
        />
      ))}
    </span>
  );
}

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
  const [brandId, setBrandId] = React.useState("");
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
    setBrandId("");
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
    setBrandId("");
    setTypefaceId("");
    setChipIds([]);
    setPhase("generating");
    const result = await startGenerationAction(trimmed);
    if (!result.ok) {
      setError(result.message);
      setPhase("failed");
      return;
    }
    setPreview(result.preview);
    // Default to the model's own answers ("As Generated" in both rows); the
    // user narrows from there. Anything unpicked stays as the model generated it.
    setPaletteId(result.preview.paletteOptions[0]?.id ?? "");
    setBrandId(result.preview.brandOptions[0]?.id ?? "");
    setTypefaceId(result.preview.typeOptions[0]?.id ?? "");
    setPhase("palettes");
  }, []);

  // Hero handoff (?prompt=): open the modal and generate once.
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
  const brandOptions = preview?.brandOptions ?? [];
  const typeOptions = preview?.typeOptions ?? [];
  // Live preview state: one shared preview above both rows. Selections only
  // move local state — the compiled swatches already ship with the preview,
  // so re-skinning is instant and free of model calls.
  const activePalette =
    paletteOptions.find((option) => option.id === (paletteId || paletteOptions[0]?.id)) ??
    paletteOptions[0];
  const activeBrand =
    brandOptions.find((option) => option.id === (brandId || brandOptions[0]?.id)) ?? brandOptions[0];
  const liveSwatches = activeBrand?.combinations[activePalette?.id ?? ""]?.light ?? activePalette?.swatches;

  const finish = async () => {
    if (preview == null) return;
    setError(null);
    setPhase("creating");
    const selections: FinishSelections = {
      paletteId: paletteId || paletteOptions[0]?.id || "as-dreamed",
      brandId: brandId || brandOptions[0]?.id || "as-dreamed",
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
            className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border-(length:--border-width) border-border bg-background outline-none"
          >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl">
                  {phase === "generating"
                    ? "Generating…"
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

            {phase === "creating" ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Compiling your selections into a private draft…
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

            {(phase === "palettes" || phase === "typefaces") &&
            preview != null &&
            STEP_LABEL[phase]?.lede ? (
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
              <div className="mt-4 flex flex-col gap-5">
                {liveSwatches ? (
                  <div className="flex flex-col gap-1.5" data-testid="live-preview">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Live preview
                    </p>
                    <MiniSystemPreview
                      swatches={liveSwatches}
                      size="full"
                      label="Live identity preview"
                    />
                  </div>
                ) : null}

                <fieldset className="flex flex-col">
                  <legend className="mb-2 text-sm font-medium">Palette</legend>
                  <div className="grid gap-2 sm:grid-cols-3" data-testid="palette-row">
                    {paletteOptions.map((option) => (
                      <label
                        key={option.id}
                        className="flex cursor-pointer flex-col gap-2 rounded-lg border-(length:--border-width) border-border bg-card p-3 has-checked:border-primary"
                      >
                        <span className="flex items-center gap-2">
                          <Input
                            type="radio"
                            name="palette"
                            value={option.id}
                            checked={activePalette?.id === option.id}
                            onChange={() => setPaletteId(option.id)}
                            className="h-4 w-4"
                          />
                          <span className="text-sm font-medium">{option.name}</span>
                        </span>
                        <SwatchStrip swatches={option.swatches} />
                        <span className="text-xs text-muted-foreground">{option.reason}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {brandOptions.length > 0 ? (
                  <fieldset className="flex flex-col">
                    <legend className="mb-2 text-sm font-medium">Brand</legend>
                    <div className="grid gap-2 sm:grid-cols-3" data-testid="brand-row">
                      {brandOptions.map((option) => {
                        const swatches =
                          option.combinations[activePalette?.id ?? ""]?.light ??
                          Object.values(option.combinations)[0]?.light;
                        return (
                          <label
                            key={option.id}
                            className="flex cursor-pointer flex-col gap-2 rounded-lg border-(length:--border-width) border-border bg-card p-3 has-checked:border-primary"
                          >
                            <span className="flex items-center gap-2">
                              <Input
                                type="radio"
                                name="brand"
                                value={option.id}
                                checked={activeBrand?.id === option.id}
                                onChange={() => setBrandId(option.id)}
                                className="h-4 w-4"
                              />
                              <span className="text-sm font-medium">{option.name}</span>
                            </span>
                            {swatches ? (
                              <span
                                aria-hidden
                                data-testid="brand-swatch"
                                title="Brand color"
                                className="h-12 rounded-md border border-border"
                                style={{ backgroundColor: swatches.brand }}
                              />
                            ) : null}
                            <span className="text-xs font-medium">{option.roleLabel}</span>
                            <span className="text-xs text-muted-foreground">
                              {BRAND_REASON[option.reason] ?? option.reason}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                ) : null}


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
              </div>
            ) : null}
          </div>

          {(phase === "palettes" || phase === "typefaces" || phase === "words") && (
            <div className="flex items-center justify-between gap-3 border-t border-border bg-background px-6 py-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {STEP_LABEL[phase]?.n}
                </p>
                <div className="flex gap-2">
                  {phase === "palettes" ? (
                    <>
                      <Button onClick={() => setPhase("typefaces")} className="w-fit">
                        Continue
                      </Button>
                      <Button variant="outline" onClick={close}>
                        Discard
                      </Button>
                    </>
                  ) : phase === "typefaces" ? (
                    <>
                      <Button onClick={() => setPhase("words")} className="w-fit">
                        Continue to words
                      </Button>
                      <Button variant="outline" onClick={() => setPhase("palettes")}>
                        Back
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => void finish()} className="w-fit">
                        Create identity
                      </Button>
                      <Button variant="outline" onClick={() => setPhase("typefaces")}>
                        Back
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
