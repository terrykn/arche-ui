"use client";

import * as React from "react";
import { IdentityFontLinks } from "@/components/identity-fonts";
import { PromptEdit } from "./prompt-edit";
import { ComponentPreview } from "@/components/component-preview";
import { BlockPreview } from "@/components/block-preview";
import { PreviewPortalHost } from "@/components/preview-portal";
import { PreviewFrame } from "@/components/preview-frame";
import { PreviewBoundary } from "@/components/preview-boundary";
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
import { Undo2, Redo2, Sun, Moon, Search, RefreshCw, Maximize2, Pencil, X, Shuffle, SlidersHorizontal, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { componentTokenVars } from "@arche/registry-core/component-tokens";
import {
  BLOCK_SECTIONS,
  BLOCK_SECTION_BY_NAME,
  COMPONENT_SECTIONS,
  COMPONENT_SECTION_BY_NAME,
  type CatalogSection,
} from "@/content/catalog-sections.generated";

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

type Doc = Pick<Payload, "tokens" | "components" | "fonts">;

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
  { id: "brand", title: "Brand", tokens: ["--brand", "--brand-foreground"] },
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
// Quick tweaks: preset suggestion boxes for the AI Edit tab. Each one is a
// simple calculated change on the current token values (no model call),
// applied as a single commit so it stays undoable.
// ---------------------------------------------------------------------------

function parseLength(value: unknown): { n: number; unit: "px" | "rem" } | null {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(-?[\d.]+)(px|rem)$/);
  if (!match) return null;
  return { n: Number(match[1]), unit: match[2] as "px" | "rem" };
}

function formatLength(n: number, unit: "px" | "rem"): string {
  const rounded = Math.round(n * 1000) / 1000;
  return `${rounded}${unit}`;
}

/** Parsed `offsetX offsetY blur spread color` shadow (lengths may omit px). */
interface ShadowParts {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

function parseShadow(value: unknown): ShadowParts | null {
  if (typeof value !== "string") return null;
  const match = value
    .trim()
    .match(/^(-?[\d.]+)(?:px)?\s+(-?[\d.]+)(?:px)?\s+([\d.]+)(?:px)?\s+(-?[\d.]+)(?:px)?\s+(.+)$/);
  if (!match) return null;
  const [x = NaN, y = NaN, blur = NaN, spread = NaN] = [match[1], match[2], match[3], match[4]].map(
    (v) => Number(v ?? ""),
  );
  if ([x, y, blur, spread].some((n) => !Number.isFinite(n))) return null;
  return { x, y, blur, spread, color: (match[5] ?? "").trim() };
}

/** Alpha (0–1) from an `oklch(... / a)` or `/ a%` color suffix; null when opaque/unknown. */
function parseShadowAlpha(color: string): number | null {
  const match = color.match(/\/\s*([\d.]+)(%?)\s*\)?\s*$/);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isFinite(n)) return null;
  const alpha = match[2] === "%" ? n / 100 : n;
  return Math.min(1, Math.max(0, alpha));
}

function parseMs(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(-?[\d.]+)(ms|s)$/);
  if (!match) return null;
  const n = Number(match[1]);
  return match[2] === "s" ? n * 1000 : n;
}

function scaleDuration(pair: unknown, factor: number): Record<string, string> | null {
  if (typeof pair !== "object" || pair === null) return null;
  const { duration, easing } = pair as Record<string, unknown>;
  const ms = parseMs(duration);
  if (ms == null || typeof easing !== "string") return null;
  return { duration: `${Math.max(0, Math.round(ms * factor))}ms`, easing };
}

interface QuickTweak {
  id: string;
  title: string;
  hint: string;
  tokens: string[];
  apply: (values: Record<string, unknown>) => Record<string, unknown> | null;
}

const QUICK_TWEAKS: QuickTweak[] = [
  {
    id: "rounder",
    title: "Rounder",
    hint: "Corner radius up",
    tokens: ["--radius"],
    apply: (values) => {
      const parsed = parseLength(values["--radius"]);
      if (!parsed) return null;
      const step = parsed.unit === "rem" ? 0.25 : 4;
      return { "--radius": formatLength(parsed.n + step, parsed.unit) };
    },
  },
  {
    id: "sharper",
    title: "Sharper",
    hint: "Corner radius down",
    tokens: ["--radius"],
    apply: (values) => {
      const parsed = parseLength(values["--radius"]);
      if (!parsed) return null;
      const step = parsed.unit === "rem" ? 0.25 : 4;
      return { "--radius": formatLength(Math.max(0, parsed.n - step), parsed.unit) };
    },
  },
  {
    id: "bolder-borders",
    title: "Bolder borders",
    hint: "Border width +1px",
    tokens: ["--border-width"],
    apply: (values) => {
      const parsed = parseLength(values["--border-width"]);
      if (!parsed || parsed.unit !== "px") return null;
      return { "--border-width": formatLength(parsed.n + 1, "px") };
    },
  },
  {
    id: "finer-borders",
    title: "Finer borders",
    hint: "Border width −1px",
    tokens: ["--border-width"],
    apply: (values) => {
      const parsed = parseLength(values["--border-width"]);
      if (!parsed || parsed.unit !== "px") return null;
      return { "--border-width": formatLength(Math.max(0, parsed.n - 1, 0), "px") };
    },
  },
  {
    id: "snappier-motion",
    title: "Snappier motion",
    hint: "Durations ×0.6",
    tokens: ["--motion-fast", "--motion-normal"],
    apply: (values) => {
      const next: Record<string, unknown> = {};
      for (const name of ["--motion-fast", "--motion-normal"]) {
        const scaled = scaleDuration(values[name], 0.6);
        if (!scaled) return null;
        next[name] = scaled;
      }
      return next;
    },
  },
  {
    id: "calmer-motion",
    title: "Calmer motion",
    hint: "Durations ×1.5",
    tokens: ["--motion-fast", "--motion-normal"],
    apply: (values) => {
      const next: Record<string, unknown> = {};
      for (const name of ["--motion-fast", "--motion-normal"]) {
        const scaled = scaleDuration(values[name], 1.5);
        if (!scaled) return null;
        next[name] = scaled;
      }
      return next;
    },
  },
];

// ---------------------------------------------------------------------------
// Left rail shared bits: friendly labels, per-tab search, collapsible
// sections, and closed-registry font stacks. Token names (e.g. --primary)
// are never shown in the UI — only plain-language labels.
// ---------------------------------------------------------------------------

/** Registry font metadata the server page passes in (serializable subset). */
export interface EditorFontOption {
  id: string;
  family: string;
  roles: string[];
  slots: string[];
  displayOnly: boolean;
  classification: string;
}

const TOKEN_LABEL_OVERRIDES: Record<string, string> = {
  "--radius": "Corner radius",
  "--border-width": "Border width",
  "--shadow-sm": "Subtle shadow",
  "--shadow-md": "Medium shadow",
  "--shadow-lg": "Large shadow",
  "--shadow-xl": "Extra large shadow",
  "--motion-fast": "Fast",
  "--motion-normal": "Normal",
};

const KNOB_LABEL_OVERRIDES: Record<string, string> = {
  radiusFrom: "Corner radius",
  shadow: "Shadow",
  border: "Border",
  motion: "Animation",
  backdropBlur: "Background blur",
  overlayBackground: "Overlay background",
  overlayOpacity: "Overlay opacity",
  fontWeight: "Font weight",
  position: "Position",
};

/**
 * Variant/size selectors are not editable knobs: every preview shows all
 * variants, and shipped defaults stay at the template defaults. They are
 * stripped from saved selections on load and hidden below, so each remaining
 * control appears exactly once.
 */
const NON_TOKEN_KNOBS = new Set([
  "variant",
  "size",
  "density",
  "spacing",
  "controlSize",
  "defaultVariant",
  "defaultSize",
]);

/** Drop variant/size selectors from loaded selections — no invisible state. */
function normalizeComponents(components: Doc["components"]): Doc["components"] {
  const next: Doc["components"] = {};
  for (const [name, selection] of Object.entries(components ?? {})) {
    const clean: Record<string, unknown> = {};
    for (const [knob, value] of Object.entries(selection ?? {})) {
      if (!NON_TOKEN_KNOBS.has(knob)) clean[knob] = value;
    }
    next[name] = clean;
  }
  return next;
}

/** Human-friendly label for a component knob name — never the raw variable. */
function friendlyKnobLabel(knob: string): string {
  const override = KNOB_LABEL_OVERRIDES[knob];
  if (override) return override;
  return knob
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Human-friendly label for a token name. Falls back to Title Case words. */
function friendlyTokenLabel(name: string): string {
  const override = TOKEN_LABEL_OVERRIDES[name];
  if (override) return override;
  return name
    .replace(/^--/, "")
    .split("-")
    .map((word) =>
      word === "foreground" ? "Text" : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

/** Search bar pinned at the top of the left rail (one shared query). */
function TabSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
}) {
  return (
    <div className="shrink-0 border-b border-border bg-background px-4 py-2">
      <div className="relative">
        <Search
          size={14}
          aria-hidden
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          spellCheck={false}
          className="pl-8"
        />
      </div>
    </div>
  );
}

/** Collapsible sections with auto-expand while searching. Parents pre-filter. */
function FilteredSections({
  sections,
  searching,
  emptyLabel,
}: {
  sections: Array<{ id: string; title: string; body: React.ReactNode }>;
  searching: boolean;
  emptyLabel: string;
}) {
  const ids = sections.map((s) => s.id);
  const [open, setOpen] = React.useState<string[] | null>(null);
  return (
    <>
      <Accordion
        type="multiple"
        value={searching ? ids : (open ?? ids)}
        onValueChange={setOpen}
        className="mt-2"
      >
        {sections.map((s) => (
          <AccordionItem key={s.id} value={s.id}>
            <AccordionTrigger className="text-sm">{s.title}</AccordionTrigger>
            <AccordionContent>{s.body}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {searching && sections.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No matches for “{emptyLabel}”.</p>
      ) : null}
    </>
  );
}

/** Color sections accordion (shared by the Colors tab and cross-tab results). */
function ColorsAccordion({
  sections,
  query,
  value,
  onValueChange,
  renderRow,
  sidebarBody,
}: {
  sections: ColorSection[];
  query: string;
  value: string[];
  onValueChange: (next: string[]) => void;
  renderRow: (token: string) => React.ReactNode;
  sidebarBody: React.ReactNode;
}) {
  const q = query.trim().toLowerCase();
  return (
    <Accordion type="multiple" value={value} onValueChange={onValueChange} className="mt-2">
      {sections.map((section) => (
        <AccordionItem key={section.id} value={section.id}>
          <AccordionTrigger className="text-sm">{section.title}</AccordionTrigger>
          <AccordionContent>
            {section.id === "sidebar"
              ? sidebarBody
              : section.tokens.filter((t) => q === "" || t.toLowerCase().includes(q)).map(renderRow)}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

/** Canonical --font-* stack for a registry family (mirrors the registry gate). */
function fontStackFor(family: string, classification: string, role: string): string {
  if (classification === "serif" || classification === "display-serif") {
    return `${family}, ui-serif, Georgia, Times New Roman, serif`;
  }
  if (classification === "calligraphic" || classification === "handwritten") {
    return `${family}, Segoe Script, Comic Sans MS, cursive`;
  }
  if (role === "mono" || classification === "monospace") {
    return `${family}, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  }
  return `${family}, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif`;
}

/** First family in a raw stack, without quotes. */
function stackFamily(stack: unknown): string | null {
  if (typeof stack !== "string") return null;
  const family = (stack.split(",")[0] ?? "").trim().replace(/^['"]|['"]$/g, "");
  return family === "" ? null : family;
}

const FONT_SLOTS = [
  { slot: "sans", token: "--font-sans", role: "sans", label: "Body" },
  { slot: "display", token: "--font-display", role: "display", label: "Display" },
  { slot: "mono", token: "--font-mono", role: "mono", label: "Monospace" },
] as const;

// ---------------------------------------------------------------------------
// Knob controls (component tuning, Tune tab)
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
        <span className="text-muted-foreground">{label}</span>
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

/**
 * Two-column grid of uniform preview boxes with centered content.
 *
 * Only the inner content wrapper carries the library tokens (`previewVars` /
 * `.dark`): the box, its header, and the canvas behind it all use the app's own
 * theme, so library edits never restyle the editor chrome.
 */
function PreviewGrid({
  items,
  boxClass,
  emptyLabel,
  renderItem,
  colsClass = "grid-cols-1 sm:grid-cols-2",
  onExpand,
  onEdit,
  previewVars,
  dark,
  flush = false,
}: {
  items: Manifest[];
  boxClass: string;
  emptyLabel: string;
  renderItem: (item: Manifest) => React.ReactNode;
  colsClass?: string;
  onExpand?: (item: Manifest) => void;
  onEdit?: (item: Manifest) => void;
  previewVars: React.CSSProperties;
  dark: boolean;
  /** Nested inside a section: keep vertical rhythm, drop the outer padding. */
  flush?: boolean;
}) {
  if (items.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">No {emptyLabel} match the search.</p>;
  }
  return (
    <div className={`grid gap-4 ${flush ? "py-3" : "p-4"} ${colsClass}`}>
      {items.map((item) => {
        const editable =
          !onEdit ||
          Object.values(item.styleSurface).some((knobs) =>
            Object.keys(knobs).some((knob) => !NON_TOKEN_KNOBS.has(knob)),
          );
        const editButton = (disabled: boolean) => (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit?.(item)}
            aria-label={disabled ? `${item.title} has no component-specific tokens` : `Edit ${item.title}`}
            title={disabled ? undefined : `Edit ${item.title}`}
            disabled={disabled}
          >
            <Pencil aria-hidden />
          </Button>
        );
        return (
          <PreviewFrame
            key={item.name}
            title={item.title}
            className={boxClass}
            style={previewVars}
            dark={dark}
            actions={
              <>
                {onEdit ? (
                  editable ? (
                    editButton(false)
                  ) : (
                    <span title="No component-specific tokens" className="inline-flex">
                      {editButton(true)}
                    </span>
                  )
                ) : null}
                {onExpand ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onExpand(item)}
                    aria-label={`Expand ${item.title} preview`}
                    title={`Expand ${item.title} preview`}
                  >
                    <Maximize2 aria-hidden />
                  </Button>
                ) : null}
              </>
            }
          >
            {/* One broken preview must not take the whole editor down. */}
            <PreviewBoundary name={item.name}>{renderItem(item)}</PreviewBoundary>
          </PreviewFrame>
        );
      })}
    </div>
  );
}

/**
 * The catalog split into the aggregator's sections, each one a collapsible.
 * Section headers come from catalog-aggregate.json, so the pane groups exactly
 * like the docs indexes; a search keeps only the sections that still match.
 */
/** Search bar height; the section headers stick directly beneath it. */
const PREVIEW_SEARCH_HEIGHT = 56;

/** Nearest vertically scrolling ancestor, used to measure and drive the pane. */
function scrollParent(element: HTMLElement): HTMLElement | null {
  let node = element.parentElement;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return null;
}

function PreviewSections({
  items,
  sections,
  sectionOf,
  searching,
  ...gridProps
}: {
  items: Manifest[];
  sections: CatalogSection[];
  sectionOf: Record<string, string>;
  /** Items are filtered by the search box, so every remaining section opens. */
  searching: boolean;
} & Omit<React.ComponentProps<typeof PreviewGrid>, "items">) {
  const grouped = sections
    .map((section) => ({
      key: section.key,
      label: section.group ? `${section.group.replace(/ blocks$/, "")} · ${section.label}` : section.label,
      items: items.filter((item) => sectionOf[item.name] === section.key),
    }))
    .filter((section) => section.items.length > 0);

  // Sections start collapsed; searching opens whatever is left so matches show.
  const [open, setOpen] = React.useState<string[]>([]);
  /** Next section to fly to, when the one being read is taller than the pane. */
  const [jumpTo, setJumpTo] = React.useState<string | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const keys = grouped.map((section) => section.key);
  const keyList = keys.join("|");

  React.useEffect(() => {
    const root = listRef.current;
    if (!root) return;
    const scroller = scrollParent(root);
    if (!scroller) return;

    let frame = 0;
    /** Only re-render when the destination actually changes. */
    const setTarget = (next: string | null) => {
      setJumpTo((current) => (current === next ? current : next));
    };
    /** One measurement per animation frame — scroll events outpace layout. */
    const measure = () => {
      frame = 0;
      if (searching || keyList === "") {
        setTarget(null);
        return;
      }
      const sectionsInView = keyList.split("|");
      const viewport = scroller.getBoundingClientRect();
      const marker = viewport.top + PREVIEW_SEARCH_HEIGHT + 1;
      // The section being read is the last one whose top has passed the search bar.
      let currentIndex = -1;
      for (let index = 0; index < sectionsInView.length; index += 1) {
        const element = root.querySelector<HTMLElement>(`[data-preview-section="${sectionsInView[index]}"]`);
        if (!element) continue;
        if (element.getBoundingClientRect().top > marker) break;
        currentIndex = index;
      }
      const next = currentIndex >= 0 ? sectionsInView[currentIndex + 1] : undefined;
      const element =
        currentIndex >= 0
          ? root.querySelector<HTMLElement>(`[data-preview-section="${sectionsInView[currentIndex]}"]`)
          : null;
      const tallerThanPane = element
        ? element.getBoundingClientRect().height > scroller.clientHeight - PREVIEW_SEARCH_HEIGHT
        : false;
      const currentOpen = currentIndex >= 0 && open.includes(sectionsInView[currentIndex]!);
      setTarget(tallerThanPane && currentOpen && next ? next : null);
    };
    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(measure);
    };

    schedule();
    scroller.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    observer.observe(scroller);
    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [keyList, open, searching]);

  /** Jump straight to the next section's header, clearing the sticky search bar. */
  const jump = () => {
    const root = listRef.current;
    if (!root || !jumpTo) return;
    const scroller = scrollParent(root);
    const target = root.querySelector<HTMLElement>(`[data-preview-section="${jumpTo}"]`);
    if (!scroller || !target) return;
    const top =
      scroller.scrollTop +
      target.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top -
      PREVIEW_SEARCH_HEIGHT;
    scroller.scrollTo({ top, behavior: "instant" });
  };

  if (grouped.length === 0) return <PreviewGrid items={[]} {...gridProps} />;

  return (
    <div ref={listRef}>
      <Accordion type="multiple" value={searching ? keys : open} onValueChange={setOpen} className="px-3">
        {grouped.map((section) => (
          <AccordionItem
            key={section.key}
            value={section.key}
            data-preview-section={section.key}
            className="max-lg:pt-0"
          >
            {/* Sticks under the search bar while the section's own cards scroll past. */}
            <div className="max-lg:sticky max-lg:top-14 max-lg:z-10 max-lg:bg-background max-lg:py-2">
              <AccordionTrigger className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <span className="flex min-w-0 flex-1 items-baseline gap-2">
                  <span className="truncate">{section.label}</span>
                  <span className="font-normal normal-case tabular-nums">{section.items.length}</span>
                </span>
              </AccordionTrigger>
            </div>
            <AccordionContent className="pb-0">
              <PreviewGrid items={section.items} {...gridProps} flush />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {/* Sticky inside the pane itself, so it stays pinned while a long section scrolls. */}
      {jumpTo ? (
        <div className="pointer-events-none sticky bottom-4 z-30 flex justify-center">
          <Button
            type="button"
            size="sm"
            onClick={jump}
            className="pointer-events-auto gap-1.5 rounded-full shadow-lg"
            aria-label="Jump to the next section"
            title="Jump to the next section"
          >
            <ArrowDown aria-hidden />
            Next section
          </Button>
        </div>
      ) : null}
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
  fonts,
}: {
  libraryId: string;
  libraryName: string;
  initialPayload: Payload;
  manifests: Manifest[];
  blocks: Manifest[];
  contract: { tokens: TokenDef[] };
  install: { base: string; username: string; slug: string; authed: boolean };
  fonts: EditorFontOption[];
}) {
  const savedDoc = React.useRef<Doc>({
    tokens: initialPayload.tokens,
    components: normalizeComponents(initialPayload.components),
    // Payloads saved before the font registry have no `fonts`: default the
    // slots so the editor never reads a face off undefined and blanks the page.
    fonts: initialPayload.fonts ?? { sans: "", display: "", mono: "" },
  });
  const docRef = React.useRef<Doc>(savedDoc.current);
  const [doc, setDoc] = React.useState<Doc>(docRef.current);
  const past = React.useRef<Doc[]>([]);
  const future = React.useRef<Doc[]>([]);
  const [, setTick] = React.useState(0);

  const [mode, setMode] = React.useState<"light" | "dark">("dark");
  const [themePanelOpen, setThemePanelOpen] = React.useState(false);
  const [previewTab, setPreviewTab] = React.useState<PreviewTab>("components");
  const [previewQuery, setPreviewQuery] = React.useState("");
  const [tab, setTab] = React.useState("colors");
  const [editingComponent, setEditingComponent] = React.useState<string | null>(null);
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
  const themePanelRef = React.useRef<HTMLDivElement>(null);
  const themeTriggerRef = React.useRef<HTMLButtonElement>(null);
  const themeCloseRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!themePanelOpen) return;
    const mobile = window.matchMedia("(max-width: 1023px)");
    if (!mobile.matches) return;

    const panel = themePanelRef.current;
    const trigger = themeTriggerRef.current;
    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => element.getClientRects().length > 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setThemePanelOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        panel?.focus();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      if (!panel?.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const frame = window.requestAnimationFrame(() => themeCloseRef.current?.focus());

    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (!event.matches) setThemePanelOpen(false);
    };
    mobile.addEventListener("change", closeOnDesktop);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      mobile.removeEventListener("change", closeOnDesktop);
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      trigger?.focus();
    };
  }, [themePanelOpen]);

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

  const editingManifest = manifests.find((m) => m.name === editingComponent) ?? null;
  const selection = editingManifest ? (doc.components[editingManifest.name] ?? {}) : {};

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
    if (!editingManifest) return;
    const name = editingManifest.name;
    commit({
      ...docRef.current,
      components: {
        ...docRef.current.components,
        [name]: { ...docRef.current.components[name], [knob]: next },
      },
    });
  };

  /** Typeface options valid for a font slot (closed registry, no raw stacks). */
  const fontOptionsFor = (slot: "sans" | "display" | "mono"): EditorFontOption[] =>
    fonts.filter((f) => f.roles.includes(slot) && (slot !== "sans" || !f.displayOnly));

  /** Resolve the dropdown value: saved selection, else match the stack's family. */
  const fontSelectionFor = (slot: "sans" | "display" | "mono", token: string): string => {
    const options = fontOptionsFor(slot);
    if (options.some((o) => o.id === doc.fonts[slot])) return doc.fonts[slot];
    const family = stackFamily(valueOf(token));
    return options.find((o) => o.family === family)?.id ?? "";
  };

  /** Set a typeface: updates the fonts selection and mirrors the token stack in every mode. */
  const setFontSlot = (slot: "sans" | "display" | "mono", token: string, id: string) => {
    const entry = fonts.find((f) => f.id === id);
    if (!entry) return;
    const stack = fontStackFor(entry.family, entry.classification, slot);
    const nextTokens = { ...docRef.current.tokens };
    for (const m of Object.keys(nextTokens)) {
      const mt = nextTokens[m] ?? {};
      nextTokens[m] = {
        ...mt,
        [token]: { $type: mt[token]?.$type ?? "other", $value: stack },
      };
    }
    commit({
      ...docRef.current,
      fonts: { ...docRef.current.fonts, [slot]: id },
      tokens: nextTokens,
    });
  };

  /** Apply a quick-tweak preset as one commit (undoable). Returns its computed values for enablement checks. */
  const computeTweak = (tweak: QuickTweak): Record<string, unknown> | null => {
    const modeTokens = docRef.current.tokens[mode] ?? {};
    const current: Record<string, unknown> = {};
    for (const name of tweak.tokens) current[name] = modeTokens[name]?.$value;
    return tweak.apply(current);
  };

  const applyTweak = (tweak: QuickTweak) => {
    const nextValues = computeTweak(tweak);
    if (!nextValues) {
      return;
    }
    const modeTokens = docRef.current.tokens[mode] ?? {};
    const next = { ...modeTokens };
    for (const [name, value] of Object.entries(nextValues)) {
      next[name] = { $type: modeTokens[name]?.$type ?? "other", $value: value };
    }
    commit({
      ...docRef.current,
      tokens: { ...docRef.current.tokens, [mode]: next },
    });
  };

  const save = async () => {
    setSaving(true);
    setIssues(null);
    try {
      const result = await savePayload(libraryId, {
        meta: initialPayload.meta,
        fonts: doc.fonts,
        icons: initialPayload.icons,
        typeScale: initialPayload.typeScale,
        dna: initialPayload.dna,
        tokens: doc.tokens,
        components: doc.components,
      });
      if (!result.ok) {
        setIssues(result.issues ?? []);
        return;
      }
      savedDoc.current = structuredClone(docRef.current);
      setSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      // A rejected action used to leave `saving` true forever (disabled
      // Save button, no message). Surface it and always release the button.
      setIssues([{ path: "library", message: err instanceof Error ? err.message : "Saving failed — try again." }]);
    } finally {
      setSaving(false);
    }
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

  Object.assign(previewVars, componentTokenVars(manifests, doc.components));

  const valueOf = (name: string): unknown => doc.tokens[mode]?.[name]?.$value ?? "";

  const fmtShadowNum = (n: number): string => String(Math.round(n * 100) / 100);

  const setShadow = (name: string, parts: ShadowParts) => {
    const color = parts.color === "" ? "transparent" : parts.color;
    setToken(
      name,
      null,
      `${fmtShadowNum(parts.x)}px ${fmtShadowNum(parts.y)}px ${fmtShadowNum(parts.blur)}px ${fmtShadowNum(parts.spread)}px ${color}`,
    );
  };

  const patchShadow = (name: string, parts: ShadowParts, patch: Partial<ShadowParts>) =>
    setShadow(name, { ...parts, ...patch });

  const setShadowColor = (name: string, parts: ShadowParts, hex: string) => {
    const oklch = hexToOklch(hex);
    const alpha = parseShadowAlpha(parts.color);
    const rounded = Math.round((alpha ?? 1) * 1000) / 1000;
    patchShadow(name, parts, {
      color: alpha == null || rounded >= 1 ? oklch : oklch.replace(/\)$/, ` / ${rounded})`) ,
    });
  };

  const setShadowOpacity = (name: string, parts: ShadowParts, percent: number) => {
    if (!Number.isFinite(percent)) return;
    const alpha = Math.min(1, Math.max(0, percent / 100));
    let base = parts.color;
    if (!base.startsWith("oklch(")) {
      const hex = colorToHex(base);
      if (!hex) return;
      base = hexToOklch(hex);
    }
    const bare = base.replace(/\s*\/\s*[\d.]+%?\s*\)\s*$/, ")").replace(/\)\s*$/, ")");
    patchShadow(name, parts, {
      color: alpha >= 1 ? bare : bare.replace(/\)$/, ` / ${Math.round(alpha * 1000) / 1000})`) ,
    });
  };

  /** Structured shadow editor: color swatch plus numeric X / Y / blur / spread / opacity. */
  const renderShadowRow = (name: string, str: string) => {
    const label = friendlyTokenLabel(name);
    const parts = parseShadow(str);
    if (!parts) {
      return (
        <div key={name} className="flex items-center gap-2 py-1.5">
          <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">{label}</span>
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
    }
    const hex = colorToHex(parts.color);
    const alpha = parseShadowAlpha(parts.color);
    const num = (
      field: "x" | "y" | "blur" | "spread",
      caption: string,
      min?: number,
    ) => (
      <label className="flex min-w-0 flex-col gap-0.5 text-[11px] leading-none text-muted-foreground">
        {caption}
        <Input
          type="number"
          value={parts[field]}
          min={min}
          step="any"
          onChange={(e) => {
            const next = Number(e.target.value);
            if (!Number.isFinite(next)) return;
            patchShadow(name, parts, { [field]: next } as Partial<ShadowParts>);
          }}
          aria-label={`${label} ${caption}`}
          controlSize="sm"
          className="font-mono"
        />
      </label>
    );
    return (
      <div key={name} className="flex flex-col gap-1.5 py-1.5">
        <div className="flex items-center gap-2">
          <span className="relative inline-flex h-6 w-6 shrink-0 overflow-hidden rounded border-(length:--border-width) border-border">
            <span aria-hidden className="absolute inset-0" style={{ background: parts.color }} />
            {hex ? (
              <input
                type="color"
                value={hex}
                onChange={(e) => setShadowColor(name, parts, e.target.value)}
                aria-label={`${label} shadow color picker`}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            ) : null}
          </span>
          <span className="min-w-0 flex-1 truncate text-xs">{label}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {num("x", "Offset X")}
          {num("y", "Offset Y")}
          {num("blur", "Blur", 0)}
          {num("spread", "Spread")}
          <label className="flex min-w-0 flex-col gap-0.5 text-[11px] leading-none text-muted-foreground">
            Opacity %
            <Input
              type="number"
              value={Math.round((alpha ?? 1) * 100)}
              min={0}
              max={100}
              step="any"
              disabled={hex == null && !parts.color.startsWith("oklch(")}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (!Number.isFinite(next)) return;
                setShadowOpacity(name, parts, next);
              }}
              aria-label={`${label} opacity percent`}
              controlSize="sm"
              className="font-mono"
            />
          </label>
        </div>
      </div>
    );
  };

  const renderTokenRow = (name: string) => {
    const raw: unknown = valueOf(name);
    if (typeof raw === "object" && raw !== null) {
      const pair = raw as Record<string, string>;
      return (
        <div key={name} className="flex items-center gap-2 py-1.5">
          <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">
            {friendlyTokenLabel(name)}
          </span>
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
    if (doc.tokens[mode]?.[name]?.$type === "shadow") return renderShadowRow(name, str);
    const hex = colorToHex(str);
    return (
      <div key={name} className="flex items-center gap-2 py-1.5">
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
        <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">
          {friendlyTokenLabel(name)}
        </span>
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

  /** Row-level match on friendly label plus token name (names stay searchable, never shown). */
  const rowMatch = (label: string, token: string) =>
    q === "" || `${label} ${token}`.toLowerCase().includes(q);

  const visibleFontSlots = FONT_SLOTS.filter(
    ({ label, token }) => q === "" || `${label} typeface font ${token}`.toLowerCase().includes(q),
  );

  const shadowTokens = ["--shadow-sm", "--shadow-md", "--shadow-lg", "--shadow-xl"].filter((t) =>
    rowMatch(`${friendlyTokenLabel(t)} shadow elevation`, t),
  );
  const shapeSections = [
    ...(rowMatch("Corner radius rounding", "--radius")
      ? [{ id: "radius", title: "Radius", body: renderTokenRow("--radius") }]
      : []),
    ...(shadowTokens.length > 0
      ? [{ id: "elevation", title: "Elevation", body: shadowTokens.map(renderTokenRow) }]
      : []),
  ];

  const motionTokens = ["--motion-fast", "--motion-normal"].filter((t) =>
    rowMatch(`${friendlyTokenLabel(t)} timing duration easing`, t),
  );
  const motionSections =
    motionTokens.length > 0
      ? [{ id: "timing", title: "Timing", body: motionTokens.map(renderTokenRow) }]
      : [];

  const tuneSlots = editingManifest ? Object.entries(editingManifest.styleSurface) : [];
  const tuneSections = [
    ...tuneSlots.flatMap(([slot, knobs]) => {
      const rows = Object.entries(knobs).filter(
        ([knob]) =>
          !NON_TOKEN_KNOBS.has(knob) && rowMatch(`${knob} ${slot} ${friendlyKnobLabel(knob)}`, knob),
      );
      if (rows.length === 0) return [];
      return [
        {
          id: `slot-${slot}`,
          title: slot.charAt(0).toUpperCase() + slot.slice(1),
          body: (
            <div className="flex flex-col gap-2.5">
              {rows.map(([knob, spec]) => (
                <KnobControl
                  key={`${slot}.${knob}`}
                  label={friendlyKnobLabel(knob)}
                  spec={spec}
                  value={selection[knob] ?? spec.default}
                  onChange={(next) => setKnob(knob, next)}
                />
              ))}
            </div>
          ),
        },
      ];
    }),
  ];

  const visibleTweaks = QUICK_TWEAKS.filter(
    (t) => q === "" || `${t.title} ${t.hint}`.toLowerCase().includes(q),
  );

  const sidebarRows = SIDEBAR_FOLLOWS.filter((t) => q === "" || t.toLowerCase().includes(q));
  const sidebarBody = (
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
      {sidebarRows.map(renderTokenRow)}
    </div>
  );

  const renderFontSlot = ({
    slot,
    token,
    label,
  }: Pick<(typeof FONT_SLOTS)[number], "slot" | "token" | "label">) => {
    const options = fontOptionsFor(slot);
    const selected = options.find((o) => o.id === fontSelectionFor(slot, token));
    return (
      <div key={slot} className="flex flex-col gap-1 py-1">
        <Select value={fontSelectionFor(slot, token)} onValueChange={(id) => setFontSlot(slot, token, id)}>
          <SelectTrigger aria-label={`${label} typeface`} className="w-full">
            <SelectValue placeholder="Select a typeface">
              {selected ? (
                <span style={{ fontFamily: fontStackFor(selected.family, selected.classification, slot) }}>
                  {selected.family}
                </span>
              ) : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                <span style={{ fontFamily: fontStackFor(o.family, o.classification, slot) }}>{o.family}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const renderTweak = (tweak: QuickTweak) => {
    const applicable = computeTweak(tweak) !== null;
    return (
      <button
        key={tweak.id}
        type="button"
        disabled={!applicable}
        onClick={() => applyTweak(tweak)}
        title={applicable ? tweak.hint : `${tweak.hint} (not applicable to current values)`}
        className="rounded-lg border-(length:--border-width) border-border bg-card p-2.5 text-left transition-colors hover:border-primary disabled:opacity-40"
      >
        <span className="block text-sm font-medium">{tweak.title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{tweak.hint}</span>
      </button>
    );
  };

  /** Cross-tab results: every matching group across Colors … AI Edit. */
  const globalSections = [
    ...visibleSections.flatMap((section) => {
      const rows =
        section.id === "sidebar"
          ? sidebarRows
          : section.tokens.filter((t) => t.toLowerCase().includes(q));
      if (rows.length === 0) return [];
      return [
        {
          id: `find-colors-${section.id}`,
          title: `Colors · ${section.title}`,
          body: section.id === "sidebar" ? sidebarBody : rows.map(renderTokenRow),
        },
      ];
    }),
    ...visibleFontSlots.map(({ slot, token, label }) => ({
      id: `find-type-${slot}`,
      title: `Typography · ${label}`,
      body: renderFontSlot({ slot, token, label }),
    })),
    ...(rowMatch("Corner radius rounding", "--radius")
      ? [{ id: "find-shape-radius", title: "Shape · Radius", body: renderTokenRow("--radius") }]
      : []),
    ...(shadowTokens.length > 0
      ? [{ id: "find-shape-elevation", title: "Shape · Elevation", body: shadowTokens.map(renderTokenRow) }]
      : []),
    ...(motionTokens.length > 0
      ? [{ id: "find-motion", title: "Motion · Timing", body: motionTokens.map(renderTokenRow) }]
      : []),
    ...(visibleTweaks.length > 0
      ? [
          {
            id: "find-tweaks",
            title: "AI Edit · Quick tweaks",
            body: <div className="grid grid-cols-2 gap-2">{visibleTweaks.map(renderTweak)}</div>,
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <IdentityFontLinks fonts={doc.fonts} />

      {/* ---------- Left: theme editor (full-screen drawer on small screens) ---------- */}
      <div
        ref={themePanelRef}
        id="theme-editor-panel"
        tabIndex={-1}
        role={themePanelOpen ? "dialog" : undefined}
        aria-modal={themePanelOpen || undefined}
        aria-label={themePanelOpen ? "Theme editor" : undefined}
        className={`min-h-0 w-full shrink-0 flex-col overscroll-contain bg-background focus:outline-none lg:static lg:flex lg:w-fit lg:max-w-[50%] lg:border-r lg:border-border ${
          themePanelOpen ? "fixed inset-0 z-50 flex" : "hidden lg:flex"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3 lg:hidden">
          <p className="text-sm font-medium">Theme editor</p>
          <Button
            ref={themeCloseRef}
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setThemePanelOpen(false)}
            aria-label="Close theme editor"
            title="Close theme editor"
          >
            <X aria-hidden />
          </Button>
        </div>
        {editingManifest ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex h-13 shrink-0 items-center gap-2 border-b border-border px-3">
              <p className="min-w-0 flex-1 truncate text-sm font-medium">
                Editing {editingManifest.title}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setEditingComponent(null)}
                aria-label="Close component editor"
                title="Close component editor"
              >
                <X aria-hidden />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
              {tuneSections.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {q === ""
                    ? `No component-specific tokens — ${editingManifest.title} inherits everything from the global theme.`
                    : `No matches for “${query}”.`}
                </p>
              ) : (
                <FilteredSections
                  key={editingManifest.name}
                  searching={false}
                  emptyLabel=""
                  sections={tuneSections}
                />
              )}
            </div>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0">
          <div className="flex h-13 shrink-0 items-center border-b border-border px-2 sm:px-3">
            <TabsList aria-label="Theme editor" className="w-fit max-w-full overflow-x-auto">
              {[
                { label: "Colors", value: "colors" },
                { label: "Typography", value: "typography" },
                { label: "Shape", value: "shape" },
                { label: "Motion", value: "motion" },
                { label: "AI Edit", value: "ai-edit" },
              ].map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="shrink-0">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <TabSearch value={query} onChange={setQuery} placeholder="Search tokens…" />

          {/* Panels are size-contained on the inline axis so the rail hugs the tab strip, not the widest row. */}
          {q === "" ? (
            <>
          <TabsContent value="colors" className="mt-0 min-h-0 flex-1 overflow-y-auto px-3 pb-3 [contain:inline-size]">
            <ColorsAccordion
              sections={visibleSections}
              query={query}
              value={accordionValue}
              onValueChange={(v) => setOpenSections(v as string[])}
              renderRow={renderTokenRow}
              sidebarBody={sidebarBody}
            />
          </TabsContent>

          <TabsContent value="typography" className="mt-0 min-h-0 flex-1 overflow-y-auto px-3 pb-3 [contain:inline-size]">
            <FilteredSections
              searching={q !== ""}
              emptyLabel={query}
              sections={visibleFontSlots.map(({ slot, token, label }) => ({
                id: slot,
                title: label,
                body: renderFontSlot({ slot, token, label }),
              }))}
            />
          </TabsContent>

          <TabsContent value="shape" className="mt-0 min-h-0 flex-1 overflow-y-auto px-3 pb-3 [contain:inline-size]">
            <FilteredSections searching={q !== ""} emptyLabel={query} sections={shapeSections} />
          </TabsContent>

          <TabsContent value="motion" className="mt-0 min-h-0 flex-1 overflow-y-auto px-3 pb-3 [contain:inline-size]">
            <FilteredSections searching={q !== ""} emptyLabel={query} sections={motionSections} />
          </TabsContent>

          <TabsContent value="ai-edit" className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-3 pt-3 [contain:inline-size]">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <p className="text-xs text-muted-foreground">Suggested changes</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {visibleTweaks.map(renderTweak)}
              </div>
            </div>
            <div className="shrink-0 pt-3">
              <PromptEdit libraryId={libraryId} />
            </div>          </TabsContent>
            </>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
              <FilteredSections searching emptyLabel={query} sections={globalSections} />
            </div>
          )}
          </Tabs>
        )}
      </div>

      <Button
        ref={themeTriggerRef}
        type="button"
        onClick={() => setThemePanelOpen(true)}
        aria-label="Open theme editor"
        aria-controls="theme-editor-panel"
        aria-expanded={themePanelOpen}
        aria-haspopup="dialog"
        title="Open theme editor"
        className="fixed bottom-5 right-5 z-40 size-12 rounded-full shadow-lg lg:hidden"
      >
        <SlidersHorizontal aria-hidden />
      </Button>

      {/* ---------- Right: live preview ---------- */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-wrap items-center gap-1 gap-y-2 border-b border-border px-3 py-2 sm:h-13 sm:flex-nowrap sm:gap-y-0 sm:py-0">
          <Tabs
            value={previewTab}
            onValueChange={(v) => setPreviewTab(v as PreviewTab)}
            className="min-w-0 gap-0"
          >
            <TabsList aria-label="Preview library" className="max-w-full overflow-x-auto">
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
          {/* Actions get their own row on small screens so the tabs and history controls keep a full row. */}
          <div className="flex w-full items-center gap-1 max-sm:justify-start sm:w-auto">
            <Button type="button" variant="ghost" size="sm" onClick={resetAll} title="Reset to saved">
              Reset
            </Button>
            {savedAt ? <span className="hidden text-xs text-muted-foreground sm:inline">Saved {savedAt}</span> : null}
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
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-background">
          <div className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b border-border bg-background px-4">
            <div className="relative w-full">
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
          {previewTab === "components" ? (
            <PreviewSections
              key="components"
              searching={previewQuery.trim() !== ""}
              sections={COMPONENT_SECTIONS}
              sectionOf={COMPONENT_SECTION_BY_NAME}
              items={manifests.filter(
                (m) =>
                  previewQuery.trim() === "" ||
                  `${m.title} ${m.name}`.toLowerCase().includes(previewQuery.trim().toLowerCase()),
              )}
              boxClass="h-72"
              emptyLabel="components"
              onEdit={(m) => {
                setQuery("");
                setEditingComponent(m.name);
                if (window.matchMedia("(max-width: 1023px)").matches) setThemePanelOpen(true);
              }}
              previewVars={previewVars as React.CSSProperties}
              dark={mode === "dark"}
              renderItem={(m) => (
                <ComponentPreview
                  name={m.name}
                  selection={doc.components[m.name] ?? {}}
                  axes={m.axes}
                />
              )}
            />
          ) : (
            <PreviewSections
              key="blocks"
              searching={previewQuery.trim() !== ""}
              sections={BLOCK_SECTIONS}
              sectionOf={BLOCK_SECTION_BY_NAME}
              items={blocks.filter(
                (b) =>
                  previewQuery.trim() === "" ||
                  `${b.title} ${b.name}`.toLowerCase().includes(previewQuery.trim().toLowerCase()),
              )}
              boxClass="h-96"
              colsClass="grid-cols-1"
              emptyLabel="blocks"
              onExpand={openExpanded}
              previewVars={previewVars as React.CSSProperties}
              dark={mode === "dark"}
              renderItem={(b) => <BlockPreview name={b.name} />}
            />
          )}
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
            <div className="flex min-h-13 shrink-0 flex-wrap items-center gap-2 border-b border-border px-3 py-2">
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
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div
                style={previewVars as React.CSSProperties}
                className={`min-h-full bg-background font-sans text-foreground ${mode === "dark" ? "dark" : ""}`}
              >
                <PreviewPortalHost>
                  <BlockPreview name={expandedBlock.name} axes={expandedAxes ?? undefined} />
                </PreviewPortalHost>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
