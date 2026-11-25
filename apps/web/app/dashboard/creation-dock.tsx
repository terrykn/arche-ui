"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Moon, Pipette, Sun, X } from "lucide-react";
import { DESCRIBE_WORDS } from "@arche-ui/registry-core/picker";
import type {
  BrandSwatchSet,
  FinishSelections,
  GenerationPreview,
  PalettePreviewSwatches,
  UsagePreviewOption,
} from "@/lib/generation/service";
import {
  createIdentity,
  finishGenerationAction,
  previewCustomBrandAction,
  previewWordsAction,
  startGenerationAction,
} from "./identities/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutosizeTextarea } from "@/components/autosize-textarea";
import { GeneratingLoader } from "@/components/generating-loader";
import { MiniSystemPreview } from "@/components/mini-system-preview";
import { TypefaceOptionPreview } from "@/components/typeface-option-preview";
import { GENERATION_PROMPT_MAX_LENGTH } from "@/lib/hero-prompt";

type Phase = "idle" | "generating" | "failed" | "palettes" | "typefaces" | "words" | "creating";

/** Header prompt preview stays one short line; the full text is one toggle away. */
const PROMPT_PREVIEW_LIMIT = 50;

const STEP_LABEL: Record<string, { n: string; title: string; lede: string }> = {
  words: {
    n: "Step 1 of 3",
    title: "Describe it in words",
    lede: "",
  },
  typefaces: {
    n: "Step 2 of 3",
    title: "Pick a typeface",
    lede: "",
  },
  palettes: {
    n: "Step 3 of 3",
    title: "Pick your colors",
    lede: "",
  },
};

/** sRGB channel (0–255) to linear light. */
function srgbChannelToLinear(u: number): number {
  const v = u / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function linearToSrgbChannel(u: number): number {
  const c = Math.min(1, Math.max(0, u));
  return Math.round((c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055) * 255);
}

function oklchToHexString(l: number, c: number, hDeg: number): string {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;
  const r = linearToSrgbChannel(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3);
  const g = linearToSrgbChannel(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3);
  const bl = linearToSrgbChannel(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0")}`;
}

/** Display/edit hex for an emitted token (oklch or hex); null when unparseable. */
function tokenToHex(value: string): string | null {
  const hex = value.trim().match(/^#([0-9a-f]{6})$/i);
  if (hex) return `#${hex[1]!.toLowerCase()}`;
  const match = value.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
  if (!match) return null;
  return oklchToHexString(Number(match[1]), Number(match[2]), Number(match[3]));
}

/**
 * Plain color strip (compiled light-mode tokens) — the palette row names no
 * strategy. Each strip is one whole system derived from the winning brand
 * hue (Unified: brand IS primary; Mark only: achromatic structure + vivid
 * mark; Accent: dark desaturated structure + vivid highlight); the shared
 * live preview above shows what each strategy does.
 */
function SwatchStrip({ swatches }: { swatches: PalettePreviewSwatches }) {
  const chips = [
    { label: "Background", value: swatches.surface },
    { label: "Primary", value: swatches.primary },
    { label: "Accent", value: swatches.accent },
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
 * dock; generating shows a full-screen loader, then a modal holds the brand
 * + palette and typeface picker steps.
 * What the user picks is what the draft uses — there is no reference-
 * identity retune step. Everything before
 * the final Create is in-memory — closing the modal (X, backdrop, Escape)
 * discards the preview and no library is ever created. The single insert
 * happens in finishGenerationAction, which lands straight in the Studio.
 */
export function CreationDock({ prefill }: { prefill: string }) {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [prompt, setPrompt] = React.useState("");
  const [promptExpanded, setPromptExpanded] = React.useState(false);
  const [preview, setPreview] = React.useState<GenerationPreview | null>(null);
  /** Palette row: the usage set for the mark. */
  const [usageId, setUsageId] = React.useState("");
  /** Brand row: one of five fixed colors; empty means the generation's own palette. */
  const [brandColorId, setBrandColorId] = React.useState("");
  /** Custom brand color from the picker tile ("#rrggbb"); wins over the fixed row. */
  const [customBrand, setCustomBrand] = React.useState<string | null>(null);
  /** Live preview mode: light/dark swaps the palette strips and the live
   * preview only — never the app theme. Resets to light per generation. */
  const [previewMode, setPreviewMode] = React.useState<"light" | "dark">("light");
  /** Strategy rows compiled for the custom hex (fetched — the hex is
   *  unknowable at preview time, unlike the fixed row). */
  const [customUsages, setCustomUsages] = React.useState<UsagePreviewOption[] | null>(null);
  const [customPending, setCustomPending] = React.useState(false);
  const [customError, setCustomError] = React.useState<string | null>(null);
  const customRequest = React.useRef(0);
  const [typefaceId, setTypefaceId] = React.useState("");
  /** Describe-in-words pick history (oldest → newest); past five, a new pick replaces the fifth. */
  const [wordOrder, setWordOrder] = React.useState<string[]>([]);
  /** Live words preview (both modes); null until the first word pick recompiles. */
  const [wordsSwatches, setWordsSwatches] = React.useState<BrandSwatchSet | null>(null);
  const [wordsPending, setWordsPending] = React.useState(false);
  const [wordsError, setWordsError] = React.useState<string | null>(null);
  const wordsRequest = React.useRef(0);
  const [error, setError] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState(false);
  const autoStarted = React.useRef(false);
  const router = useRouter();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const open = phase !== "idle";
  /** Picker modal (failed, steps). Generating and creating show the shared
   *  full-screen loader instead — creating says Saving changes. */
  const modalOpen = open && phase !== "generating" && phase !== "creating";

  const close = React.useCallback(() => {
    setPhase("idle");
    setPreview(null);
    setUsageId("");
    setBrandColorId("");
    setCustomBrand(null);
    setCustomUsages(null);
    setPreviewMode("light");
    setTypefaceId("");
    setWordOrder([]);
    setWordsSwatches(null);
    setWordsPending(false);
    setWordsError(null);
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
    setPromptExpanded(false);
    setError(null);
    setPreview(null);
    setUsageId("");
    setBrandColorId("");
    setCustomBrand(null);
    setCustomUsages(null);
    setPreviewMode("light");
    setTypefaceId("");
    setWordOrder([]);
    setWordsSwatches(null);
    setWordsPending(false);
    setWordsError(null);
    setPhase("generating");
    // A dropped/timed-out action rejects the promise; without this the
    // full-screen loader would spin forever with no message.
    const result = await startGenerationAction(trimmed).catch(() => null);
    if (!result) {
      setError("The generation request failed on the server — it may have timed out. Try again.");
      setPhase("failed");
      return;
    }
    if (!result.ok) {
      setError(result.message);
      setPhase("failed");
      return;
    }
    setPreview(result.preview);
    // Default to the model's own answers (Generated tile + Unified strategy);
    // the user narrows from there. Anything unpicked stays as the model generated it.
    setUsageId(result.preview.usageOptions[0]?.id ?? "");
    setTypefaceId(result.preview.typeOptions[0]?.id ?? "");
    setPhase("words");
  }, []);

  // Hero handoff (?prompt=): open the modal and generate once.
  React.useEffect(() => {
    if (prefill && !autoStarted.current) {
      autoStarted.current = true;
      window.history.replaceState(null, "", "/dashboard");
      void start(prefill);
    }
  }, [prefill, start]);

  // Escape closes (= discards); lock body scroll while open. Generating shows
  // the full-screen loader instead of the modal, so Escape only closes once
  // the picker modal is on screen.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && phase !== "generating") close();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (phase !== "generating") panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, phase, close]);

  const brandColors = preview?.brandColors ?? [];
  const typeOptions = preview?.typeOptions ?? [];
  // The palette row follows the brand instantly: every fixed brand color's
  // row is precalculated with the preview, so switching brand is a
  // tab-switch — no fetch, no waiting. The custom hex (unknowable up
  // front) fetches its rows below; no brand means the generation's own
  // row. Either way the shared live preview above shows what the pick
  // does — the rows themselves are just colors.
  const usageOptions =
    customUsages ||
    (brandColorId && preview?.brandPalettes?.[brandColorId]) ||
    preview?.usageOptions ||
    [];
  const activeUsage =
    usageOptions.find((option) => option.id === (usageId || usageOptions[0]?.id)) ?? usageOptions[0];
  // The AI's own mark color: the dreamed usage's emitted brand solid. This
  // is the default-selected Generated tile in the Brand section; picking a
  // palette strategy never changes it — only the Brand section does.
  const dreamedBrand =
    preview?.usageOptions[0]?.swatches.light.brand ??
    preview?.paletteOptions[0]?.swatches.brand ??
    "#333333";
  // A fixed row pick wins while it is selected, but the custom hex is kept:
  // returning to the Generated tile restores the color the user picked
  // instead of snapping back to the dreamed one.
  const effectiveCustomBrand = brandColorId ? null : customBrand;
  const dreamedHex = tokenToHex(dreamedBrand) ?? "#7c3aed";
  // The preview renders the compiled row only — never the raw picker hex —
  // so what it shows is exactly the solid Create stores (same pinned color,
  // same AA-gated foreground). While a fresh row compiles the last one stays
  // up instead of showing an approximation.
  const liveSwatches = activeUsage?.swatches[previewMode];

  // Custom hex rows: debounced fetch (the native picker fires
  // continuously while dragging); a stale response never wins.
  React.useEffect(() => {
    if (!preview || !effectiveCustomBrand) {
      setCustomUsages(null);
      return;
    }
    const hex = effectiveCustomBrand;
    const id = (customRequest.current += 1);
    setCustomPending(true);
    setCustomError(null);
    const timer = window.setTimeout(() => {
      void previewCustomBrandAction(preview, prompt, hex)
        .catch((err) => {
          console.error("custom brand preview failed", err);
          return null;
        })
        .then((result) => {
          if (customRequest.current !== id) return;
          setCustomPending(false);
          if (result?.ok) {
            setCustomUsages(result.options);
          } else {
            setCustomError(
              result?.message ?? "Couldn't preview palettes for that color — your pick is kept and Create still uses it.",
            );
          }
        });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [preview, effectiveCustomBrand, prompt]);

  // Live words preview for the colors step: every history change
  // recompiles the showing strategy with the word fold (debounced — the
  // resolver runs locally but the compile is server-side). Steps 1 and 2
  // show no preview; step 3 shows words + typeface + colors together.
  // Empty history means no fetch: the precomputed strategy row already
  // is the words-empty compile.
  const wordsBrandId = activeUsage?.id;
  React.useEffect(() => {
    if (!preview || phase !== "palettes" || wordOrder.length === 0) {
      setWordsSwatches(null);
      setWordsPending(false);
      return;
    }
    const history = [...wordOrder];
    const id = (wordsRequest.current += 1);
    setWordsPending(true);
    setWordsError(null);
    const timer = window.setTimeout(() => {
      void previewWordsAction(preview, prompt, {
        brandId: wordsBrandId,
        brandColorId: brandColorId || undefined,
        customBrandHex: effectiveCustomBrand ?? undefined,
        wordOrder: history,
      })
        .catch((err) => {
          console.error("words preview failed", err);
          return null;
        })
        .then((result) => {
          if (wordsRequest.current !== id) return;
          setWordsPending(false);
          if (result?.ok) {
            setWordsSwatches(result.options);
          } else {
            setWordsError(
              result?.message ?? "Couldn't preview those words — your picks are kept and Create still uses them.",
            );
          }
        });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [preview, prompt, phase, wordOrder, wordsBrandId, brandColorId, effectiveCustomBrand]);

  // The picked typeface pair renders in the live previews (words step
  // shows the default until step 2 picks one); the finish compile applies
  // the same override, so preview and draft agree.
  const activeTypeface = typeOptions.find((option) => option.id === (typefaceId || typeOptions[0]?.id)) ?? typeOptions[0];
  // The colors-step preview: word-folded shape when words are picked
  // (live recompile), else the precomputed row — plus the picked fonts.
  // The custom hex always re-skins on top (instant, client-side), so a
  // custom pick never waits on — or hides behind — the words refetch.
  const colorsSwatches = wordsSwatches?.[previewMode] ?? liveSwatches;

  const finish = async () => {
    if (preview == null) return;
    setError(null);
    setPhase("creating");
    const selections: FinishSelections = {
      // The palette row picks the brand strategy; finish re-derives the
      // strategies from the winning hue server-side, so finish agrees with
      // the preview row exactly. A custom picker hex wins over the fixed
      // row at its own hue.
      paletteId: "as-dreamed",
      brandId: usageId || usageOptions[0]?.id || "unified",
      brandColorId: brandColorId || undefined,
      customBrandHex: effectiveCustomBrand ?? undefined,
      typefaceId: typefaceId || undefined,
      chipIds: [],
      wordOrder,
    };
    const result = await finishGenerationAction(preview, prompt, selections).catch(() => null);
    // Success navigates to the Studio; failure lands back on the last step
    // with the message and nothing was stored.
    if (!result) {
      setError("Saving the draft failed on the server — it may have timed out. Nothing was created; try again.");
      setPhase("words");
      return;
    }
    if (result.ok) {
      router.push(`/dashboard/identities/${result.libraryId}/edit`);
      return;
    }
    setError(result.message);
    setPhase("words");
  };

  // Words step: pick history, oldest first. Tapping a picked word removes
  // it (restoring whatever it shadowed); past five, a new pick replaces
  // the fifth (the most recent), so the earliest picks — the deliberate
  // ones — stay. The working state derives from the history on every
  // render, so the preview and the final draft always agree.
  const toggleWord = (id: string) => {
    setWordOrder((current) => {
      if (current.includes(id)) return current.filter((c) => c !== id);
      if (current.length >= 5) return [...current.slice(0, 4), id];
      return [...current, id];
    });
  };
  // The pick history is the source of truth: every picked word renders
  // checked, so three picks always read as three. The working state
  // (last pick wins per trait, resolved server-side) still decides the
  // compile; removing a winner restores whatever it shadowed.

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

      {modalOpen ? (
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
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl">
                  {phase === "failed"
                    ? "Generation failed"
                    : phase === "palettes" || phase === "typefaces" || phase === "words"
                      ? STEP_LABEL[phase]?.title
                      : "Create identity"}
                </h2>
                {prompt ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Prompt:</span> "
                    {promptExpanded || prompt.length <= PROMPT_PREVIEW_LIMIT
                      ? prompt
                      : `${prompt.slice(0, PROMPT_PREVIEW_LIMIT).trimEnd()}…`}
                    "{" "}
                    {prompt.length > PROMPT_PREVIEW_LIMIT ? (
                      <button
                        type="button"
                        onClick={() => setPromptExpanded((value) => !value)}
                        className="font-medium text-foreground underline underline-offset-2"
                      >
                        {promptExpanded ? "View less" : "View more"}
                      </button>
                    ) : null}
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
                {colorsSwatches ? (
                  <div className="flex flex-col gap-1.5" data-testid="live-preview">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Live preview
                      </p>
                      <button
                        type="button"
                        onClick={() => setPreviewMode((mode) => (mode === "light" ? "dark" : "light"))}
                        aria-label={previewMode === "light" ? "Show dark preview" : "Show light preview"}
                        title={previewMode === "light" ? "Show dark preview" : "Show light preview"}
                        className="rounded-full p-1.5 text-muted-foreground hover:text-foreground"
                      >
                        {previewMode === "light" ? (
                          <Moon size={14} aria-hidden="true" />
                        ) : (
                          <Sun size={14} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    <MiniSystemPreview
                      swatches={colorsSwatches}
                      size="full"
                      label="Live identity preview"
                      displayFont={activeTypeface?.display}
                      bodyFont={activeTypeface?.body}
                      loading={customPending || (wordOrder.length > 0 && wordsPending)}
                    />
                    {wordOrder.length > 0 && wordsError && !wordsPending ? (
                      <p className="text-xs text-muted-foreground" role="alert">
                        {wordsError}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <fieldset className="flex flex-col">
                  <legend className="mb-2 text-sm font-medium">Brand</legend>
                  <div className="flex flex-wrap gap-2" data-testid="brand-row">
                    <label
                      title="Generated brand color — selected by default, click to select, use the pipette to pick any color"
                      className={`relative cursor-pointer rounded-lg border-(length:--border-width) bg-card p-2 ${
                        !brandColorId ? "border-primary" : "border-border"
                      }`}
                    >
                      <Input
                        type="radio"
                        name="brand"
                        value="as-dreamed"
                        checked={!brandColorId}
                        onChange={() => {
                          setBrandColorId("");
                        }}
                        className="sr-only"
                      />
                      <span
                        aria-hidden
                        title="Generated brand color"
                        className="block h-8 w-16 rounded-md border border-border"
                        style={{ backgroundColor: effectiveCustomBrand ?? dreamedBrand }}
                      />
                      <span
                        title="Pick any color"
                        className="absolute -bottom-1.5 -right-1.5 rounded-full border border-border bg-card p-1 text-muted-foreground"
                      >
                        <Pipette size={12} aria-hidden="true" />
                        <input
                          type="color"
                          aria-label="Generated brand color — pick any color"
                          value={effectiveCustomBrand ?? dreamedHex}
                          onChange={(event) => {
                            setCustomBrand(event.target.value);
                            setBrandColorId("");
                          }}
                          onClick={(event) => event.stopPropagation()}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                      </span>
                    </label>
                    {brandColors.map((color) => (
                      <label
                        key={color.id}
                        className="cursor-pointer rounded-lg border-(length:--border-width) border-border bg-card p-2 has-checked:border-primary"
                      >
                        <Input
                          type="radio"
                          name="brand"
                          value={color.id}
                          checked={brandColorId === color.id}
                          onChange={() => {
                            setBrandColorId(color.id);
                          }}
                          className="sr-only"
                        />
                        <span
                          aria-hidden
                          title={color.name}
                          className="block h-8 w-16 rounded-md border border-border"
                          style={{ backgroundColor: color.swatch }}
                        />
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="flex flex-col">
                  <legend className="mb-2 text-sm font-medium">Palette</legend>
                  <div className="grid grid-cols-3 gap-2" data-testid="palette-row">
                    {usageOptions.map((option) => (
                      <label
                        key={option.id}
                        className="cursor-pointer rounded-lg border-(length:--border-width) border-border bg-card p-3 has-checked:border-primary"
                      >
                        <Input
                          type="radio"
                          name="palette"
                          value={option.id}
                          checked={activeUsage?.id === option.id}
                          onChange={() => setUsageId(option.id)}
                          className="sr-only"
                        />
                        <SwatchStrip swatches={option.swatches[previewMode]} />
                      </label>
                    ))}
                  </div>
                  {customBrand && customPending ? (
                    <p className="mt-2 text-xs text-muted-foreground" role="status">
                      Updating palettes…
                    </p>
                  ) : null}
                  {customBrand && customError && !customPending ? (
                    <p className="mt-2 text-xs text-muted-foreground" role="alert">
                      {customError}
                    </p>
                  ) : null}
                </fieldset>
              </div>
            ) : null}

            {phase === "typefaces" && preview != null ? (
              <div className="mt-4 grid grid-cols-3 gap-2" data-testid="typeface-row">
                {typeOptions.map((option) => (
                  <label
                    key={option.id}
                    className="flex cursor-pointer flex-col gap-1.5 rounded-lg border-(length:--border-width) border-border bg-card p-3 has-checked:border-primary"
                  >
                    <Input
                      type="radio"
                      name="typeface"
                      value={option.id}
                      aria-label={option.name}
                      checked={(typefaceId || typeOptions[0]?.id) === option.id}
                      onChange={() => setTypefaceId(option.id)}
                      className="sr-only"
                    />
                    <TypefaceOptionPreview option={option} />
                  </label>
                ))}
              </div>
            ) : null}

            {phase === "words" ? (
              <div className="mt-4 flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <fieldset className="flex flex-wrap gap-2">
                    <legend className="sr-only">Descriptive words</legend>
                    {DESCRIBE_WORDS.map((word) => (
                      <label
                        key={word.id}
                        className="cursor-pointer rounded-full border-(length:--border-width) border-border bg-card px-4 py-2 text-sm has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground"
                      >
                        <Input
                          type="checkbox"
                          name="words"
                          value={word.id}
                          checked={wordOrder.includes(word.id)}
                          onChange={() => toggleWord(word.id)}
                          className="sr-only"
                        />
                        {word.label}
                      </label>
                    ))}
                  </fieldset>
                  <p className="mt-3 text-xs text-muted-foreground">Pick up to 5</p>
                </div>
              </div>
            ) : null}

            {(phase === "palettes" || phase === "typefaces") && preview != null ? (
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Nothing here is final. You can refine everything in the Studio after creation.
              </p>
            ) : null}
          </div>

          {(phase === "palettes" || phase === "typefaces" || phase === "words") && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background px-4 py-4 sm:px-6">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {STEP_LABEL[phase]?.n}
                </p>
                <div className="flex gap-2">
                  {phase === "words" ? (
                    <>
                      <Button variant="outline" onClick={close}>
                        Discard
                      </Button>
                      <Button onClick={() => setPhase("typefaces")} className="w-fit">
                        Continue
                      </Button>
                    </>
                  ) : phase === "typefaces" ? (
                    <>
                      <Button variant="outline" onClick={() => setPhase("words")}>
                        Back
                      </Button>
                      <Button onClick={() => setPhase("palettes")} className="w-fit">
                        Continue to colors
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => setPhase("typefaces")}>
                        Back
                      </Button>
                      <Button onClick={() => void finish()} className="w-fit">
                        Create identity
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
      {phase === "generating" ? <GeneratingLoader /> : null}
      {phase === "creating" ? <GeneratingLoader label="Saving changes" /> : null}
    </>
  );
}
