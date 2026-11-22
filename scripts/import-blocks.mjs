// Import aggregate catalog blocks (sections.Blocks) into packages/foundation/src/blocks.
// Additive only: never deletes. Single-file, fully-resolvable items only;
// everything else is logged as SKIPPED with a reason (mirrors import-catalog).
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const catalog = JSON.parse(readFileSync("catalog-aggregate.json", "utf8"));
const BLOCKS = "packages/foundation/src/blocks";
const contract = JSON.parse(readFileSync("packages/foundation/src/contract/token-contract.json", "utf8"));
const allTokens = new Set(contract.tokens.map((t) => t.name));
const colorTokens = contract.tokens.filter((t) => t.$type === "color").map((t) => t.name);

// --- token scan (mirrors check-manifest-template findTokens) ---
function collectTokens(text) {
  const found = new Set();
  for (const match of text.matchAll(/--[a-z][a-z0-9-]*/g)) {
    const name = match[0];
    if (allTokens.has(name)) found.add(name);
    else if (name.endsWith("-duration") || name.endsWith("-easing")) {
      const parent = name.replace(/-(duration|easing)$/, "");
      if (allTokens.has(parent)) found.add(parent);
    }
  }
  // Split on JSX/quote/brace boundaries too: raw-source utilities often glue
  // to surrounding syntax (e.g. text-brand">), which AST-based checks see cleanly.
  for (const part of text.split(/[\s"'`{}()<>;,]+/)) {
    const utility = part.split(":").at(-1)?.split("/")[0] ?? "";
    if (/^rounded(?:-[tblrse]{1,2})?(?:-(?:sm|md|lg|xl))?$/.test(utility)) found.add("--radius");
    if (/^(?:border|border-[trblxyse])$/.test(utility)) found.add("--border");
    for (const token of colorTokens) {
      const name = token.slice(2);
      if (["bg", "text", "border", "ring", "outline", "fill", "stroke", "decoration", "placeholder", "caret", "ring-offset", "shadow", "from", "via", "to"].some((p) => utility === `${p}-${name}`)) found.add(token);
    }
    for (const token of ["--font-sans", "--font-mono", "--font-display", "--shadow-sm", "--shadow-md", "--shadow-lg", "--shadow-xl"]) {
      if (utility === token.slice(2)) found.add(token);
    }
  }
  return [...found].sort();
}

// --- shared transform helpers (mirrors import-catalog GLOBAL) ---
const cls = (pattern, to) => [new RegExp(`(?<=[\\s"'\`:])${pattern}(?=[\\s"'\`])`, "g"), to];
const pxToRem = [/(-?\d*\.?\d+)px(?=[\s"'`\]?,;}_:/)\]]|$)/g, (m, n) => `${Math.round((Number.parseFloat(n) / 16) * 100000) / 100000}rem`];
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
  [/ring-\[3px\]/g, "ring-3"],
  [/text-\[10px\]/g, "text-[0.625rem]"],
  [/var\(--radius\)-5px/g, "var(--radius)-0.3125rem"],
  [/_2px\)/g, "_0.125rem)"],
  [/%-2px\)/g, "%-0.125rem)"],
  [/drop-shadow\(0 4px 3px /g, "drop-shadow(0 0.25rem 0.1875rem "],
  [/drop-shadow\(0 2px 2px /g, "drop-shadow(0 0.125rem 0.125rem "],
  [/var\(--brand-from\)/g, "var(--brand)"],
  [/var\(--brand-via\)/g, "color-mix(in_oklab,var(--brand)_75%,var(--primary))"],
  [/var\(--brand-to\)/g, "color-mix(in_oklab,var(--brand)_75%,var(--chart-3))"],
  [/\bdrop-shadow-(sm|md|lg|xl)(?![\w-])/g, "drop-shadow-[var(--shadow-$1)]"],
  [/fill-\[#E5E5E5\] dark:fill-\[#404040\]/g, "fill-muted dark:fill-muted"],
  [/fill-\[#F5F5F5\] dark:fill-\[#262626\]/g, "fill-muted dark:fill-card"],
  [/fill-white dark:fill-\[#262626\]/g, "fill-background dark:fill-card"],
  [/fill-\[#E5E5E5\] stroke-\[#E5E5E5\] stroke-\[0\.5\] dark:fill-\[#404040\] dark:stroke-\[#404040\]/g, "fill-muted stroke-muted stroke-[0.5] dark:fill-muted dark:stroke-muted"],
  [/\sfill="#A3A3A3"/g, ' className="fill-muted-foreground"'],
  [/fill: '#E5E7EB'/g, "fill: 'var(--muted)'"],
  [/fill: '#3B82F6'/g, "fill: 'var(--chart-1)'"],
  [/linear-gradient\(#000,#000\)/g, "linear-gradient(black,black)"],
  [/linear-gradient\(#fff 0 0\) content-box, linear-gradient\(#fff 0 0\)/g, "linear-gradient(white 0 0) content-box, linear-gradient(white 0 0)"],
  [/\[--glow-m:#000\]/g, "[--glow-m:black]"],
  [/\[\s*stroke='#ccc'\s*\]/g, ""],
  [/\[\s*stroke='#fff'\s*\]/g, ""],
  pxToRem,
];

// Per-slug strictness fixes (noUncheckedIndexedAccess), filled by the fix cycle.
const BLOCK_PATCHES = {
  "calendar-3": [
    ["      : `${MONTH_NAMES[weekDays[0].getMonth()]} ${weekDays[0].getDate()} – ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}`", "      : `${MONTH_NAMES[weekDays[0]!.getMonth()]} ${weekDays[0]!.getDate()} – ${weekDays[6]!.getDate()}, ${weekDays[6]!.getFullYear()}`"],
    ["  const selectedLabel = selected ? `${MONTH_NAMES[selMonth]} ${selDay}` : \"\"", "  const selectedLabel = selected ? `${MONTH_NAMES[selMonth!]} ${selDay}` : \"\""],
  ],
  "charts-2": [
    ["  ((chartData[11].users - chartData[0].users) / chartData[0].users) * 100", "  ((chartData[11]!.users! - chartData[0]!.users!) / chartData[0]!.users) * 100"],
  ],
  "command-palette-4": [
    ["  const [value, setValue] = React.useState(entries[0].id)", "  const [value, setValue] = React.useState(entries[0]!.id)"],
  ],
  "features-bento": [
    ["  const [lastX, lastY] = points[points.length - 1];", "  const [lastX, lastY] = points[points.length - 1]!;"],
  ],
  "features-tabs": [
    ["                <Avatar initials={[\"MK\", \"JL\", \"AR\"][(c + i) % 3]} />", "                <Avatar initials={[\"MK\", \"JL\", \"AR\"][(c + i) % 3]!} />"],
  ],
  "form-layout-04": [
    ["                defaultValue={selectedWorkspace.id.toString()}", "                defaultValue={selectedWorkspace!.id.toString()}"],
  ],
  "form-layout-05": [
    ["              value={selected.name}", "              value={selected!.name}"],
    ["                    selected.name === plan.name", "                    selected!.name === plan.name"],
  ],
  "notifications-4": [
    ["      [id]: { ...prev[id], [channel]: !prev[id][channel] },", "      [id]: { ...prev[id], [channel]: !prev[id]![channel] } as Channels,"],
    ["                    checked={prefs[category.id].email}", "                    checked={prefs[category.id]!.email}"],
    ["                    checked={prefs[category.id].push}", "                    checked={prefs[category.id]!.push}"],
  ],
  "onboarding-04": [
    ["    activeStep < steps.length ? steps[activeStep].title : ''", "    activeStep < steps.length ? steps[activeStep]!.title : ''"],
    ["    setOpenItem(next < steps.length ? steps[next].title : '');", "    setOpenItem(next < steps.length ? steps[next]!.title : '');"],
  ],
  "onboarding-07": [
    ["        if (next[2].value >= 100 && intervalRef.current) {", "        if (next[2]!.value >= 100 && intervalRef.current) {"],
  ],
  "stats-11": [
    ["      const writes = Number.parseInt(details[0].value.replace(/,/g, ''));", "      const writes = Number.parseInt(details[0]!.value.replace(/,/g, ''));"],
    ["      const reads = Number.parseInt(details[1].value.replace(/,/g, ''));", "      const reads = Number.parseInt(details[1]!.value.replace(/,/g, ''));"],
  ],
  "steps-3": [
    ["            {step.title}", "            {step!.title}"],
    ["            {step.description}", "            {step!.description}"],
  ],
};

function scanElement(s, idx) {
  let i = idx + 1, quote = null, depth = 0;
  const nm = s.slice(i).match(/^[A-Za-z][A-Za-z0-9.]*/);
  if (!nm) return null;
  while (i < s.length) {
    const c = s[i];
    if (quote) { if (c === quote) quote = null; i++; continue; }
    if (c === '"' || c === "'") { quote = c; i++; continue; }
    if (c === "{") { depth++; i++; continue; }
    if (c === "}") { depth--; i++; continue; }
    if (c === ">" && depth === 0) {
      const selfClose = s[i - 1] === "/";
      if (selfClose) return { end: i + 1, selfClose: true, tag: nm[0] };
      const close = `</${nm[0]}>`;
      const ci = s.indexOf(close, i + 1);
      if (ci === -1) return null;
      return { end: ci + close.length, selfClose: false, tag: nm[0] };
    }
    i++;
  }
  return null;
}

// end index (exclusive) of the outer open tag, skipping the render-prop span
function openTagEnd(s, from, skipFrom, skipTo) {
  let i = from, quote = null, depth = 0;
  while (i < s.length) {
    if (i >= skipFrom && i < skipTo) { i = skipTo; continue; }
    const c = s[i];
    if (quote) { if (c === quote) quote = null; i++; continue; }
    if (c === '"' || c === "'") { quote = c; i++; continue; }
    if (c === "{") { depth++; i++; continue; }
    if (c === "}") { depth--; i++; continue; }
    if (c === ">" && depth === 0) return i + 1;
    i++;
  }
  return -1;
}

function convertRenderProp(src) {
  let out = src, count = 0;
  for (;;) {
    let ri = out.indexOf("render={<");
    if (ri === -1) {
      // variable form: render={ident} on a self-closing outer -> asChild wrapper
      const vm = out.match(/<([A-Z][A-Za-z0-9.]*)((?:\s[^<>]*?)?)render=\{([A-Za-z_$][A-Za-z0-9_$]*)\}(\s*\/)?>/);
      if (!vm) break;
      const vStart = (vm.index ?? 0);
      const vOuter = scanElement(out, vStart);
      if (!vOuter || !vOuter.selfClose) return { ok: false, reason: "var-render-shape" };
      const vOpen = out.slice(vStart, vOuter.end - 2).replace(/\s*render=\{[A-Za-z_$][A-Za-z0-9_$]*\}/, "").replace(/\s*nativeButton(?:=\{[^}]*\})?/, "").replace(/\s+$/, "");
      out = out.slice(0, vStart) + `${vOpen} asChild>{${vm[3]}}</${vm[1]}>` + out.slice(vOuter.end);
      count++;
      if (count > 200) return { ok: false, reason: "loop" };
      continue;
    }
    const before = out.slice(0, ri);
    const om = before.match(/<([A-Z][A-Za-z0-9.]*)(?:\s[^<>]*)?$/);
    if (!om) return { ok: false, reason: "outer-not-found" };
    const outerStart = ri - om[0].length;
    const inner = scanElement(out, ri + 8);
    if (!inner) return { ok: false, reason: "inner-shape" };
    let renderEnd = inner.end;
    while (renderEnd < out.length && /\s/.test(out[renderEnd])) renderEnd++;
    if (out[renderEnd] !== "}") return { ok: false, reason: "render-close" };
    renderEnd++; // past closing }
    const otEnd = openTagEnd(out, outerStart, ri, renderEnd);
    if (otEnd === -1) return { ok: false, reason: "open-tag" };
    const outer = scanElement(out, outerStart);
    if (!outer) return { ok: false, reason: "outer-shape" };
    const outerText = out.slice(outerStart, outer.end);
    const compName = outer.tag;
    if (compName !== om[1]) return { ok: false, reason: "mismatch" };
    const innerText = out.slice(ri + 8, inner.end);
    const innerTag = innerText.match(/^<([A-Za-z][A-Za-z0-9.]*)/)[1];
    let innerOpenEnd;
    if (inner.selfClose) innerOpenEnd = innerText.length - 2;
    else {
      let j = innerTag.length + 1, q = null, d = 0;
      innerOpenEnd = -1;
      while (j < innerText.length) {
        const c = innerText[j];
        if (q) { if (c === q) q = null; j++; continue; }
        if (c === '"' || c === "'") { q = c; j++; continue; }
        if (c === "{") { d++; j++; continue; }
        if (c === "}") { d--; j++; continue; }
        if (c === ">" && d === 0) { innerOpenEnd = j; break; }
        j++;
      }
      if (innerOpenEnd === -1) return { ok: false, reason: "inner-open" };
    }
    const innerAttrs = innerText.slice(innerTag.length + 1, innerOpenEnd).trimEnd();
    const innerKids = inner.selfClose ? "" : innerText.slice(innerOpenEnd + 1, innerText.lastIndexOf(`</${innerTag}>`));
    let openTag = out.slice(outerStart, otEnd);
    openTag = (openTag.slice(0, ri - outerStart).replace(/\s+$/, "") + openTag.slice(renderEnd - outerStart)).replace(/\s*nativeButton(?:=\{[^}]*\})?/, "");
    const asChildTag = openTag.replace(/\s*\/?>$/, " asChild>");
    let replacement;
    const attrs = innerAttrs ? ` ${innerAttrs}` : "";
    if (outer.selfClose && inner.selfClose) {
      replacement = `${asChildTag}<${innerTag}${attrs} /></${compName}>`;
    } else if (outer.selfClose && !inner.selfClose) {
      replacement = `${asChildTag}<${innerTag}${attrs}>${innerKids}</${innerTag}></${compName}>`;
    } else if (!outer.selfClose && inner.selfClose) {
      const kids = outerText.slice(otEnd - outerStart, outerText.lastIndexOf(`</${compName}>`));
      replacement = `${asChildTag}<${innerTag}${attrs}>${kids}</${innerTag}></${compName}>`;
    } else {
      return { ok: false, reason: "both-have-children" };
    }
    out = out.slice(0, outerStart) + replacement + out.slice(outer.end);
    count++;
    if (count > 200) return { ok: false, reason: "loop" };
  }
  return { ok: true, count, src: out };
}

// Merges a 2-file block (page + one sibling component) into a single source.
// Returns merged source, or null when the shape is not mechanical.
function mergeTwo(slug, files) {
  const base = (p) => (p.split("/").pop() ?? "").replace(/\.[^.]+$/, "");
  const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
  const [a, b] = files;
  const nameA = base(a.filename || a.path || "a");
  const nameB = base(b.filename || b.path || "b");
  const isPage = (p) => /(^|\/)page\.[^.]+$/.test(p);
  const pathA = a.filename || a.path || "", pathB = b.filename || b.path || "";
  const importsFile = (x, yBase) => {
    const re = new RegExp(`from\\s+["'][^"']*${yBase}[^"']*["']`);
    return re.test(stripComments(x.content));
  };
  let E = null, C = null;
  if (importsFile(a, nameB) && !importsFile(b, nameA)) { E = a; C = b; }
  else if (importsFile(b, nameA) && !importsFile(a, nameB)) { E = b; C = a; }
  else if (isPage(pathA) && !isPage(pathB)) { E = a; C = b; }
  else if (isPage(pathB) && !isPage(pathA)) { E = b; C = a; }
  else return null;
  const cBase = base(C.filename || C.path || "");
  // Find E's import of C (semicolon optional).
  const eLines = E.content.split("\n");
  let impStart = -1, impEnd = -1, clause = "", spec = "";
  for (let i = 0; i < eLines.length; i++) {
    if (/^\s*import\b/.test(eLines[i])) {
      let j = i, acc = [];
      while (j < eLines.length) {
        acc.push(eLines[j]);
        if (/;?\s*$/.test(eLines[j]) && /from\s+["'][^"']+["']/.test(acc.join("\n"))) break;
        j++;
        if (j - i > 12) break;
      }
      const stmt = acc.join("\n");
      const m = stmt.match(/import\s+([\s\S]+?)\s+from\s+["']([^"']+)["']/);
      if (m && m[2].includes(cBase)) {
        impStart = i; impEnd = j; clause = m[1].trim(); spec = m[2];
        break;
      }
      i = j;
    }
  }
  if (impStart === -1) return null;
  // E's import of C must be relative or same-slug registry path (resolvable by inlining).
  if (!/^\.|blocks\//.test(spec) && !spec.includes(slug)) return null;
  const kept = [];
  const cBody = C.content;
  if (/export\s+default(?!\s+function)/.test(cBody.replace(/export\s+default\s+function/g, ""))) return null;
  // Parse import statements (semicolon optional) from a source.
  const parseImports = (src) => {
    const out = [];
    const lines = src.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (!/^\s*import\b/.test(lines[i])) continue;
      let j = i;
      while (j < lines.length && !/from\s+["'][^"']+["']\s*;?\s*$/.test(lines.slice(i, j + 1).join("\n"))) {
        j++;
        if (j - i > 12) break;
      }
      const stmt = lines.slice(i, j + 1).join("\n");
      const m = stmt.match(/import\s+([\s\S]+?)\s+from\s+["']([^"']+)["']\s*;?\s*$/);
      if (!m) return null;
      out.push({ clause: m[1].trim(), spec: m[2], start: i, end: j });
      i = j;
    }
    return out;
  };
  const eImports = parseImports(E.content);
  const cImports = parseImports(cBody);
  if (!eImports || !cImports) return null;
  // Union imports by module.
  const byMod = new Map(); // spec -> {defs:[], nss:[], named:Map, types:[], side:bool}
  const addClause = (isType, clauseText, specText) => {
    let e = byMod.get(specText);
    if (!e) { e = { defs: [], nss: [], named: new Map(), types: [], side: false }; byMod.set(specText, e); }
    let rest = clauseText.trim();
    if (!rest) { e.side = true; return true; }
    if (isType) { e.types.push(rest); return true; }
    const ns = rest.match(/\*\s*as\s+([A-Za-z_$][\w$]*)/);
    if (ns) { e.nss.push(ns[1]); if (e.nss.length > 1) return false; rest = rest.replace(ns[0], "").replace(/^,|,$/g, "").trim(); }
    const df = rest.match(/^([A-Za-z_$][\w$]*)/);
    if (df && !rest.startsWith("{")) { e.defs.push(df[1]); if (e.defs.length > 1) return false; rest = rest.slice(df[1].length).replace(/^,/, "").trim(); }
    const nm = rest.match(/\{([\s\S]*)\}/);
    if (nm) for (const p of nm[1].split(",")) {
      const t = p.trim();
      if (!t) continue;
      const am = t.match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
      if (!am) return false;
      const local = am[2] ?? am[1];
      if (e.named.has(local) && e.named.get(local) !== t) return false;
      e.named.set(local, t);
    } else if (rest) return false;
    return true;
  };
  const feedImports = (list) => {
    for (const im of list) {
      const m = im.clause.match(/^\s*type\b/);
      const isType = !!m;
      const body = isType ? im.clause.replace(/^\s*type\b/, "") : im.clause;
      if (/^\s*$/.test(body)) {
        const e = byMod.get(im.spec) ?? { defs: [], nss: [], named: new Map(), types: [], side: true };
        byMod.set(im.spec, e);
        continue;
      }
      if (!addClause(isType, body, im.spec)) return false;
    }
    return true;
  };
  // E's imports minus the C import.
  const eRest = eImports.filter((im) => !(im.start === impStart && im.end === impEnd));
  if (eRest.length !== eImports.length - 1) return null;
  if (!feedImports(cImports) || !feedImports(eRest)) return null;
  const importText = [...byMod.entries()].map(([specText, e]) => {
    const parts = [];
    if (e.defs[0]) parts.push(e.defs[0]);
    if (e.nss[0]) parts.push(`* as ${e.nss[0]}`);
    if (e.named.size) parts.push(`{ ${[...e.named.values()].join(", ")} }`);
    const head = parts.join(", ");
    const lines = [];
    if (head) lines.push(`import ${head} from "${specText}";`);
    for (const t of e.types) lines.push(`import type ${t} from "${specText}";`);
    if (!head && !e.types.length) lines.push(`import "${specText}";`);
    return lines.join("\n");
  }).join("\n");
  // Strip C body: all its imports, use-client, exports.
  const cDrop = new Set();
  for (const im of cImports) for (let l = im.start; l <= im.end; l++) cDrop.add(l);
  const cNoImports = cBody.split("\n").filter((_, l) => !cDrop.has(l)).join("\n");
  let cRest = cNoImports
    .replace(/^["']use client["'];?\s*\n/, "")
    .replace(/export\s+default\s+function\b/g, "function")
    .replace(/^(\s*)export\s+(?=(?:async\s+)?function\b|class\b|const\b|let\b|var\b|type\b|interface\b|abstract\b)/gm, "$1");
  if (/export\s+default\b/.test(cRest)) return null;
  if (/^\s*export\s*\{[^}]*\}\s*;?\s*$/m.test(cRest)) cRest = cRest.replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/m, "");
  if (/^\s*export\b/m.test(cRest)) return null;
  // Strip E body: all its imports (incl. the C import) + use-client.
  const eDrop = new Set();
  for (const im of eImports) for (let l = im.start; l <= im.end; l++) eDrop.add(l);
  const eNoImports = E.content.split("\n").filter((_, l) => !eDrop.has(l)).join("\n");
  let eRest2 = eNoImports.replace(/^["']use client["'];?\s*\n/, "");
  const merged = `${importText}\n${cRest.trim()}\n${eRest2.trim()}\n`;
  // No unresolved relative/same-slug imports may remain.
  if (/(^|\n)\s*import[\s\S]*?from\s+["'](\.|[^"']*blocks\/)/.test(merged)) return null;
  return merged;
}

function edit(source, find, to, slug) {
  const out = typeof find === "string" ? source.split(find).join(to) : source.replace(find, to);
  if (out === source) throw new Error(`${slug}: pattern not found: ${find}`);
  return out;
}
function stripPropFromTag(out, slug, tag, prop) {
  let res = "", pos = 0, searchPos = 0;
  const open = `<${tag}`;
  for (;;) {
    const s = out.indexOf(open, searchPos);
    if (s === -1) break;
    const after = out[s + open.length];
    if (after !== " " && after !== "\n" && after !== "\t" && after !== ">") { searchPos = s + open.length; continue; }
    let j = s + open.length, q = null, d = 0, end = -1;
    while (j < out.length) {
      const c = out[j];
      if (q) { if (c === q) q = null; j++; continue; }
      if (c === '"' || c === "'") { q = c; j++; continue; }
      if (c === "{") { d++; j++; continue; }
      if (c === "}") { d--; j++; continue; }
      if (c === ">" && d === 0) { end = j; break; }
      j++;
    }
    if (end === -1) throw new Error(`${slug}: ${tag} open tag`);
    let tagText = out.slice(s, end);
    const pm = tagText.match(new RegExp(`\\s+${prop}=\\{`));
    if (pm && typeof pm.index === "number") {
      let k = s + pm.index + pm[0].length, q2 = null, d2 = 1;
      while (k < out.length && d2 > 0) {
        const c = out[k];
        if (q2) { if (c === q2) q2 = null; k++; continue; }
        if (c === '"' || c === "'") { q2 = c; k++; continue; }
        if (c === "{") d2++;
        if (c === "}") d2--;
        k++;
      }
      tagText = out.slice(s, s + pm.index) + out.slice(k, end);
    }
    res += out.slice(pos, s) + tagText;
    pos = end;
    searchPos = end;
  }
  return res + out.slice(pos);
}

// --- resolvability analysis ---
const tplExports = {};
for (const f of readdirSync("packages/foundation/src/templates")) {
  if (!f.endsWith(".tsx")) continue;
  const slug = f.replace(/\.tsx$/, "");
  const src = readFileSync(`packages/foundation/src/templates/${f}`, "utf8");
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:const|function|class|enum|type|interface)\s+([A-Za-z0-9_]+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s*\{([^}]+)\}/g)) for (const p of m[1].split(",")) {
    const n = p.trim().split(/\s+as\s+/).pop().trim().replace(/^type\s+/, "");
    if (n) names.add(n);
  }
  tplExports[slug] = names;
}
const hasTpl = (s) => !!tplExports[s];
// Installed bare packages usable from foundation blocks.
const NPM = new Set(["react", "react-dom", "lucide-react", "motion", "sonner", "recharts",
  "@tabler/icons-react", "@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities",
  "@tanstack/react-table", "cmdk", "zod", "class-variance-authority", "clsx", "tailwind-merge"]);
const uiPat = /^@\/components\/ui\/([a-z0-9-]+)$/;
const veloraPat = /^@\/components\/velora\/([a-z0-9-]+)$/;

function analyze(src, slug) {
  if (/\bindeterminate=\{/.test(src)) return { bad: ["checkbox-indeterminate"] };
  if (/<Card\s+size="sm"/.test(src)) return { bad: ["card-size-sm"] };
  if (/<DialogFooter\s+showCloseButton/.test(src)) return { bad: ["dialogfooter-close-button"] };
  if (/\balignItemWithTrigger/.test(src)) return { bad: ["select-alignItemWithTrigger"] };
  if (/useTable|tableFeatures|rowSortingFeature|rowPaginationFeature|columnVisibilityFeature|sortFn_datetime|createSortedRowModel|createPaginatedRowModel/.test(src)) return { bad: ["tanstack-v9"] };
  const composition = new Set(), npm = new Set();
  let usesUtils = false, usesIcon = false, needsClient = !/^"use client";/m.test(src);
  const bad = [];
  const re = /import\s+(?:type\s+)?([^;]*?)\s+from\s+["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(src))) {
    const clause = m[1].trim(), spec = m[2];
    const isType = /^\s*type\b/.test(m[0].slice(6));
    const names = [];
    const bm = clause.match(/^\{([^}]*)\}$/);
    if (bm) for (const p of bm[1].split(",")) { const t = p.trim(); if (t) names.push({ n: t.split(/\s+as\s+/).pop().trim(), typeOnly: isType || /^\s*type\b/.test(t) }); }
    const need = (lookup) => { if (!isType) for (const { n, typeOnly } of names) { if (typeOnly) continue; if (!lookup.has(n)) bad.push(`${spec}::{${n}}`); } };
    if (spec === "cn" || spec === "@/lib/utils" || spec.endsWith("/lib/utils")) usesUtils = true;
    else if (spec.startsWith("next/")) bad.push("next/*");
    else if (spec === "@/components/ui/sonner") {
      if (!/Toaster/.test(clause)) bad.push(spec);
      else npm.add("sonner");
    }
    else if (spec === "@/components/icons/icon-placeholder") usesIcon = true;
    else if (uiPat.test(spec)) { const u = spec.match(uiPat)[1]; if (!hasTpl(u)) bad.push("no-template:" + u); else { composition.add(u); need(tplExports[u]); } }
    else if (veloraPat.test(spec)) { const u = spec.match(veloraPat)[1]; if (!hasTpl(u)) bad.push("no-velora-template:" + u); else { composition.add(u); need(tplExports[u]); } }
    else if (spec.startsWith("@/registry/")) {
      const mm2 = spec.match(/\/ui\/([a-z0-9-]+)$/);
      if (mm2 && hasTpl(mm2[1])) { composition.add(mm2[1]); need(tplExports[mm2[1]]); }
      else bad.push("registry:" + spec);
    }
    else if (NPM.has(spec)) { if (!["react", "react-dom", "lucide-react", "class-variance-authority", "clsx", "tailwind-merge"].includes(spec)) npm.add(spec); }
    else if (spec.startsWith("@/")) bad.push("external:" + spec);
    else if (spec.startsWith(".")) bad.push("rel:" + spec);
    else if (spec.startsWith("@")) bad.push("vendor:" + spec);
    else if (spec.startsWith("https://")) bad.push(spec);
    else bad.push("npm:" + spec);
  }
  return { bad: [...new Set(bad)], composition: [...composition], npm: [...npm], usesUtils, usesIcon };
}

const HEX_RE = /#(?:[0-9a-fA-F]{3,8})\b/;
const RAW_COLOR_FN_RE = /\b(?:rgb|rgba|hsl|hsla|lab|lch|oklab|oklch|color-mix)\s*\(/g;

function needsColorMapping(src) {
  for (const line of src.split("\n")) {
    if (HEX_RE.test(line)) return true;
    RAW_COLOR_FN_RE.lastIndex = 0;
    let m;
    while ((m = RAW_COLOR_FN_RE.exec(line))) {
      let d = 0, j = m.index + m[0].length - 1, q = null;
      for (; j < line.length; j++) {
        const c = line[j];
        if (q) { if (c === q) q = null; continue; }
        if (c === '"' || c === "'") { q = c; continue; }
        if (c === "(") d++;
        else if (c === ")") { if (d === 0) break; d--; }
      }
      // Token-only args (var(--x)) need no mapping.
      const inner = line.slice(m.index + m[0].length, j).replace(/var\([^()]*\)/g, "");
      if (/#[0-9a-fA-F]/.test(inner)) return true;
      if (/\b(?:black|white|red|blue|green|yellow|orange|purple|pink|gray|grey|slate|teal|cyan|indigo|violet|fuchsia|lime|emerald|sky|amber|stone|zinc|neutral)\b/i.test(inner)) return true;
    }
  }
  return false;
}

function transform(slug, src, meta) {
  let out = src.replace(/\r\n/g, "\n");
  out = out
    .replace(/from\s+["']@\/components\/ui\/sonner["']/g, 'from "sonner"')
    .replace(/from\s+["']@\/components\/ui\/([a-z0-9-]+)["']/g, 'from "../templates/$1.js"')
    .replace(/from\s+["']@\/components\/velora\/([a-z0-9-]+)["']/g, 'from "../templates/$1.js"')
    .replace(/from\s+["']@\/registry\/[^"']*\/ui\/([a-z0-9-]+)["']/g, 'from "../templates/$1.js"')
    .replace(/from\s+["'](?:@\/lib\/utils|cn|[^"']*\/lib\/utils)["']/g, 'from "../templates/lib/utils.js"')
    .replace(/from\s+["']@\/components\/icons\/icon-placeholder["']/g, 'from "./shared/icon-placeholder.js"');
  out = out.replace(/render\s*=\s*\{/g, "render={").replace(/render=\{\s+</g, "render={<");
  out = out.replace(/<TooltipProvider((?:\s[^<>]*?)?)>/g, (m, attrs) => `<TooltipProvider${attrs.replace(/\bdelay=\{/g, "delayDuration={")}>`);
  out = stripPropFromTag(out, slug, "Select", "items");
  if (/<Select(?=[\s>])[^<>]*?\bitems=\{/.test(out)) throw new Error(`${slug}: select-items remains`);
  let accPos = 0;
  for (;;) {
    const am = out.slice(accPos).match(/<Accordion(?=[\s>])/);
    if (!am || typeof am.index !== "number") break;
    const aStart = accPos + am.index;
    const aEnd = openTagEnd(out, aStart, -1, -1);
    if (aEnd === -1) throw new Error(`${slug}: accordion open tag`);
    const attrs = out.slice(aStart + 10, aEnd - 1);
    accPos = aEnd;
    if (/\btype=/.test(attrs) || !/\b(?:defaultValue|value)=\{[^}]*\[/.test(attrs)) continue;
    out = `${out.slice(0, aEnd - 1)} type="multiple"${out.slice(aEnd - 1)}`;
    accPos = aEnd + 17;
  }
  const conv = convertRenderProp(out);
  if (!conv.ok) throw new Error(`${slug}: render-prop shape: ${conv.reason}`);
  out = conv.src;
  for (const [find, to] of BLOCK_PATCHES[slug] ?? []) out = edit(out, find, to, slug);
  for (const [find, to] of GLOBAL) out = out.replace(find, to);
  if (!/^"use client";/m.test(out)) out = `"use client";\n\n${out}`;
  return out;
}

const curated = new Set<string>(); // catalog is aggregator-only; no curated legacy blocks

const results = new Map();
const skipped = [];
for (const [group, arr] of Object.entries(catalog.sections.Blocks)) {
  const category = group.startsWith("Marketing") ? "marketing" : "application";
  for (const item of arr) {
    const reg = item.registry;
    const slug = reg.name;
    if (curated.has(slug)) { skipped.push([slug, "curated-collision"]); continue; }
    const files = reg.files || [];
    let raw = "";
    if (files.length === 2) {
      const merged = mergeTwo(slug, files);
      if (!merged) { skipped.push([slug, "multi-file"]); continue; }
      raw = merged;
    } else if (files.length === 1 && files[0].content) {
      raw = files[0].content;
    } else { skipped.push([slug, files.length > 1 ? "multi-file" : "no-content"]); continue; }
    const meta = analyze(raw);
    if (meta.bad.length) { skipped.push([slug, meta.bad.slice(0, 3).join(" | ")]); continue; }
    let body = transform(slug, raw, meta);
    if (needsColorMapping(body)) { skipped.push([slug, "needs-color-mapping"]); continue; }
    writeFileSync(join(BLOCKS, `${slug}.tsx`), body);
    const tokensUsed = collectTokens(body);
    const manifest = {
      name: slug,
      title: reg.title || item.name || slug,
      description: reg.description || "",
      category,
      manifestVersion: 1,
      block: true,
      slots: [],
      axes: {},
      styleSurface: {},
      tokensUsed,
      dependencies: meta.npm,
      registryDependencies: [...(meta.usesUtils ? ["utils"] : []), ...meta.composition],
      files: [{ name: slug, source: `src/blocks/${slug}.tsx`, target: `components/blocks/${slug}.tsx`, type: "registry:block" }, ...(meta.usesIcon ? [{ name: "shared/icon-placeholder", source: "src/blocks/shared/icon-placeholder.tsx", target: "components/blocks/shared/icon-placeholder.tsx", type: "registry:lib" }] : [])],
      composition: { contentSlots: [], childComponents: meta.composition.map((c) => ({ name: c })) },
    };
    writeFileSync(join(BLOCKS, `${slug}.block.json`), `${JSON.stringify(manifest, null, 2)}\n`);
    results.set(slug, category);
  }
}

const byReason = {};
for (const [slug, r] of skipped) {
  byReason[r] = byReason[r] || [];
  byReason[r].push(slug);
}
if (process.env.LIST_SKIPS) for (const [r, slugs] of Object.entries(byReason)) console.log(`${r}: ${slugs.join(", ")}`);
console.log(`Imported ${results.size}.`);
console.log(`Skipped ${skipped.length}: ${Object.entries(byReason).map(([k, v]) => `${k} (${v.length})`).join("; ")}`);
