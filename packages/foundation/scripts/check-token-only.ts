/**
 * check-token-only: Rule 2 of the Arche spec — templates may reference
 * semantic tokens only. Raw hex colors and raw color functions in template
 * files are defects. Arbitrary pixel values are defects except the whitelisted
 * `0` values. Border widths must come from the --border-width token
 * (border-(length:--border-width)); no hardcoded border width is allowed.
 */
import { readdirSync, readFileSync } from "node:fs";
import { delimiter, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const FOUNDATION_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// Test hook (Part 6 negative tests): ARCHE_CHECK_DIRS overrides the scanned
// roots as a path-delimiter-separated list. Unset in normal builds.
const TEMPLATE_DIRS = process.env.ARCHE_CHECK_DIRS
  ? process.env.ARCHE_CHECK_DIRS.split(delimiter)
  : [join(FOUNDATION_ROOT, "src", "templates"), join(FOUNDATION_ROOT, "src", "blocks")];

const HEX_RE = /#(?:[0-9a-fA-F]{3,8})\b/;
const RAW_COLOR_FN_RE = /\b(?:rgb|rgba|hsl|hsla|lab|lch|oklab|oklch|color-mix)\s*\(/;
const PX_RE = /(-?\d*\.?\d+)px/g;

interface Defect {
  file: string;
  line: number;
  text: string;
  reason: string;
}

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (/\.(tsx?|css)$/.test(entry.name)) {
      yield full;
    }
  }
}

// Strip var(...) and Tailwind v4 shorthand (--token,...) spans (balanced
// parens). Fallback literals inside them are token defaults emitted by the
// registry, not hard-coded values; color-mix() over var(--token)
// references only semantic tokens.
function stripVars(line: string): string {
  let out = "";
  let i = 0;
  for (;;) {
    const varAt = line.indexOf("var(", i);
    const shortAt = line.indexOf("(--", i);
    const at = varAt === -1 ? shortAt : shortAt === -1 ? varAt : Math.min(varAt, shortAt);
    if (at === -1) return out + line.slice(i);
    out += line.slice(i, at);
    const openLen = line.startsWith("var(", at) ? 4 : 1;
    let depth = 0;
    let j = at + openLen;
    for (; j < line.length; j++) {
      if (line[j] === "(") depth++;
      else if (line[j] === ")") {
        if (depth === 0) break;
        depth--;
      }
    }
    out += "var()";
    i = j + 1;
  }
}

function colorArgsOf(line: string, from: number): string {
  let depth = 0;
  let j = from;
  for (; j < line.length; j++) {
    if (line[j] === "(") depth++;
    else if (line[j] === ")") {
      depth--;
      if (depth === 0) return line.slice(from, j + 1);
    }
  }
  return line.slice(from);
}

const RAW_NESTED_FN_RE = /\b(?:rgb|rgba|hsl|hsla|lab|lch|oklab|oklch)\s*\(/;
const RAW_COLOR_FN_GLOBAL_RE = new RegExp(RAW_COLOR_FN_RE.source, "g");

const defects: Defect[] = [];
let checked = 0;

for (const dir of TEMPLATE_DIRS) {
for (const file of walk(dir)) {
  checked++;
  const relativePath = relative(FOUNDATION_ROOT, file);
  const source = readFileSync(file, "utf8");
  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (HEX_RE.test(line)) {
      defects.push({ file: relativePath, line: lineNumber, text: line.trim(), reason: "raw hex color" });
    }
    const stripped = stripVars(line);
    for (const match of stripped.matchAll(RAW_COLOR_FN_GLOBAL_RE)) {
      const args = colorArgsOf(stripped, (match.index ?? 0) + match[0].length - 1);
      if (HEX_RE.test(args) || RAW_NESTED_FN_RE.test(args)) {
        defects.push({ file: relativePath, line: lineNumber, text: line.trim(), reason: "raw color function where a token class is required" });
      }
    }
    for (const match of stripped.matchAll(PX_RE)) {
      const value = match[1];
      if (value === "0" || value === "0.0") {
        continue; // whitelisted: zero values only (border widths use --border-width)
      }
      defects.push({
        file: relativePath,
        line: lineNumber,
        text: line.trim(),
        reason: `raw pixel value '${value}px' (use a token)`,
      });
      break;
    }
}
);
}
}

for (const defect of defects) {
  console.error(
    `${defect.file}:${defect.line}: ${defect.reason} — ${defect.text}`,
  );
}

if (defects.length > 0) {
  console.error(
    `check-token-only: FAILED — ${defects.length} defect${defects.length === 1 ? "" : "s"} in ${checked} template file(s). Use contract tokens instead of hard-coded values.`,
  );
  process.exit(1);
} else {
  console.log(`check-token-only: passed (${checked} template file${checked === 1 ? "" : "s"} scanned)`);
}
