import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * `arche check` (Brief #4 §8): deterministic, statically checkable subset of
 * the manifests' standards, run over consumer project source. Rules are read
 * from each manifest's standards section and keyed by permanent rule id;
 * the two shipped rule classes the manifests don't cover (token discipline,
 * icon-button naming) use stable `arche/`-prefixed ids — see the spec
 * conflict note in the Brief #4 final report.
 */

export interface CheckRule {
  id: string;
  source: "manifest" | "cli";
  manifest?: string;
  message: string;
}

export interface CheckFinding {
  file: string;
  line: number;
  rule: string;
  message: string;
}

interface LoadedManifest {
  name: string;
  ruleIds: Set<string>;
}

function loadManifests(dataDir: string): LoadedManifest[] {
  const path = join(dataDir, "manifests.json");
  if (!existsSync(path)) {
    return [];
  }
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Array<{
      name?: unknown;
      standards?: { rules?: Array<{ id?: unknown }> };
    }>;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((m) => ({
      name: typeof m.name === "string" ? m.name : "unknown",
      ruleIds: new Set(
        (m.standards?.rules ?? []).map((r) => String(r.id)).filter((id) => id.length > 0),
      ),
    }));
  } catch {
    return [];
  }
}

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mdx"]);
const SKIPPED_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "out",
  ".turbo",
  "coverage",
  ".git",
]);

function collectFiles(root: string): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry === "components.json" || entry === "package.json") {
        continue;
      }
      const full = join(dir, entry);
      let stat: ReturnType<typeof statSync>;
      try {
        stat = statSync(full);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        if (!SKIPPED_DIRS.has(entry)) {
          walk(full);
        }
      } else if ([...SOURCE_EXTENSIONS].some((ext) => entry.endsWith(ext))) {
        found.push(full);
      }
    }
  };
  walk(root);
  return found.sort();
}

const HEX_LITERAL = /#[0-9a-fA-F]{3,8}\b/g;
const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const PALETTE_UTILITY = new RegExp(
  String.raw`\b(?:bg|text|border|ring|from|via|to|fill|stroke|accent|caret|divide|outline|decoration|placeholder)-(?:${PALETTE})-(?:50|100|200|300|400|500|600|700|800|900|950)(?:\/\d+)?\b`,
  "g",
);
const MONO_UTILITY = /\b(?:bg|text|border|ring|fill|stroke)-(?:black|white)(?:\/\d+)?\b/g;

function checkLineTokens(
  file: string,
  lineNumber: number,
  line: string,
  findings: CheckFinding[],
): void {
  HEX_LITERAL.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = HEX_LITERAL.exec(line)) !== null) {
    findings.push({
      file,
      line: lineNumber,
      rule: "arche/token-discipline",
      message: `hardcoded color \`${match[0]}\` — use a contract token instead`,
    });
  }
  for (const pattern of [PALETTE_UTILITY, MONO_UTILITY]) {
    pattern.lastIndex = 0;
    let utility: RegExpExecArray | null;
    while ((utility = pattern.exec(line)) !== null) {
      findings.push({
        file,
        line: lineNumber,
        rule: "arche/token-discipline",
        message: `raw palette utility \`${utility[0]}\` — use a contract token instead`,
      });
    }
  }
}

const BUTTON_OPEN = /<Button\b([^>]*?)(\/?)>/g;
const HAS_ACCESSIBLE_NAME = /\b(?:aria-label|aria-labelledby|title)=/;

function checkButtonBlock(
  file: string,
  startLine: number,
  openingAttrs: string,
  selfClosing: boolean,
  innerLines: string[],
  findings: CheckFinding[],
): void {
  if (selfClosing) {
    if (!HAS_ACCESSIBLE_NAME.test(openingAttrs)) {
      findings.push({
        file,
        line: startLine,
        rule: "arche/icon-button-label",
        message: "icon-only Button has no accessible name — add aria-label",
      });
    }
    return;
  }
  const innerText = innerLines
    .join("\n")
    .replace(/\{[^}]*\}/g, "")
    .replace(/<[^>]*>/g, "")
    .trim();
  if (innerText.length === 0 && !HAS_ACCESSIBLE_NAME.test(openingAttrs)) {
    findings.push({
      file,
      line: startLine,
      rule: "arche/icon-button-label",
      message: "icon-only Button has no accessible name — add aria-label",
    });
  }
}

function checkDialogTitles(file: string, lines: string[], findings: CheckFinding[]): void {
  const pairs: Array<{ content: RegExp; title: RegExp; rule: string; label: string }> = [
    {
      content: /<DialogContent\b/,
      title: /<DialogTitle\b/,
      rule: "dialog-requires-title",
      label: "Dialog content has no Title",
    },
    {
      content: /<AlertDialogContent\b/,
      title: /<AlertDialogTitle\b/,
      rule: "alert-dialog-title-and-description",
      label: "AlertDialog content has no Title",
    },
  ];
  const text = lines.join("\n");
  for (const pair of pairs) {
    if (!pair.content.test(text) || pair.title.test(text)) {
      continue;
    }
    const lineNumber = lines.findIndex((line) => pair.content.test(line)) + 1;
    findings.push({
      file,
      line: lineNumber,
      rule: pair.rule,
      message: `${pair.label} — Dialog content requires a Title`,
    });
  }
}

export interface CheckResult {
  findings: CheckFinding[];
  filesScanned: number;
  rules: CheckRule[];
}

export function runCheck(root: string, dataDir: string): CheckResult {
  const manifests = loadManifests(dataDir);
  const rules: CheckRule[] = [
    {
      id: "arche/token-discipline",
      source: "cli",
      message: "no hardcoded colors or raw palette utilities in consumer source",
    },
    {
      id: "arche/icon-button-label",
      source: "cli",
      message: "icon-only Buttons carry an accessible name",
    },
  ];
  for (const manifest of manifests) {
    if (manifest.ruleIds.has("dialog-requires-title")) {
      rules.push({
        id: "dialog-requires-title",
        source: "manifest",
        manifest: manifest.name,
        message: "Dialog content requires a Title",
      });
    }
    if (manifest.ruleIds.has("alert-dialog-title-and-description")) {
      rules.push({
        id: "alert-dialog-title-and-description",
        source: "manifest",
        manifest: manifest.name,
        message: "AlertDialog content requires a Title",
      });
    }
  }
  const findings: CheckFinding[] = [];
  const files = collectFiles(root);
  for (const file of files) {
    const display = relative(root, file);
    const content = readFileSync(file, "utf8");
    const lines = content.split("\n");
    lines.forEach((line, index) => {
      checkLineTokens(display, index + 1, line, findings);
    });
    // Multi-line aware Button scan.
    const fullMatches = [...content.matchAll(BUTTON_OPEN)];
    for (const match of fullMatches) {
      const openStart = content.slice(0, match.index).split("\n").length;
      const selfClosing = match[2] === "/";
      if (selfClosing) {
        checkButtonBlock(display, openStart, match[1] ?? "", true, [], findings);
        continue;
      }
      const rest = content.slice(match.index + match[0].length);
      const closeIndex = rest.search(/<\/Button\s*>/);
      const inner = closeIndex === -1 ? "" : rest.slice(0, closeIndex);
      checkButtonBlock(display, openStart, match[1] ?? "", false, inner.split("\n"), findings);
    }
    checkDialogTitles(display, lines, findings);
  }
  return { findings, filesScanned: files.length, rules };
}
