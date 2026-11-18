"use client";

import * as React from "react";
import { IdentityFontLinks } from "@/components/identity-fonts";
import { PromptEdit } from "./prompt-edit";
import { ComponentPreview } from "@/components/component-preview";
import { BlockPreview } from "@/components/block-preview";
import { savePayload } from "../../actions";
import { PublishButton } from "../publish-button";
import { InstallBlock } from "@/components/install-block";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { NEUTRAL_CONTEXT, nextVariantAxes } from "@arche/registry-core/selector";
import { Undo2, Redo2, Sun, Moon, Search, RefreshCw, Maximize2, X, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type PreviewTab = "components" | "blocks";

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
  dna?: { profile?: string; axes?: Record<string, unknown> };
  tokens: Record<string, Record<string, { $type: string; $value: unknown }>>;
  components: Record<string, Record<string, unknown>>;
}

type Doc = Pick<Payload, "tokens" | "components">;

// ---------------------------------------------------------------------------
// Minimal oklch <-> hex conversion so the native color picker can edit the
// oklch token strings the contract stores. Pure functions, no dependencies.
// ---------------------------------------------------------------------------

function parseOklch(value: string): { l: number; c: number; h: number } | null {
  const match = value.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (!match) return null;
  return { l: Number(match[1]), c: Number(match[2]), h: Number(match[3]) };
}

function parseHex(value: string): [number, number, number] | null {
  const match = value.match(/^#([0-9a-f]{6})$/i);
  if (!match) return null;
  const n = Number.parseInt(match[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function srgbToLinear(u: number): number {
  const v = u / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(u: number): number {
  const c = Math.min(1, Math.max(0, u));
  return Math.round((c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055) * 255);
}

function oklchToHex(l: number, c: number, hDeg: number): string {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;
  const r = linearToSrgb(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3);
  const g = linearToSrgb(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3);
  const bl = linearToSrgb(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0")}`;
}

/** Display/edit hex for a stored color value (oklch or hex); null when unparseable. */
function colorToHex(value: string): string | null {
  const hex = parseHex(value.trim());
  if (hex) return `#${hex.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  const oklch = parseOklch(value);
  if (!oklch) return null;
  return oklchToHex(oklch.l, oklch.c, oklch.h);
}

function hexToOklch(hex: string): string {
  const [r, g, b] = parseHex(hex) ?? [0, 0, 0];
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);
  const l = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl;
  const m = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl;
  const s = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const c = Math.hypot(a, bb);
  const h = ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;
  const fmt = (n: number) => String(Math.round(n * 1000) / 1000);
  return `oklch(${fmt(L)} ${fmt(c)} ${fmt(h)})`;
}

// ---------------------------------------------------------------------------
// Token sections for the Colors tab
// ---------------------------------------------------------------------------

interface ColorSection {
  id: string;
  title: string;
  tokens: string[];
}

const COLOR_SECTIONS: ColorSection[] = [
  { id: "primary", title: "Primary", tokens: ["--primary", "--primary-foreground"] },
  { id: "secondary", title: "Secondary", tokens: ["--secondary", "--secondary-foreground"] },
  { id: "accent", title: "Accent", tokens: ["--accent", "--accent-foreground"] },
  { id: "brand", title: "Brand", tokens: ["--brand", "--brand-foreground", "--brand-soft"] },
  { id: "base", title: "Base", tokens: ["--background", "--foreground"] },
  { id: "card", title: "Card", tokens: ["--card", "--card-foreground"] },
  { id: "popover", title: "Popover", tokens: ["--popover", "--popover-foreground"] },
  { id: "muted", title: "Muted", tokens: ["--muted", "--muted-foreground"] },
  { id: "destructive", title: "Destructive", tokens: ["--destructive", "--destructive-foreground"] },
  { id: "border", title: "Border & Input", tokens: ["--border", "--input", "--ring", "--border-width"] },
  {
    id: "chart",
    title: "Chart",
    tokens: ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"],
  },
  { id: "sidebar", title: "Sidebar", tokens: [] },
];

/** Tokens the sidebar surfaces follow (this contract has no separate sidebar tokens). */
const SIDEBAR_FOLLOWS = ["--card", "--card-foreground", "--accent", "--border"];

// ---------------------------------------------------------------------------
// Knob controls (component tuning, Other tab)
// ---------------------------------------------------------------------------

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
        <Select value={key(value)} onValueChange={(v) => onChange(JSON.parse(v))}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {spec.values.map((v) => (
              <SelectItem key={key(v)} value={key(v)}>
                {String(v)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    );
  }
  if (spec.type === "token" && spec.values) {
    return (
      <label className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {spec.values.map((v) => (
              <SelectItem key={String(v)} value={String(v)}>
                {String(v)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    );
  }
  if (spec.type === "token" && spec.value && spec.scale) {
    return (
      <label className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">
          {label} <span className="opacity-70">({spec.value})</span>
        </span>
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {spec.scale.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    );
  }
  if (spec.type === "range") {
    return (
      <label className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <Input
          type="number"
          controlSize="sm"
          value={Number(value)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24"
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

/** Two-column grid of uniform preview boxes with centered content. */
function PreviewGrid({
  items,
  boxClass,
  emptyLabel,
  renderItem,
  colsClass = "grid-cols-2",
  onExpand,
}: {
  items: Manifest[];
  boxClass: string;
  emptyLabel: string;
  renderItem: (item: Manifest) => React.ReactNode;
  colsClass?: string;
  onExpand?: (item: Manifest) => void;
}) {
  if (items.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">No {emptyLabel} match the search.</p>;
  }
  return (
    <div className={`grid gap-4 p-4 ${colsClass}`}>
      {items.map((item) => (
        <div
          key={item.name}
          className={`flex flex-col overflow-hidden rounded-lg border border-border ${boxClass}`}
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
            <p className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</p>
            {onExpand ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => onExpand(item)}
                aria-label={`Expand ${item.title} preview`}
                title={`Expand ${item.title} preview`}
              >
                <Maximize2 aria-hidden />
              </Button>
            ) : null}
          </div>
          <div className="flex min-h-0 flex-1 overflow-auto p-4">
            <div className="m-auto max-w-full">{renderItem(item)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

export function IdentityEditor({
  libraryId,
  libraryName,
  initialPayload,
  manifests,
  blocks,
  contract,
  install,
}: {
  libraryId: string;
  libraryName: string;
  initialPayload: Payload;
  manifests: Manifest[];
  blocks: Manifest[];
  contract: { tokens: TokenDef[] };
  install: { base: string; username: string; slug: string; authed: boolean };
}) {
  const savedDoc = React.useRef<Doc>({
    tokens: initialPayload.tokens,
    components: initialPayload.components,
  });
  const docRef = React.useRef<Doc>(savedDoc.current);
  const [doc, setDoc] = React.useState<Doc>(docRef.current);
  const past = React.useRef<Doc[]>([]);
  const future = React.useRef<Doc[]>([]);
  const [, setTick] = React.useState(0);

  const [mode, setMode] = React.useState<"light" | "dark">("light");
  const [previewTab, setPreviewTab] = React.useState<PreviewTab>("components");
  const [previewQuery, setPreviewQuery] = React.useState("");
  const [tunedComponent, setTunedComponent] = React.useState<string | null>(
    manifests[0]?.name ?? null,
  );
  const [query, setQuery] = React.useState("");
  const [openSections, setOpenSections] = React.useState<string[]>(["primary"]);
  const [expandedBlock, setExpandedBlock] = React.useState<Manifest | null>(null);
  const [expandedAxes, setExpandedAxes] = React.useState<Record<string, string> | null>(null);
  const openExpanded = (item: Manifest) => {
    setExpandedBlock(item);
    setExpandedAxes(null);
  };
  const closeExpanded = () => {
    setExpandedBlock(null);
    setExpandedAxes(null);
  };
  const expandedAxisCount = expandedBlock ? Object.keys(expandedBlock.axes ?? {}).length : 0;
  const tryDifferentLayout = () => {
    if (!expandedBlock) return;
    setExpandedAxes((current) =>
      nextVariantAxes(
        expandedBlock.name,
        current ?? {},
        { name: expandedBlock.name, axes: expandedBlock.axes ?? {} },
        NEUTRAL_CONTEXT,
      ),
    );
  };
  const [saving, setSaving] = React.useState(false);
  const [issues, setIssues] = React.useState<Array<{ path: string; message: string }> | null>(null);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);

  const commit = (next: Doc) => {
    past.current.push(structuredClone(docRef.current));
    if (past.current.length > 60) past.current.shift();
    future.current = [];
    docRef.current = next;
    setDoc(next);
    setSavedAt(null);
  };
  const canUndo = past.current.length > 0;
  const canRedo = future.current.length > 0;
  const undo = () => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(structuredClone(docRef.current));
    docRef.current = prev;
    setDoc(prev);
    setSavedAt(null);
    setTick((t) => t + 1);
  };
  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(structuredClone(docRef.current));
    docRef.current = next;
    setDoc(next);
    setSavedAt(null);
    setTick((t) => t + 1);
  };
  const resetAll = () => commit(structuredClone(savedDoc.current));

  const manifest = manifests.find((m) => m.name === tunedComponent) ?? null;
  const selection = manifest ? (doc.components[manifest.name] ?? {}) : {};

  const dirty = React.useMemo(
    () => JSON.stringify(docRef.current) !== JSON.stringify(savedDoc.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doc],
  );

  // Unsaved-changes guard: browser chrome (reload/close) plus in-app links.
  React.useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    const onClick = (e: MouseEvent) => {
      const anchor =
        e.target instanceof HTMLElement ? e.target.closest("a[href]") : null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (window.confirm("You have unsaved changes. Leave without saving?")) return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  const setToken = (name: string, field: "duration" | "easing" | null, raw: string) => {
    const current = docRef.current.tokens[mode]?.[name];
    const nextValue =
      field === null ? raw : { ...((current?.$value as Record<string, string>) ?? {}), [field]: raw };
    commit({
      ...docRef.current,
      tokens: {
        ...docRef.current.tokens,
        [mode]: {
          ...docRef.current.tokens[mode],
          [name]: { $type: current?.$type ?? "other", $value: nextValue },
        },
      },
    });
  };

  const setKnob = (knob: string, next: unknown) => {
    if (!manifest) return;
    const name = manifest.name;
    commit({
      ...docRef.current,
      components: {
        ...docRef.current.components,
        [name]: { ...docRef.current.components[name], [knob]: next },
      },
    });
  };

  const save = async () => {
    setSaving(true);
    setIssues(null);
    const result = await savePayload(libraryId, {
      meta: initialPayload.meta,
      fonts: initialPayload.fonts,
      icons: initialPayload.icons,
      typeScale: initialPayload.typeScale,
      dna: initialPayload.dna,
      tokens: doc.tokens,
      components: doc.components,
    });
    setSaving(false);
    if (!result.ok) {
      setIssues(result.issues ?? []);
      return;
    }
    savedDoc.current = structuredClone(docRef.current);
    setSavedAt(new Date().toLocaleTimeString());
  };

  // Live preview vars (same convention as the registry theme emission).
  const previewVars: Record<string, string> = Object.fromEntries(
    Object.entries(doc.tokens[mode] ?? {}).flatMap(([name, token]): Array<[string, string]> => {
      if (typeof token.$value === "string") {
        if (name === "--radius") {
          return [
            [name, token.$value],
            ["--radius-sm", `calc(${token.$value} - 4px)`],
            ["--radius-md", `calc(${token.$value} - 2px)`],
            ["--radius-lg", token.$value],
            ["--radius-xl", `calc(${token.$value} + 4px)`],
          ];
        }
        return [[name, token.$value]];
      }
      if (name.startsWith("--motion") && typeof token.$value === "object" && token.$value !== null) {
        return Object.entries(token.$value as Record<string, unknown>).map(([field, value]) => [
          `${name}-${field}`,
          String(value),
        ]);
      }
      return [];
    }),
  );

  const valueOf = (name: string): unknown => doc.tokens[mode]?.[name]?.$value ?? "";

  const renderTokenRow = (name: string) => {
    const raw: unknown = valueOf(name);
    if (typeof raw === "object" && raw !== null) {
      const pair = raw as Record<string, string>;
      return (
        <div key={name} className="flex items-center gap-2 py-1">
          <span className="w-28 shrink-0 truncate font-mono text-xs text-muted-foreground">{name}</span>
          <Input
            value={pair.duration ?? ""}
            onChange={(e) => setToken(name, "duration", e.target.value)}
            aria-label={`${name} duration`}
            spellCheck={false}
            controlSize="sm"
            className="min-w-0 flex-1 font-mono"
          />
          <Input
            value={pair.easing ?? ""}
            onChange={(e) => setToken(name, "easing", e.target.value)}
            aria-label={`${name} easing`}
            spellCheck={false}
            controlSize="sm"
            className="min-w-0 flex-[2] font-mono"
          />
        </div>
      );
    }
    const str = String(raw);
    const hex = colorToHex(str);
    return (
      <div key={name} className="flex items-center gap-2 py-1">
        <span className="relative inline-flex h-6 w-6 shrink-0 overflow-hidden rounded border-(length:--border-width) border-border">
          <span aria-hidden className="absolute inset-0" style={{ background: str || "transparent" }} />
          {hex ? (
            <input
              type="color"
              value={hex}
              onChange={(e) => setToken(name, null, hexToOklch(e.target.value))}
              aria-label={`${name} color picker`}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          ) : null}
        </span>
        <span className="w-28 shrink-0 truncate font-mono text-xs text-muted-foreground">{name}</span>
        <Input
          value={str}
          onChange={(e) => setToken(name, null, e.target.value)}
          aria-label={`${name} value`}
          spellCheck={false}
          controlSize="sm"
          className="min-w-0 flex-1 font-mono"
        />
      </div>
    );
  };

  const q = query.trim().toLowerCase();
  const visibleSections = COLOR_SECTIONS.filter((section) => {
    if (section.id === "sidebar") return q === "" || "sidebar".includes(q);
    if (q === "") return true;
    return section.tokens.some((t) => t.toLowerCase().includes(q));
  });
  const accordionValue = q !== "" ? visibleSections.map((s) => s.id) : openSections;

  const syncSidebar = () => {
    const saved = savedDoc.current.tokens[mode] ?? {};
    const next = { ...docRef.current.tokens[mode] };
    for (const name of SIDEBAR_FOLLOWS) {
      if (saved[name]) next[name] = structuredClone(saved[name]);
    }
    commit({ ...docRef.current, tokens: { ...docRef.current.tokens, [mode]: next } });
  };

  return (
    <div className="flex h-[calc(100dvh-65px)] min-h-0">
      <IdentityFontLinks fonts={initialPayload.fonts} />

      {/* ---------- Left: theme editor ---------- */}
      <div className="flex min-h-0 w-fit max-w-[50%] shrink-0 flex-col border-r border-border">
        <Tabs defaultValue="colors" className="flex min-h-0 flex-1 flex-col gap-0">
          <div className="flex h-13 shrink-0 items-center border-b border-border px-3">
            <TabsList aria-label="Theme editor" className="min-w-0 flex-1 overflow-x-auto">
              {["Colors", "Typography", "Other", "Generate"].map((tab) => (
                <TabsTrigger key={tab} value={tab.toLowerCase()} className="shrink-0">
                  {tab === "Generate" ? "Generate ✨" : tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="colors" className="mt-0 min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            <div className="sticky top-0 z-10 -mx-3 bg-background px-3 pb-2 pt-3">
              <div className="relative">
                <Search
                  size={14}
                  aria-hidden
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tokens…"
                  aria-label="Search tokens"
                  spellCheck={false}
                  className="pl-8"
                />
              </div>
            </div>
            <Accordion
              type="multiple"
              value={accordionValue}
              onValueChange={(v) => setOpenSections(v as string[])}
              className="mt-2"
            >
              {visibleSections.map((section) => (
                <AccordionItem key={section.id} value={section.id}>
                  <AccordionTrigger className="text-sm">{section.title}</AccordionTrigger>
                  <AccordionContent>
                    {section.id === "sidebar" ? (
                      <div>
                        <p className="pb-1 text-xs text-muted-foreground">
                          Sidebar surfaces follow these tokens — this contract has no separate sidebar tokens.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={syncSidebar}
                          title="Sync sidebar tokens with last saved values"
                          className="mb-1 text-muted-foreground"
                        >
                          <RefreshCw aria-hidden /> Sync
                        </Button>
                        {SIDEBAR_FOLLOWS.map(renderTokenRow)}
                      </div>
                    ) : (
                      section.tokens
                        .filter((t) => q === "" || t.toLowerCase().includes(q))
                        .map(renderTokenRow)
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {q !== "" && visibleSections.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No tokens match “{query}”.</p>
            ) : null}
          </TabsContent>

          <TabsContent value="typography" className="mt-0 min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <div className="flex flex-col gap-1">
              {["--font-sans", "--font-display", "--font-mono"].map((name) => (
                <div key={name} className="flex flex-col gap-1 py-1">
                  <span className="font-mono text-xs text-muted-foreground">{name}</span>
                  <Input
                    value={String(valueOf(name))}
                    onChange={(e) => setToken(name, null, e.target.value)}
                    aria-label={`${name} value`}
                    spellCheck={false}
                    controlSize="sm"
                    className="font-mono"
                  />
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Type scale: {initialPayload.typeScale ?? "not set"} (closed registry — edited at generation, not here).
            </p>
          </TabsContent>

          <TabsContent value="other" className="mt-0 min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Radius & elevation</p>
            {["--radius", "--shadow-sm", "--shadow-md", "--shadow-lg", "--shadow-xl"].map(renderTokenRow)}
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Motion</p>
            {["--motion-fast", "--motion-normal"].map(renderTokenRow)}
            <div className="mt-4 border-t border-border pt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Component</p>
              <Select
                value={tunedComponent ?? ""}
                onValueChange={(v) => setTunedComponent(v || null)}
              >
                <SelectTrigger aria-label="Component to tune" className="mt-2 w-full">
                  <SelectValue placeholder="Select a component to tune" />
                </SelectTrigger>
                <SelectContent>
                  {manifests.map((m) => (
                    <SelectItem key={m.name} value={m.name}>
                      {m.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {manifest ? (
                <>
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
                </>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  Click a component box in the preview to tune its knobs here.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="generate" className="mt-0 min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <p className="text-sm font-medium">Generate with AI ✨</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Describe a change in plain language — one model call returns a token delta, recompiled deterministically.
            </p>
            <div className="mt-3">
              <PromptEdit libraryId={libraryId} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ---------- Right: live preview ---------- */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex h-13 items-center gap-1 border-b border-border px-3">
          <Tabs
            value={previewTab}
            onValueChange={(v) => setPreviewTab(v as PreviewTab)}
            className="gap-0"
          >
            <TabsList aria-label="Preview library">
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="blocks">Blocks</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="ml-auto flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMode(mode === "dark" ? "light" : "dark")}
              aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {mode === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}
            </Button>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo">
            <Undo2 aria-hidden />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo">
            <Redo2 aria-hidden />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={resetAll} title="Reset to saved">
            Reset
          </Button>
          {savedAt ? <span className="text-xs text-muted-foreground">Saved {savedAt}</span> : null}
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" size="sm">
                Install
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85dvh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Install {libraryName}</DialogTitle>
                <DialogDescription>
                  Publish first so the registry serves your latest tokens, then run these commands in any
                  project. The CLI pulls this identity&apos;s components, skinned by your theme.
                </DialogDescription>
              </DialogHeader>
              <InstallBlock
                base={install.base}
                username={install.username}
                slug={install.slug}
                authed={install.authed}
              />
              {install.authed ? (
                <p className="text-xs text-muted-foreground">
                  Private library — installs require your registry token (avatar menu → Settings).
                </p>
              ) : null}
            </DialogContent>
          </Dialog>
          <Button type="button" variant="secondary" size="sm" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <PublishButton
            libraryId={libraryId}
            variant="default"
            onDone={(result) => {
              if (result.ok) {
                setSavedAt(`Published v${result.version ?? "?"}`);
                setIssues(null);
              } else {
                setIssues(result.issues ?? [{ path: "publish", message: "publish failed" }]);
              }
            }}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="sticky top-0 z-10 border-b border-border bg-background px-4 py-2">
            <div className="relative">
              <Search
                size={14}
                aria-hidden
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={previewQuery}
                onChange={(e) => setPreviewQuery(e.target.value)}
                placeholder={previewTab === "components" ? "Search components…" : "Search blocks…"}
                aria-label="Search preview"
                spellCheck={false}
                className="pl-8"
              />
            </div>
          </div>
          {issues ? (
            <ul className="m-3 rounded-md border-(length:--border-width) border-destructive/40 bg-card p-3 text-sm">
              {issues.map((issue) => (
                <li key={issue.path} className="mt-1 first:mt-0">
                  <code className="text-destructive">{issue.path}</code>: {issue.message}
                </li>
              ))}
            </ul>
          ) : null}
          <div className={mode === "dark" ? "dark" : ""}>
            <div
              style={previewVars as React.CSSProperties}
              className="bg-background font-sans text-foreground"
            >
              {previewTab === "components" ? (
                <PreviewGrid
                  items={manifests.filter(
                    (m) =>
                      previewQuery.trim() === "" ||
                      `${m.title} ${m.name}`.toLowerCase().includes(previewQuery.trim().toLowerCase()),
                  )}
                  boxClass="h-72"
                  emptyLabel="components"
                  renderItem={(m) => (
                    <ComponentPreview name={m.name} selection={doc.components[m.name] ?? {}} />
                  )}
                />
              ) : (
                <PreviewGrid
                  items={blocks.filter(
                    (b) =>
                      previewQuery.trim() === "" ||
                      `${b.title} ${b.name}`.toLowerCase().includes(previewQuery.trim().toLowerCase()),
                  )}
                  boxClass="h-96"
                  colsClass="grid-cols-1"
                  emptyLabel="blocks"
                  onExpand={openExpanded}
                  renderItem={(b) => <BlockPreview name={b.name} />}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {expandedBlock ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${expandedBlock.title} preview`}
        >
          <div className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-border bg-background">
            <div className="flex h-13 shrink-0 items-center gap-2 border-b border-border px-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeExpanded}
                aria-label="Close preview"
                title="Close preview"
              >
                <X aria-hidden />
              </Button>
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{expandedBlock.title}</p>
              {expandedAxisCount > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={tryDifferentLayout}
                  aria-label="Try a different layout"
                  title="Try a different layout"
                >
                  <Shuffle aria-hidden /> Try a different layout
                </Button>
              ) : null}
            </div>
            <div className={`min-h-0 flex-1 overflow-y-auto ${mode === "dark" ? "dark" : ""}`}>
              <div
                style={previewVars as React.CSSProperties}
                className="bg-background font-sans text-foreground"
              >
                <BlockPreview name={expandedBlock.name} axes={expandedAxes ?? undefined} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
