/**
 * check-token-only: Rule 2 of the Arche spec — templates may reference
 * semantic tokens only. Raw hex colors and raw color functions in template
 * files are defects. Arbitrary pixel values are defects except the whitelisted
 * `1px` border widths and `0` values.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const FOUNDATION_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATES_DIR = join(FOUNDATION_ROOT, "src", "templates");

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

const defects: Defect[] = [];
let checked = 0;

for (const file of walk(TEMPLATES_DIR)) {
  checked++;
  const relativePath = relative(FOUNDATION_ROOT, file);
  const source = readFileSync(file, "utf8");
  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (HEX_RE.test(line)) {
      defects.push({ file: relativePath, line: lineNumber, text: line.trim(), reason: "raw hex color" });
    }
    if (RAW_COLOR_FN_RE.test(line)) {
      defects.push({ file: relativePath, line: lineNumber, text: line.trim(), reason: "raw color function where a token class is required" });
    }
    for (const match of line.matchAll(PX_RE)) {
      const value = match[1];
      if (value === "0" || value === "0.0" || value === "1") {
        continue; // whitelisted: zero values and 1px border widths
      }
      defects.push({
        file: relativePath,
        line: lineNumber,
        text: line.trim(),
        reason: `raw pixel value '${value}px' (use a token)`,
      });
      break;
    }
  });
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
