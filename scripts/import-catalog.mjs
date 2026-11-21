import fs from "node:fs";
import path from "node:path";

const catalogPath = process.argv[2] ?? "catalog-aggregate.json";
const SRC = "packages/foundation/src";
const TPL = `${SRC}/templates`;
const MAN = `${SRC}/manifests`;
const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const writeJson = (f, v) => fs.writeFileSync(f, `${JSON.stringify(v, null, 2)}\n`);

const OLD = `accordion alert-dialog aspect-ratio avatar badge button card checkbox collapsible context-menu dialog dropdown-menu form hover-card input label menubar navigation-menu one-time-password-field password-toggle-field popover progress radio-group scroll-area select separator skeleton slider switch table tabs textarea toast toggle-group toggle toolbar tooltip`.split(" ");

// Verify these against your manifest schema's category values.
const CATEGORY = { "Forms & Inputs": "forms", "Buttons & Actions": "actions", "Overlays, Menus & Dialogs": "overlay" };

// slug: description | use when | do not use when
const META = {
  attachment: "A file or media attachment with status and actions.|Users review attached files.|Users need to select files.",
  calendar: "A date grid for single, multiple, or range selection.|Surrounding dates give useful context.|A known date is faster to type.",
  checkbox: "A control for independent on or off choices.|Several options can be selected.|Only one option may be selected.",
  combobox: "A searchable list of selectable options.|The option list is long.|There are only a few options.",
  "date-picker": "A button that opens a calendar to choose a date.|Form space is limited.|The calendar must stay visible.",
  field: "Label, description, and error layout for form controls.|Building accessible forms.|Content is not a form control.",
  "file-drop": "A drag and drop upload zone.|Users upload local files.|Files come from an existing library.",
  input: "A single line text control.|Collecting short values.|Collecting multiline text.",
  "input-group": "An input with attached text, icons, or buttons.|Add-ons belong to one input.|Controls are unrelated.",
  "input-otp": "Segmented entry for one-time codes.|Entering a fixed length code.|Length is variable.",
  label: "An accessible caption for a control.|Naming a form control.|Styling ordinary text.",
  "native-select": "A styled native select element.|Platform pickers are preferred.|Options need rich content.",
  questionnaire: "A guided sequence of questions.|Collecting answers step by step.|A short form fits on one screen.",
  "radio-group": "A set of mutually exclusive choices.|Exactly one visible option applies.|Several options can apply.",
  select: "A dropdown for choosing one option.|Choosing from a moderate list.|Users need to search options.",
  slider: "A draggable control for numeric values.|Approximate values are acceptable.|An exact value is required.",
  stepper: "Progress through ordered steps.|A flow has distinct stages.|Sections can be visited in any order.",
  switch: "An immediate on or off setting.|Changes apply instantly.|Changes require submission.",
  textarea: "A multiline text control.|Collecting longer text.|Collecting short values.",
  "vanish-input": "A search field with cycling placeholders.|Suggesting example queries.|The placeholder carries required instructions.",
  button: "A control that triggers an action.|Users perform an action.|Navigating with plain text links.",
  "button-group": "Related buttons joined together.|Actions share a context.|Actions are unrelated.",
  confetti: "A button that fires a confetti burst.|Celebrating a milestone.|Routine or destructive actions.",
  "cool-mode": "A particle effect around an interactive child.|Adding playful feedback.|The interface is task critical.",
  "interactive-hover-button": "A button with a sliding hover reveal.|Highlighting a marketing action.|Dense application toolbars.",
  "magnetic-button": "A button that leans toward the cursor.|Emphasizing one hero action.|Many buttons are adjacent.",
  "pulsating-button": "A button with an attention pulse.|One action needs attention.|Several actions compete.",
  "rainbow-button": "A call to action with a brand gradient.|A single brand moment.|Secondary actions.",
  "ripple-button": "A button that ripples from the press point.|Press feedback matters.|Motion would distract.",
  "shimmer-button": "A call to action with a light sweep.|Highlighting a primary action.|Repeated list actions.",
  "shiny-button": "A button with a moving shine.|Promoting a feature.|Routine form submission.",
  "stateful-button": "A button showing loading and result states.|Actions are asynchronous.|Actions finish instantly.",
  "theme-toggler": "A light and dark mode switch.|Users control the theme.|The theme is fixed.",
  toggle: "A two state button.|Turning one option on or off.|Submitting an action.",
  "toggle-group": "A set of related toggle buttons.|Choosing view or format options.|Navigating between pages.",
  "alert-dialog": "A blocking confirmation dialog.|Confirming destructive actions.|Showing optional information.",
  "animated-modal": "A modal with spring animation.|A focused task deserves emphasis.|Dialogs open frequently.",
  "animated-tooltip": "An avatar row with name tooltips.|Showing a small group of people.|Showing large member lists.",
  command: "A searchable command menu.|Users search many actions.|There are only a few actions.",
  "context-menu": "A menu opened by right click or long press.|Offering shortcuts for an object.|It is the only path to an action.",
  dialog: "A modal window for focused tasks.|A task interrupts the page briefly.|Content belongs inline.",
  drawer: "A draggable edge panel.|Mobile friendly secondary tasks.|Content must stay visible.",
  "dropdown-menu": "A menu opened from a trigger.|Grouping related actions.|Selecting a form value.",
  "hero-video-dialog": "A thumbnail that opens a video overlay.|Featuring a product video.|Video should play inline.",
  "hover-card": "A preview shown on hover or focus.|Previewing linked content.|Content is essential on touch devices.",
  menubar: "A persistent row of menus.|Desktop style applications.|Simple site navigation.",
  popover: "Floating content anchored to a trigger.|Showing small contextual controls.|A blocking decision is required.",
  sheet: "A side panel dialog.|Editing details beside the page.|A short confirmation is enough.",
  tooltip: "A short hint for a control.|Clarifying an icon button.|Content is interactive.",
};

// Component tokens: [knob, allowed values, default, ...[find, template]]
// {p} becomes (--component-knob,default); {v} becomes var(--component-knob,default).
// Knob names must not collide with the editor's NON_TOKEN_KNOBS.
const k = (knob, values, def, ...edits) => ({ knob, values: values.split(" "), def, edits });
const H = "2rem 2.25rem 2.5rem 2.75rem 3rem 3.5rem";
const W = "16rem 18rem 20rem 24rem 28rem 32rem 36rem 42rem 56rem";
const S = "0.875rem 1rem 1.125rem 1.25rem 1.5rem";
const R = "0px 0.375rem 0.625rem 1rem 9999px";
const height = (find, def) => k("height", H, def, [find, find.replace(/h-\d+/, "h-{p}")]);
const radius = (find) => k("cornerShape", R, "9999px", [find, find.replace("rounded-full", "rounded-{p}")]);
const overlay = () => k("overlayOpacity", "20% 30% 40% 50% 60% 70%", "40%", ["bg-black/50", "bg-foreground/[{v}]"]);
const menuWidth = () => k("menuMinWidth", "8rem 10rem 12rem 14rem", "8rem", ["min-w-[8rem]", "min-w-{p}"]);

const TOKENS = {
  attachment: [
    k("verticalWidth", "5rem 6rem 7rem 8rem", "6rem", ["w-24 flex-col", "w-{p} flex-col"]),
    k("mediaWidth", "2rem 2.5rem 3rem 3.5rem", "2.5rem", ["aspect-square w-10", "aspect-square w-{p}"]),
  ],
  calendar: [k("cellSize", "1.75rem 2rem 2.25rem 2.5rem", "2rem", ["[--cell-size:--spacing(8)]", "[--cell-size:{v}]"])],
  checkbox: [k("boxSize", S, "1rem", ["peer size-4", "peer size-{p}"])],
  combobox: [k("listMaxHeight", "16rem 20rem 24rem 28rem", "24rem", ["max-h-96 w-(--anchor-width)", "max-h-{p} w-(--anchor-width)"])],
  "date-picker": [k("width", W, "15rem")],
  field: [k("groupGap", "1rem 1.25rem 1.5rem 1.75rem 2rem", "1.75rem", ["flex-col gap-7", "flex-col gap-{p}"])],
  "file-drop": [k("zonePadding", "1.5rem 2rem 2.5rem 3rem", "2.5rem", ["p-10", "p-{p}"])],
  input: [height("h-9 w-full", "2.25rem"), k("paddingX", "0.5rem 0.75rem 1rem", "0.75rem", ["px-3 py-1", "px-{p} py-1"])],
  "input-otp": [k("slotSize", H, "2.25rem", ["h-9 w-9", "size-{p}"])],
  "native-select": [height("h-9 w-full", "2.25rem")],
  "radio-group": [k("itemSize", S, "1rem", ["aspect-square size-4", "aspect-square size-{p}"])],
  select: [
    k("height", H, "2.25rem", ["data-[size=default]:h-9", "data-[size=default]:h-{p}"]),
    menuWidth(),
  ],
  slider: [
    k("trackThickness", "0.25rem 0.375rem 0.5rem 0.75rem", "0.375rem",
      ["data-[orientation=horizontal]:h-1.5", "data-[orientation=horizontal]:h-{p}"],
      ["data-[orientation=vertical]:w-1.5", "data-[orientation=vertical]:w-{p}"]),
    k("thumbSize", S, "1rem", ["block size-4", "block size-{p}"]),
  ],
  stepper: [k("markerSize", "1.5rem 1.75rem 2rem 2.5rem", "2rem",
    ["grid size-8", "grid size-{p}"],
    ["top-4 right-4 left-4", "top-[calc({v}/2)] right-[calc({v}/2)] left-[calc({v}/2)]"])],
  switch: [
    k("trackHeight", "1.15rem 1.25rem 1.5rem", "1.15rem", ["data-[size=default]:h-[1.15rem]", "data-[size=default]:h-{p}"]),
    k("trackWidth", "2rem 2.25rem 2.5rem", "2rem", ["data-[size=default]:w-8", "data-[size=default]:w-{p}"]),
  ],
  textarea: [k("minHeight", "3rem 4rem 5rem 6rem 8rem", "4rem", ["min-h-16", "min-h-{p}"])],
  "vanish-input": [height("h-12 w-full", "3rem"), radius("rounded-full border")],
  button: [
    k("height", H, "2.25rem", ["h-9 px-4 py-2", "h-{p} px-4 py-2"], ['"size-9"', '"size-{p}"']),
    k("heightSm", "1.75rem 2rem 2.25rem", "2rem", ["h-8 gap-1.5", "h-{p} gap-1.5"]),
    k("heightLg", H, "2.5rem", ["h-10 rounded-md px-6", "h-{p} rounded-md px-6"]),
    k("fontWeight", "400 500 600 700", "500", ["font-medium whitespace-nowrap", "[font-weight:{v}] whitespace-nowrap"]),
  ],
  confetti: [height("h-11 cursor-pointer", "2.75rem"), radius("rounded-full border bg-card")],
  "interactive-hover-button": [radius("rounded-full border p-2")],
  "magnetic-button": [height("h-11 cursor-pointer", "2.75rem")],
  "rainbow-button": [height("h-11 cursor-pointer", "2.75rem")],
  "ripple-button": [height("h-11 cursor-pointer", "2.75rem")],
  "shimmer-button": [height("h-12 cursor-pointer", "3rem"), radius("rounded-full bg-primary")],
  "stateful-button": [height("h-10 cursor-pointer", "2.5rem"), radius("rounded-full px-5")],
  "theme-toggler": [k("buttonSize", H, "2.25rem", ["grid size-9", "grid size-{p}"])],
  toggle: [height("h-9 min-w-9", "2.25rem")],
  "alert-dialog": [k("width", W, "32rem", ["data-[size=default]:sm:max-w-lg", "data-[size=default]:sm:max-w-{p}"]), overlay()],
  "animated-modal": [k("width", W, "32rem", ["max-w-lg overflow-hidden", "max-w-{p} overflow-hidden"])],
  "animated-tooltip": [k("avatarSize", H, "2.75rem", ["size-11", "size-{p}"])],
  command: [k("listMaxHeight", "200px 300px 400px 500px", "300px", ["max-h-[300px]", "max-h-{p}"])],
  "context-menu": [menuWidth()],
  dialog: [k("width", W, "32rem", ["sm:max-w-lg", "sm:max-w-{p}"]), overlay()],
  drawer: [
    k("handleWidth", "64px 80px 100px 120px", "100px", ["w-[100px]", "w-{p}"]),
    k("sideWidth", W, "24rem", ["sm:max-w-sm", "sm:max-w-{p}"]),
    overlay(),
  ],
  "dropdown-menu": [menuWidth()],
  "hero-video-dialog": [k("width", W, "56rem", ["max-w-4xl", "max-w-{p}"])],
  "hover-card": [k("width", W, "16rem", ["w-64", "w-{p}"])],
  menubar: [height("h-9 items-center", "2.25rem"), k("menuMinWidth", "10rem 12rem 14rem 16rem", "12rem", ["min-w-[12rem]", "min-w-{p}"])],
  popover: [k("width", W, "18rem", ["w-72", "w-{p}"])],
  sheet: [k("width", W, "24rem", ["sm:max-w-sm", "sm:max-w-{p}"]), overlay()],
  tooltip: [k("arrowSize", "0.5rem 0.625rem 0.75rem", "0.625rem", ["size-2.5", "size-{p}"])],
};

const axis = (values, def = "default") => ({ values: values.split(" "), default: def });
const AXES = {
  attachment: { size: axis("default sm xs"), orientation: axis("horizontal vertical", "horizontal") },
  button: { variant: axis("default destructive outline secondary ghost link"), size: axis("default xs sm lg icon icon-xs icon-sm icon-lg") },
  "button-group": { orientation: axis("horizontal vertical", "horizontal") },
  field: { orientation: axis("vertical horizontal responsive", "vertical") },
  "input-group": { align: axis("inline-start inline-end block-start block-end", "inline-start") },
  "native-select": { size: axis("default sm") },
  select: { size: axis("default sm") },
  switch: { size: axis("default sm") },
  toggle: { variant: axis("default outline"), size: axis("default sm lg") },
  "toggle-group": { variant: axis("default outline"), size: axis("default sm lg") },
  "alert-dialog": { size: axis("default sm") },
  "pulsating-button": { variant: axis("pulse ripple", "pulse") },
};

// React 19 hoists and de-duplicates these, so keyframes ship with the component.
const style = (id, css) => `<style href="${id}" precedence="medium">{${JSON.stringify(css)}}</style>`;
const before = (marker, element) => [marker, `${element}\n      ${marker}`];

const PATCHES = {
  button: [["bg-destructive text-white", "bg-destructive text-destructive-foreground"]],
  slider: [["key={index}", 'key={index}\n          aria-label={props["aria-label"]}']],
  stepper: [["bg-gradient-to-r from-brand-from to-brand-to", "bg-brand"]],
  "stateful-button": [["data-[state=error]:text-white", "data-[state=error]:text-destructive-foreground"]],
  "shimmer-button": [
    ["rgba(255,255,255,0.35)", "color-mix(in_oklab,var(--primary-foreground)_35%,transparent)"],
    ["animate-shimmer", "animate-[arche-shimmer_2.5s_linear_infinite]"],
    before('<span className="relative z-10 inline-flex items-center gap-2">',
      style("arche-shimmer", "@keyframes arche-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}")),
  ],
  "rainbow-button": [
    ["animate-rainbow", "animate-[arche-rainbow_var(--rainbow-duration,4s)_linear_infinite]"],
    ["      {children}\n    </button>", `      ${style("arche-rainbow", "@keyframes arche-rainbow{from{background-position:0% 50%}to{background-position:200% 50%}}")}\n      {children}\n    </button>`],
  ],
  "ripple-button": [
    ["animate-ripple", "animate-[arche-ripple_600ms_ease-out_forwards]"],
    before('<span className="relative z-10">{children}</span>',
      style("arche-ripple", "@keyframes arche-ripple{from{transform:scale(0);opacity:.35}to{transform:scale(1);opacity:0}}")),
  ],
  "pulsating-button": [
    ['"animate-pulse" : "animate-pulse-ripple"', '"animate-[arche-pulse_var(--duration)_ease-out_infinite]" : "animate-[arche-pulse-ripple_var(--duration)_cubic-bezier(0.16,1,0.3,1)_infinite]"'],
    before('<span className="relative z-10">{children}</span>', style("arche-pulse",
      "@keyframes arche-pulse{0%,100%{box-shadow:0 0 0 0 var(--pulse-color,color-mix(in oklab,var(--bg) 50%,transparent))}50%{box-shadow:0 0 0 var(--distance) var(--pulse-color,color-mix(in oklab,var(--bg) 50%,transparent))}}@keyframes arche-pulse-ripple{0%{box-shadow:0 0 0 0 var(--pulse-color,var(--bg))}100%{box-shadow:0 0 0 var(--distance) transparent}}")),
  ],
  confetti: [
    ['const defaultColors = ["#8b5cf6", "#d946ef", "#22d3ee", "#fbbf24", "#34d399"];',
      'const tokenColors = (source: Element) => {\n  const styles = getComputedStyle(source);\n  return ["--primary", "--brand", "--accent", "--chart-1", "--chart-2"].map((name) => styles.getPropertyValue(name).trim());\n};'],
    ["  colors?: string[];\n", "  colors?: string[];\n  /** Element whose theme tokens colour the burst */\n  source?: Element;\n"],
    ["  colors = defaultColors,\n", "  source = document.documentElement,\n  colors = tokenColors(source),\n"],
    [/confettiBurst\(\{(\s+)x: rect/, "confettiBurst({$1source: e.currentTarget,$1x: rect"],
    ["confettiBurst({ x: e.clientX", "confettiBurst({ source: e.currentTarget, x: e.clientX"],
  ],
  "cool-mode": [["`hsl(${Math.random() * 360}, 70%, 50%)`", 'getComputedStyle(element).getPropertyValue("--chart-" + (1 + Math.floor(Math.random() * 5))).trim()']],
  "animated-tooltip": [
    [/const gradients = \[[\s\S]*?\];/, 'const gradients = [\n  "bg-primary text-primary-foreground",\n  "bg-secondary text-secondary-foreground",\n  "bg-accent text-accent-foreground",\n  "bg-brand text-brand-foreground",\n  "bg-muted text-foreground",\n];'],
    ["bg-gradient-to-br ", ""],
    ["text-white ", ""],
  ],
  "hero-video-dialog": [
    ["fill-white text-white", "fill-primary-foreground text-primary-foreground"],
    ["border-2 border-white", "border-2 border-background"],
    ["bg-neutral-900/50 p-2 text-xl text-white", "bg-foreground/50 p-2 text-xl text-background"],
    [" dark:bg-neutral-100/50 dark:text-black", ""],
    ["rgb(0 0 0 / 0.07)", "color-mix(in oklab, var(--foreground) 7%, transparent)"],
    ["rgb(0 0 0 / 0.06)", "color-mix(in oklab, var(--foreground) 6%, transparent)"],
  ],
  "shiny-button": [
    ["text-[rgb(0,0,0,65%)]", "text-foreground/65"],
    [" dark:text-[rgb(255,255,255,90%)]", ""],
    ["var(--primary)/10%_0%", "color-mix(in_oklab,var(--primary)_10%,transparent)_0%"],
    ["dark:hover:shadow-[0_0_20px_var(--primary)/10%]", "dark:hover:shadow-lg"],
    ["rgb(0,0,0)", "var(--foreground)"],
    [/var\(--primary\)\/(\d+)% calc/g, "color-mix(in oklab, var(--primary) $1%, transparent) calc"],
  ],
  questionnaire: [
    ['import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"', 'import { CheckIcon } from "lucide-react"'],
    ["<IconPlaceholder", "<CheckIcon"],
    [/\s+(?:lucide|tabler|hugeicons|phosphor|remixicon)="[^"]*"/g, ""],
  ],
};

const cls = (pattern, to) => [new RegExp(`(?<=[\\s"'\`:])${pattern}(?=[\\s"'\`])`, "g"), to];
const GLOBAL = [
  cls("border", "border-(length:--border-width)"),
  cls("border-([trblxy])", "border-$1-(length:--border-width)"),
  cls("border-2", "border-[length:calc(var(--border-width)*2)]"),
  cls("rounded(-[trbl]{1,2})?-2xl", "rounded$1-xl"),
  cls("rounded-(?:xs|\\[4px\\]|\\[2px\\])", "rounded-sm"),
  cls("shadow-xs", "shadow-sm"),
  cls("shadow-2xl", "shadow-xl"),
  cls("shadow", "shadow-sm"),
  cls("duration-(?:100|150)", "duration-(--motion-fast-duration)"),
  cls("duration-(?:200|300|500)", "duration-(--motion-normal-duration)"),
  cls("bg-white", "bg-background"),
  [/bg-black\/50/g, "bg-foreground/40"],
  [/h-px bg-border/g, "h-(--border-width) bg-border"],
  [/cn-font-heading/g, "font-display"],
  [/:shimmer\b/g, ":animate-pulse"],
  [/ scroll-fade-x/g, ""],
  [/scrollbar-none/g, "[scrollbar-width:none]"],
  [/var\(--brand-from\)/g, "var(--brand)"],
  [/var\(--brand-via\)/g, "color-mix(in_oklab,var(--brand)_75%,var(--primary))"],
  [/var\(--brand-to\)/g, "color-mix(in_oklab,var(--brand)_75%,var(--chart-3))"],
];

function edit(source, find, to, slug) {
  const out = typeof find === "string" ? source.split(find).join(to) : source.replace(find, to);
  if (out === source) throw new Error(`${slug}: pattern not found: ${find}`);
  return out;
}

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const pascal = (s) => s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("");

function transform(slug, source) {
  let out = source.replace(/\r\n/g, "\n");
  for (const [find, to] of PATCHES[slug] ?? []) out = edit(out, find, to, slug);
  for (const token of TOKENS[slug] ?? []) {
    const name = `--${slug}-${kebab(token.knob)}`;
    for (const [find, template] of token.edits) {
      const to = template.replaceAll("{p}", `(${name},${token.def})`).replaceAll("{v}", `var(${name},${token.def})`);
      out = edit(out, find, to, slug);
    }
  }
  for (const [find, to] of GLOBAL) out = out.replace(find, to);
  out = out
    .replace(/from "(?:cn|@\/lib\/utils)"/g, 'from "./lib/utils.js"')
    .replace(/from "@\/registry\/[\w-]+\/ui\/([\w-]+)"/g, 'from "./$1.js"')
    .replace(/import \{\s*(\w+)(?:\s+as\s+(\w+))?\s*\} from "radix-ui"/g,
      (_, name, alias) => `import * as ${alias ?? name} from "@radix-ui/react-${kebab(name)}"`);
  if (/\bReact\./.test(out) && !/import\s+(?:\*\s+as\s+React|React\b)/.test(out)) {
    const line = 'import type * as React from "react"\n';
    out = /^"use client";?\n/.test(out) ? out.replace(/^("use client";?\n)/, `$1\n${line}`) : line + out;
  }
  return out;
}

const contract = readJson(`${SRC}/contract/token-contract.json`).tokens.map((t) => t.name);
function tokensUsed(source) {
  return contract.filter((token) => {
    const bare = token.slice(2);
    if (source.includes(`${token})`) || source.includes(`${token},`) || source.includes(`${token}-duration`)) return true;
    if (token === "--radius") return /\brounded-/.test(source);
    if (token.startsWith("--shadow") || token.startsWith("--font")) return new RegExp(`\\b${bare}(?![\\w-])`).test(source);
    return new RegExp(`\\b(?:bg|text|border|ring|ring-offset|fill|stroke|from|via|to|outline|shadow)-${bare}(?![\\w-])`).test(source);
  });
}

function buildManifest(slug, title, category, source, old) {
  const imports = [...source.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
  const dependencies = [...new Set(imports
    .filter((i) => !i.startsWith(".") && !/^react(-dom)?(\/|$)/.test(i))
    .map((i) => i.split("/").slice(0, i.startsWith("@") ? 2 : 1).join("/")))].sort();
  const registryDependencies = [...new Set(imports
    .filter((i) => i.startsWith("./"))
    .map((i) => path.basename(i, ".js")))].sort();
  const primitivePackage =
    dependencies.find((d) => d.startsWith("@radix-ui/") && d !== "@radix-ui/react-slot") ??
    dependencies.find((d) => ["@base-ui/react", "cmdk", "vaul", "input-otp", "react-day-picker", "@shadcn/react", "@radix-ui/react-slot"].includes(d)) ??
    "react";
  const found = [...new Set([...source.matchAll(/\w*Primitive\.([A-Z]\w*)(?!\.Props)/g)].map((m) => m[1]))];
  const parts = found.length ? found : ["Root"];
  const slotNames = [...new Set(["root", ...[...source.matchAll(/data-slot="([\w-]+)"/g)]
    .map((m) => (m[1] === slug ? "root" : m[1].replace(`${slug}-`, "")))])];
  const [description, useWhen, avoid] = META[slug].split("|");
  const knobs = Object.fromEntries((TOKENS[slug] ?? []).map((t) => [t.knob, { type: "enum", values: t.values, default: t.def }]));
  return {
    name: slug,
    title,
    description: old?.description ?? description,
    category: old?.category ?? category,
    manifestVersion: 1,
    primitive: { package: primitivePackage, parts, propsInherited: true },
    slots: slotNames.map((name) => ({
      name,
      part: parts.includes(pascal(name)) ? pascal(name) : parts[0],
      required: name === "root",
    })),
    axes: AXES[slug] ?? {},
    styleSurface: Object.keys(knobs).length ? { root: knobs } : {},
    tokensUsed: tokensUsed(source),
    dependencies,
    registryDependencies,
    files: [{ name: slug, source: `src/templates/${slug}.tsx`, target: `components/ui/${slug}.tsx`, type: "registry:ui" }],
    standards: old?.standards ?? {
      purpose: description,
      useWhen: [useWhen],
      doNotUseWhen: [avoid],
      rules: [{ id: `${slug}-accessible-name`, severity: "error", check: "Every interactive control has an accessible name." }],
    },
  };
}

// 1. Transform everything in memory first, so a failure writes nothing.
const manifestPath = (slug) => `${MAN}/${slug}.manifest.json`;
const results = new Map();
for (const [group, items] of Object.entries(readJson(catalogPath).sections.Components)) {
  if (!CATEGORY[group]) { console.warn(`Skipping unreviewed category: ${group}`); continue; }
  for (const item of items) {
    const slug = item.registry?.name ?? item.name.toLowerCase().replaceAll(" ", "-");
    const source = item.registry
      ? transform(slug, item.registry.files[0].content)
      : fs.readFileSync(`${TPL}/${slug}.tsx`, "utf8");
    const old = fs.existsSync(manifestPath(slug)) ? readJson(manifestPath(slug)) : undefined;
    results.set(slug, { source, manifest: buildManifest(slug, item.name, CATEGORY[group], source, old) });
  }
}

// 2. Keep old components still needed by blocks or by new components.
const allManifests = fs.readdirSync(SRC, { recursive: true })
  .filter((f) => String(f).endsWith(".manifest.json"))
  .map((f) => readJson(path.join(SRC, String(f))));
const queue = [
  ...allManifests.filter((m) => ["marketing", "application"].includes(m.category)),
  ...[...results.values()].map((r) => r.manifest),
].flatMap((m) => m.registryDependencies ?? []);
const retained = new Set();
while (queue.length) {
  const dep = queue.pop();
  if (!OLD.includes(dep) || results.has(dep) || retained.has(dep)) continue;
  retained.add(dep);
  queue.push(...readJson(manifestPath(dep)).registryDependencies);
}

// 3. Write new files and delete unused old ones.
for (const [slug, { source, manifest }] of results) {
  fs.writeFileSync(`${TPL}/${slug}.tsx`, source);
  writeJson(manifestPath(slug), manifest);
  const leftover = source.match(/#[0-9a-f]{6}\b|rgba?\(|hsl\(|-(?:white|black)\b/gi);
  if (leftover) console.warn(`${slug}: hardcoded colours remain: ${leftover.join(", ")}`);
}
const removed = OLD.filter((slug) => !results.has(slug) && !retained.has(slug));
for (const slug of removed) {
  fs.rmSync(`${TPL}/${slug}.tsx`, { force: true });
  fs.rmSync(manifestPath(slug), { force: true });
}

// 4. Update fixture selections.
for (const file of fs.readdirSync("fixtures").filter((f) => f.endsWith(".json"))) {
  const payload = readJson(`fixtures/${file}`);
  if (!payload.components || !payload.tokens) continue;
  for (const slug of removed) delete payload.components[slug];
  for (const [slug, { manifest }] of results) {
    payload.components[slug] = Object.fromEntries([
      ...Object.entries(manifest.axes).map(([name, a]) => [name, a.default]),
      ...(TOKENS[slug] ?? []).map((t) => [t.knob, t.def]),
    ]);
  }
  writeJson(`fixtures/${file}`, payload);
}

console.log(`Imported ${results.size}. Removed: ${removed.join(", ")}`);
console.log(`Retained as dependencies: ${[...retained].join(", ") || "none"}`);