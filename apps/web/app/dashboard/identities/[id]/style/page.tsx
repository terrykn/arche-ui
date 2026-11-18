import Link from "next/link";
import { redirect } from "next/navigation";
import {
  derivePaletteOptions,
  EXAMPLE_RECORDS,
  WORD_CHIPS,
  type PickerSelections,
} from "@arche/registry-core";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { applyPickerAction } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaletteOptionPreview } from "@/components/palette-option-preview";

const STEPS = ["palettes", "examples", "words", "done"] as const;
type Step = (typeof STEPS)[number];

const STEP_LABEL: Record<Step, { n: string; title: string; lede: string }> = {
  palettes: {
    n: "Step 1 of 3",
    title: "Pick a palette",
    lede: "Three ways to play the generation's own hues. Only As Generated is the model's answer — the other two are deterministic remixes of it. Names, not hexes — the compiler still owns every token.",
  },
  examples: {
    n: "Step 2 of 3",
    title: "Which feels closest?",
    lede: "Reference identities, each a palette plus its typefaces and stack. Choosing one retunes the draft's anchors.",
  },
  words: {
    n: "Step 3 of 3",
    title: "Describe it in words",
    lede: "Chips map straight onto the design DNA — calm quiets the energy axis, retro bends the era axis. Combine freely.",
  },
  done: { n: "Styled", title: "Ready for the Studio", lede: "" },
};



export default async function StyleIdentity({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }
  const service = createServiceClient();
  const { data: library } = await service
    .from("libraries")
    .select("id,name,slug,visibility,payload")
    .eq("id", id)
    .eq("owner", user.id)
    .maybeSingle();
  if (!library) {
    redirect("/dashboard");
  }
  const row = library as unknown as { name: string; payload: Record<string, unknown> };
  const payload = row.payload;
  const dna = (payload as { dna?: { axes: unknown; palette: { primaryHue: number; accentHue: number; neutralHue: number }; profile?: "enterprise" | "standard" | "expressive"; source?: unknown } }).dna;
  const stored = ((payload as { meta?: { picker?: { step?: Step; paletteId?: string; exampleId?: string; chipIds?: string[] } } }).meta?.picker ?? {}) as {
    step?: Step;
    paletteId?: string;
    exampleId?: string;
    chipIds?: string[];
  };

  if (!dna) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-md">
        <h1 className="font-display text-3xl">Style {row.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Style steps need generated DNA — this identity was made by hand, so there is nothing to restyle. Edit it directly.
        </p>
        <Button asChild className="mt-6">
          <Link href={`/dashboard/identities/${id}/edit`}>Open in Studio</Link>
        </Button>
        </div>
      </main>
    );
  }

  const requested = STEPS.includes(query.step as Step) ? (query.step as Step) : undefined;
  const step: Step = requested ?? stored.step ?? "palettes";
  const label = STEP_LABEL[step];
  const options = derivePaletteOptions(dna.palette, dna.profile ?? "standard");
  const selections: PickerSelections = {
    chipIds: stored.chipIds ?? [],
    paletteId: stored.paletteId ?? "as-dreamed",
    exampleId: stored.exampleId,
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label.n}</p>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-3xl">
          {label.title} — {row.name}
        </h1>
        <div className="flex gap-2 text-sm">
          <Link href="/dashboard" className="underline text-muted-foreground">
            Save &amp; exit
          </Link>
          <Link href={`/dashboard/identities/${id}/edit`} className="underline text-muted-foreground">
            Skip to Studio
          </Link>
        </div>
      </div>
      {step !== "done" ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{label.lede}</p> : null}
      {step === "palettes" && Array.isArray((payload as { meta?: { promptSlots?: unknown } }).meta?.promptSlots) &&
      ((payload as { meta?: { promptSlots?: unknown } }).meta!.promptSlots as string[]).length > 0 ? (
        <p className="mt-2 max-w-2xl text-sm">
          <span className="font-medium text-foreground">Understood: </span>
          <span className="text-muted-foreground">
            {((payload as { meta?: { promptSlots?: string[] } }).meta!.promptSlots as string[]).join(" · ")}
          </span>
        </p>
      ) : null}
      {query.error ? (
        <p role="alert" className="mt-4 max-w-2xl rounded-md border-(length:--border-width) border-destructive/40 bg-card p-3 text-sm text-destructive">
          {query.error}
        </p>
      ) : null}

      <div className="mt-6 max-w-2xl">
        <section aria-label={label.title}>
          {step === "palettes" ? (
            <form action={applyPickerAction.bind(null, id, "palettes")} className="flex flex-col gap-3">
              {options.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer flex-col gap-2 rounded-lg border-(length:--border-width) border-border bg-card p-4 has-checked:border-primary"
                >
                  <span className="flex items-center gap-2">
                    <Input type="radio" name="palette" value={option.id} required defaultChecked={selections.paletteId === option.id} className="h-4 w-4" />
                    <span className="font-medium">{option.name}</span>
                  </span>
                  <PaletteOptionPreview anchors={option.anchors} />
                  <span className="text-sm text-muted-foreground">{option.reason}</span>
                </label>
              ))}
              <Button type="submit" className="mt-2 w-fit">
                Continue to examples
              </Button>
            </form>
          ) : null}

          {step === "examples" ? (
            <form action={applyPickerAction.bind(null, id, "examples")} className="flex flex-col gap-3">
              {EXAMPLE_RECORDS.map((record) => (
                <label
                  key={record.id}
                  className="flex cursor-pointer flex-col gap-1 rounded-lg border-(length:--border-width) border-border bg-card p-4 has-checked:border-primary"
                >
                  <span className="flex items-center gap-2">
                    <Input type="radio" name="example" value={record.id} required defaultChecked={selections.exampleId === record.id} className="h-4 w-4" />
                    <span className="font-medium">{record.title}</span>
                  </span>
                  <span className="text-sm text-muted-foreground">{record.blurb}</span>
                  <span className="text-xs text-muted-foreground">
                    {record.typefaces.join(" + ")} · {record.stack.join(" / ")}
                  </span>
                </label>
              ))}
              <div className="mt-2 flex gap-2">
                <Button type="submit" className="w-fit">
                  Continue to words
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/dashboard/identities/${id}/style?step=palettes`}>Back</Link>
                </Button>
              </div>
            </form>
          ) : null}

          {step === "words" ? (
            <form action={applyPickerAction.bind(null, id, "words")} className="flex flex-col gap-3">
              <fieldset className="flex flex-wrap gap-2">
                <legend className="sr-only">Descriptive words</legend>
                {WORD_CHIPS.map((chip) => (
                  <label
                    key={chip.id}
                    className="cursor-pointer rounded-full border-(length:--border-width) border-border bg-card px-4 py-2 text-sm has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground"
                  >
                    <Input type="checkbox" name="chips" value={chip.id} defaultChecked={selections.chipIds.includes(chip.id)} className="sr-only" />
                    {chip.label}
                  </label>
                ))}
              </fieldset>
              <div className="mt-2 flex gap-2">
                <Button type="submit" className="w-fit">
                  Finish styling
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/dashboard/identities/${id}/style?step=examples`}>Back</Link>
                </Button>
              </div>
            </form>
          ) : null}

          {step === "done" ? (
            <div className="flex flex-col gap-3 rounded-lg border-(length:--border-width) border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">
                Styled and saved as a private draft — nothing published. Revisit any step to change it; every change recompiles
                the same draft.
              </p>
              <dl className="text-sm">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Palette</dt>
                  <dd>{options.find((o) => o.id === selections.paletteId)?.name ?? selections.paletteId ?? "—"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Closest</dt>
                  <dd>{EXAMPLE_RECORDS.find((r) => r.id === selections.exampleId)?.title ?? "—"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Words</dt>
                  <dd>{selections.chipIds.length > 0 ? selections.chipIds.join(", ") : "—"}</dd>
                </div>
              </dl>
              <div className="flex gap-2">
                <Button asChild className="w-fit">
                  <Link href={`/dashboard/identities/${id}/edit`}>Open in Studio</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/dashboard/identities/${id}/style?step=palettes`}>Restyle</Link>
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
