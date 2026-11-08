"use client";

import * as React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { KitchenSink } from "@/components/kitchen-sink";
import { savePayload } from "../../actions";

interface TokenDef {
  name: string;
  $type: string;
}

interface KnobSpec {
  type: string;
  values?: Array<string | number>;
  value?: string;
  scale?: string[];
  default: unknown;
}

interface Manifest {
  name: string;
  title: string;
  description: string;
  category: string;
  axes: Record<string, { values: Array<string | number>; default: string | number }>;
  styleSurface: Record<string, Record<string, KnobSpec>>;
  tokensUsed: string[];
}

interface Payload {
  meta: { name: string; contractVersion: number };
  fonts: { sans: string; display: string; mono: string };
  icons: string;
  typeScale?: string;
  dna?: { profile?: string };
  tokens: Record<string, Record<string, { $type: string; $value: unknown }>>;
  components: Record<string, Record<string, unknown>>;
}

function KnobControl({
  label,
  spec,
  value,
  onChange,
}: {
  label: string;
  spec: KnobSpec;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const key = (v: unknown) => JSON.stringify(v);
  if (spec.type === "enum" && spec.values) {
    return (
      <label className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <select
          value={key(value)}
          onChange={(e) => onChange(JSON.parse(e.target.value))}
          className="rounded-md border-(length:--border-width) border-input bg-background px-2 py-1"
        >
          {spec.values.map((v) => (
            <option key={key(v)} value={key(v)}>
              {String(v)}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (spec.type === "token" && spec.values) {
    return (
      <label className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md border-(length:--border-width) border-input bg-background px-2 py-1"
        >
          {spec.values.map((v) => (
            <option key={String(v)} value={String(v)}>
              {String(v)}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (spec.type === "token" && spec.value && spec.scale) {
    return (
      <label className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">
          {label} <span className="opacity-70">({spec.value})</span>
        </span>
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md border-(length:--border-width) border-input bg-background px-2 py-1"
        >
          {spec.scale.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (spec.type === "range") {
    return (
      <label className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <input
          type="number"
          value={Number(value)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 rounded-md border-(length:--border-width) border-input bg-background px-2 py-1"
        />
      </label>
    );
  }
  return (
    <p className="text-sm text-muted-foreground">
      {label}: unsupported knob type {spec.type}
    </p>
  );
}

export function IdentityEditor({
  libraryId,
  libraryName,
  initialPayload,
  manifests,
  contract,
  typeSteps,
}: {
  libraryId: string;
  libraryName: string;
  initialPayload: Payload;
  manifests: Manifest[];
  contract: { tokens: TokenDef[] };
  typeSteps: Array<{ role: string; sizePx: number; lineHeight: number }>;
}) {
  const [tokens, setTokens] = React.useState(initialPayload.tokens);
  const [components, setComponents] = React.useState(initialPayload.components);
  const [mode, setMode] = React.useState<"light" | "dark">("light");
  const [tokenMode, setTokenMode] = React.useState<"light" | "dark">("light");
  const [activeComponent, setActiveComponent] = React.useState(manifests[0]!.name);
  const [saving, setSaving] = React.useState(false);
  const [issues, setIssues] = React.useState<Array<{ path: string; message: string }> | null>(null);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);

  const manifest = manifests.find((m) => m.name === activeComponent)!;
  const selection = components[manifest.name] ?? {};

  const setToken = (name: string, field: "duration" | "easing" | null, raw: string) => {
    setTokens((prev) => {
      const current = prev[tokenMode]![name]!;
      const nextValue =
        field === null
          ? raw
          : { ...((current.$value as Record<string, string>) ?? {}), [field]: raw };
      return {
        ...prev,
        [tokenMode]: { ...prev[tokenMode], [name]: { ...current, $value: nextValue } },
      };
    });
    setSavedAt(null);
  };

  const setKnob = (knob: string, next: unknown) => {
    setComponents((prev) => ({
      ...prev,
      [manifest.name]: { ...prev[manifest.name], [knob]: next },
    }));
    setSavedAt(null);
  };

  const save = async () => {
    setSaving(true);
    setIssues(null);
    const result = await savePayload(libraryId, {
      meta: initialPayload.meta,
      // Closed-registry selections are preserved as-is (edited elsewhere, not here).
      fonts: initialPayload.fonts,
      icons: initialPayload.icons,
      typeScale: initialPayload.typeScale,
      dna: initialPayload.dna,
      tokens,
      components,
    });
    setSaving(false);
    if (!result.ok) {
      setIssues(result.issues ?? []);
      return;
    }
    setSavedAt(new Date().toLocaleTimeString());
  };

  // Live preview: the working payload's token set applied as CSS vars.
  const previewVars: Record<string, string> = Object.fromEntries(
    Object.entries(tokens[mode] ?? {}).flatMap(([name, token]) =>
      typeof token.$value === "string" ? [[name, token.$value]] : [],
    ),
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href={`/dashboard/identities/${libraryId}`} className="text-sm text-muted-foreground underline">
        <ArrowLeft size={14} aria-hidden="true" style={{ verticalAlign: "-0.2em" }} /> Back to {libraryName}
      </Link>
      <div className="mt-2 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Edit {libraryName}</h1>
        <div className="flex items-center gap-3">
          {savedAt ? <span className="text-sm text-muted-foreground">Saved {savedAt}</span> : null}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save draft"}
          </button>
        </div>
      </div>
      {issues ? (
        <ul className="mt-4 rounded-md border-(length:--border-width) border-destructive/40 bg-card p-3 text-sm">
          {issues.map((issue) => (
            <li key={issue.path} className="mt-1 first:mt-0">
              <code className="text-destructive">{issue.path}</code>: {issue.message}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="rounded-lg border-(length:--border-width) border-border p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">Tokens</h2>
              <div className="flex gap-1 text-sm">
                {(["light", "dark"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTokenMode(m)}
                    className={`rounded-md px-2 py-1 ${tokenMode === m ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex max-h-96 flex-col gap-2 overflow-y-auto">
              {contract.tokens.map((token) => {
                const entry = tokens[tokenMode]![token.name]!;
                const raw = entry.$value;
                if (typeof raw === "object" && raw !== null) {
                  const pair = raw as Record<string, string>;
                  return (
                    <div key={token.name} className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-mono text-xs">{token.name}</span>
                      <span className="flex gap-1">
                        <input
                          value={pair.duration ?? ""}
                          onChange={(e) => setToken(token.name, "duration", e.target.value)}
                          aria-label={`${token.name} duration`}
                          className="w-20 rounded-md border-(length:--border-width) border-input bg-background px-2 py-1"
                        />
                        <input
                          value={pair.easing ?? ""}
                          onChange={(e) => setToken(token.name, "easing", e.target.value)}
                          aria-label={`${token.name} easing`}
                          className="w-40 rounded-md border-(length:--border-width) border-input bg-background px-2 py-1"
                        />
                      </span>
                    </div>
                  );
                }
                return (
                  <div key={token.name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-mono text-xs">{token.name}</span>
                    <span className="flex items-center gap-2">
                      {token.$type === "color" ? (
                        <span
                          aria-hidden
                          className="inline-block h-5 w-5 rounded border-(length:--border-width) border-border"
                          style={{ background: String(raw) }}
                        />
                      ) : null}
                      <input
                        value={String(raw)}
                        onChange={(e) => setToken(token.name, null, e.target.value)}
                        aria-label={token.name}
                        spellCheck={false}
                        className="w-56 rounded-md border-(length:--border-width) border-input bg-background px-2 py-1 font-mono text-xs"
                      />
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border-(length:--border-width) border-border p-4">
            <h2 className="font-medium">Components</h2>
            <select
              value={activeComponent}
              onChange={(e) => setActiveComponent(e.target.value)}
              className="mt-2 w-full rounded-md border-(length:--border-width) border-input bg-background px-2 py-1.5 text-sm"
            >
              {manifests.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.title}
                </option>
              ))}
            </select>
            <div className="mt-3 flex flex-col gap-2">
              {Object.entries(manifest.axes).map(([axis, def]) => (
                <KnobControl
                  key={axis}
                  label={axis}
                  spec={{ type: "enum", values: def.values, default: def.default }}
                  value={selection[axis]}
                  onChange={(next) => setKnob(axis, next)}
                />
              ))}
              {Object.entries(manifest.styleSurface).map(([slot, knobs]) =>
                Object.entries(knobs).map(([knob, spec]) => (
                  <KnobControl
                    key={`${slot}.${knob}`}
                    label={`${knob} (${slot})`}
                    spec={spec}
                    value={selection[knob]}
                    onChange={(next) => setKnob(knob, next)}
                  />
                )),
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Tokens used: {manifest.tokensUsed.join(", ")}
            </p>
          </section>
        </div>

        <div>
          <section className="rounded-lg border-(length:--border-width) border-border p-4 lg:sticky lg:top-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">Live preview · kitchen sink</h2>
              <div className="flex gap-1 text-sm">
                {(["light", "dark"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`rounded-md px-2 py-1 ${mode === m ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 max-h-[70vh] overflow-y-auto rounded-md border-(length:--border-width) border-border">
              <KitchenSink manifests={manifests} vars={previewVars} mode={mode} typeSteps={typeSteps} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Token edits re-skin live; axis selections apply as props. Knob stamps bake in at publish.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
