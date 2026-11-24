import {
  buildTeachBlock,
  describeConstraints,
  designRulesVersion,
  fontChoiceBlock,
  modelDeltaOutputSchema,
  modelOutputSchema,
  type CorpusEntry,
  type DnaDelta,
  type DnaObject,
  type DnaPalette,
  type ModelOutput,
  type PromptConstraints,
} from "@arche/registry-core";
import { GENERATION_PROMPT_MAX_LENGTH } from "@/lib/hero-prompt";

/**
 * Provider layer (Brief #6 §6, FR-GEN-4). All LLM access goes through
 * `generateDna` / `generateDnaDelta`. Provider and model come from server
 * environment only (LLM_PROVIDER, LLM_MODEL, LLM_API_KEY) — no
 * provider-specific types leak into payloads, the compiler, or MCP.
 */

export interface DnaCallResult {
  output: Pick<ModelOutput, "axes" | "palette" | "palettes" | "typefaces" | "composition" | "imagery">;
  model: string;
  tokensIn: number | null;
  tokensOut: number | null;
}

export interface DeltaCallResult {
  delta: DnaDelta;
  model: string;
  tokensIn: number | null;
  tokensOut: number | null;
}

export type { DnaObject, DnaPalette };



function providerName(): string {
  return process.env.LLM_PROVIDER ?? "google";
}

function modelName(): string {
  const model = process.env.LLM_MODEL ?? "";
  if (!model) {
    throw new Error(
      "LLM_MODEL is not configured — set it to a JSON-capable chat model (e.g. openai/gpt-oss-120b on Groq).",
    );
  }
  return model;
}

function apiKey(): string {
  const key = process.env.LLM_API_KEY ?? "";
  if (!key) {
    throw new Error("LLM_API_KEY is not configured — generation needs a server-side provider key.");
  }
  return key;
}

/**
 * Startup/config-time capability check (§6): text-only generation needs a
 * JSON-capable chat model. The table is explicit so a typo fails plainly
 * instead of half-working. Text door only — no image input.
 */
export function assertModelCapable(): string {
  const provider = providerName();
  const model = modelName();
  const capable: Record<string, RegExp[]> = {
    google: [/^gemini-/, /^gemma-/],
    groq: [/^openai\/gpt-oss/, /^qwen\//, /^llama/, /^meta-llama/, /^mistral/, /^mixtral/, /^gemma/],
  };
  const patterns = capable[provider];
  if (!patterns) {
    throw new Error(
      `LLM_PROVIDER '${provider}' is not wired — supported providers: ${Object.keys(capable).join(", ")}.`,
    );
  }
  if (!patterns.some((re) => re.test(model))) {
    throw new Error(
      `LLM_MODEL '${model}' is not a known JSON-capable model for provider '${provider}' — generation refuses to run half-capable.`,
    );
  }
  return model;
}

// ---------------------------------------------------------------------------
// Response schema: a flattened mirror of modelOutputSchema (Gemini's
// responseJsonSchema does not enforce the allOf that z.toJSONSchema emits
// for the .and() composition — verified live: the model ignored property
// names under allOf and returned its own axis names).
// ---------------------------------------------------------------------------

const DNA_AXES_JSON_SCHEMA = {
  type: "object",
  properties: {
    warmth: { type: "number", minimum: 0, maximum: 1 },
    chroma: { type: "number", minimum: 0, maximum: 1 },
    energy: { type: "number", minimum: 0, maximum: 1 },
    playfulness: { type: "number", minimum: 0, maximum: 1 },
    sharpness: { type: "number", minimum: 0, maximum: 1 },
    density: { type: "number", minimum: 0, maximum: 1 },
    ornament: { type: "number", minimum: 0, maximum: 1 },
    formality: { type: "number", minimum: 0, maximum: 1 },
    material: { type: "string", enum: ["flat", "paper", "glass", "metal", "marble", "pixel", "clay"] },
    motionFeel: { type: "string", enum: ["snappy", "smooth", "bouncy", "stately", "glitchy"] },
    texture: { type: "string", enum: ["none", "grain", "scanlines", "grid", "marble-vein", "halftone"] },
    minContrast: { type: "string", enum: ["AA"] },
    respectReducedMotion: { type: "boolean" },
  },
  required: [
    "warmth", "chroma", "energy", "playfulness", "sharpness", "density",
    "ornament", "formality",
    "material", "motionFeel", "texture", "minContrast", "respectReducedMotion",
  ],
  additionalProperties: false,
} as const;

const DNA_PALETTE_JSON_SCHEMA = {
  type: "object",
  properties: {
    primaryHue: { type: "number", minimum: 0, maximum: 360 },
    accentHue: { type: "number", minimum: 0, maximum: 360 },
    neutralHue: { type: "number", minimum: 0, maximum: 360 },
    brandHue: { type: "number", minimum: 0, maximum: 360 },
  },
  required: ["primaryHue", "accentHue", "neutralHue", "brandHue"],
  additionalProperties: false,
} as const;

const DNA_PALETTE_VARIANT_JSON_SCHEMA = {
  type: "object",
  properties: {
    id: { type: "string", minLength: 1, maxLength: 40 },
    name: { type: "string", minLength: 1, maxLength: 60 },
    anchors: DNA_PALETTE_JSON_SCHEMA,
    reason: { type: "string", minLength: 1, maxLength: 200 },
  },
  required: ["id", "name", "anchors", "reason"],
  additionalProperties: false,
} as const;

const DNA_TYPEFACE_VARIANT_JSON_SCHEMA = {
  type: "object",
  properties: {
    id: { type: "string", minLength: 1, maxLength: 40 },
    name: { type: "string", minLength: 1, maxLength: 60 },
    display: { type: "string", minLength: 1, maxLength: 60 },
    body: { type: "string", minLength: 1, maxLength: 60 },
    reason: { type: "string", minLength: 1, maxLength: 200 },
  },
  required: ["id", "name", "display", "body", "reason"],
  additionalProperties: false,
} as const;

const DNA_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    axes: DNA_AXES_JSON_SCHEMA,
    palette: DNA_PALETTE_JSON_SCHEMA,
    palettes: { type: "array", items: DNA_PALETTE_VARIANT_JSON_SCHEMA, minItems: 3, maxItems: 3 },
    typefaces: { type: "array", items: DNA_TYPEFACE_VARIANT_JSON_SCHEMA, minItems: 3, maxItems: 3 },
  },
  required: ["axes", "palette", "palettes", "typefaces"],
  additionalProperties: false,
} as const;

// Delta schema: DNA-only diff — every delta field optional, ONLY implicated
// fields present. Strict: no plan, no self-check, no profile.
const DELTA_AXES_JSON_SCHEMA = {
  type: "object",
  properties: {
    warmth: { type: "number", minimum: 0, maximum: 1 },
    chroma: { type: "number", minimum: 0, maximum: 1 },
    energy: { type: "number", minimum: 0, maximum: 1 },
    playfulness: { type: "number", minimum: 0, maximum: 1 },
    sharpness: { type: "number", minimum: 0, maximum: 1 },
    density: { type: "number", minimum: 0, maximum: 1 },
    ornament: { type: "number", minimum: 0, maximum: 1 },
    formality: { type: "number", minimum: 0, maximum: 1 },
    material: { type: "string", enum: ["flat", "paper", "glass", "metal", "marble", "pixel", "clay"] },
    motionFeel: { type: "string", enum: ["snappy", "smooth", "bouncy", "stately", "glitchy"] },
    texture: { type: "string", enum: ["none", "grain", "scanlines", "grid", "marble-vein", "halftone"] },
  },
  additionalProperties: false,
} as const;

const DELTA_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    delta: {
      type: "object",
      properties: {
        axes: DELTA_AXES_JSON_SCHEMA,
        palette: {
          type: "object",
          properties: {
            primaryHue: { type: "number", minimum: 0, maximum: 360 },
            accentHue: { type: "number", minimum: 0, maximum: 360 },
            neutralHue: { type: "number", minimum: 0, maximum: 360 },
            brandHue: { type: "number", minimum: 0, maximum: 360 },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
  },
  required: ["delta"],
  additionalProperties: false,
} as const;

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

async function callGeminiJson(args: {
  system: string;
  userParts: GeminiPart[];
  schema: unknown;
  feedback?: string;
}): Promise<{ text: string; tokensIn: number | null; tokensOut: number | null; model: string }> {
  const model = assertModelCapable();
  const parts: GeminiPart[] = [...args.userParts];
  if (args.feedback) {
    parts.push({
      text: `Your previous reply was rejected by the schema validator with these errors — fix them and reply with valid JSON only:\n${args.feedback}`,
    });
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey() },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: args.system }] },
        contents: [{ parts }],
        generationConfig: { responseMimeType: "application/json", responseJsonSchema: args.schema },
      }),
    },
  );
  const json = (await res.json()) as GeminiResponse & { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(`provider error (HTTP ${res.status}): ${json.error?.message ?? "unknown"}`);
  }
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) {
    throw new Error("provider returned no content");
  }
  return {
    text,
    tokensIn: json.usageMetadata?.promptTokenCount ?? null,
    tokensOut: json.usageMetadata?.candidatesTokenCount ?? null,
    model,
  };
}

/**
 * Static output-shape instructions shared by both doors. The taught rulebook
 * (buildTeachBlock, generated from design-rules.json) is prepended at call
 * time — one static block per rules version, placed so providers can cache it.
 */
const AXES_SHAPE = [
  '{"warmth":0.5,"chroma":0.5,"energy":0.5,"playfulness":0.5,"sharpness":0.5,"density":0.5,"ornament":0.5,',
  '"formality":0.5,"material":<flat|paper|glass|metal|marble|pixel|clay>,',
  '"motionFeel":<snappy|smooth|bouncy|stately|glitchy>,"texture":<none|grain|scanlines|grid|marble-vein|halftone>,',
  '"minContrast":"AA","respectReducedMotion":true}',
].join("");

const SHAPE_PREAMBLE = [
  "You respond with ONE JSON object, no prose, no markdown — DNA plus picker variants — with exactly these keys:",
  '{"axes": {...8 scores + 3 enums + 2 fixed guardrails...}, "palette": {"primaryHue", "accentHue", "neutralHue"},',
  '"palettes": [exactly 3 palette variants], "typefaces": [exactly 3 typography variants]}.',
  "No other keys. A response containing plan, selfCheck, or profile fails validation.",
].join(" ");

const VALUE_RULES = [
  "Value rules: every axis is a number 0-1.",
  "material is EXACTLY one of: flat, paper, glass, metal, marble, pixel, clay (lowercase, no other value).",
  "motionFeel is EXACTLY one of: snappy, smooth, bouncy, stately, glitchy.",
  "texture is EXACTLY one of: none, grain, scanlines, grid, marble-vein, halftone.",
  'minContrast is ALWAYS the string "AA", respectReducedMotion is ALWAYS true.',
  "Each palette hue is a NUMBER in degrees 0-360 (never a string, never hex).",
  "The <...> placeholders above show field names and value types ONLY — never emit them.",
  "Derive every axis, hue, and enum from the phrase itself; repeating placeholder values is a generic default and fails your self-check.",
  "Spread the three hues apart only when the phrase explicitly asks for contrast, energy, or multiple color families.",
  "Never emit the <...> placeholders.",
].join(" ");

function exemplarBlock(exemplars: CorpusEntry[]): string {
  if (exemplars.length === 0) return "";
  const lines = exemplars.map(
    (e) =>
      `Brief: ${e.prompt}\nDNA: ${JSON.stringify({ axes: e.axes, palette: e.palette })}`,
  );
  return [
    "Grounding examples (prompt → DNA v2 pairs from the registry corpus — same schema you must emit):",
    ...lines,
    "Learn the mapping from words to numbers from these pairs; do not copy any single pair verbatim.",
  ].join("\n");
}

function constraintHint(constraints?: PromptConstraints): string {
  if (!constraints || Object.keys(constraints).length === 0) return "";
  return [
    `Parsed brief (deterministic, enforced in code after you reply — conflicts resolve in favor of these numbers): ${describeConstraints(constraints)}.`,
    "Honor these numbers in your DNA; the compiler will clamp anything that disagrees and log the adjustment.",
  ].join(" ");
}

function variantRules(): string {
  return [
    "Palette variants (\"palettes\"): EXACTLY 3 distinct hue directions from the same phrase — the first is the generation's own anchors, the other two are alternates (a bolder and a quieter reading).",
    "Each variant is {\"id\": <short unique slug>, \"name\": <evocative name, never a bare hex>, \"anchors\": {\"primaryHue\", \"accentHue\", \"neutralHue\", \"brandHue\"}, \"reason\": <one sentence>}.",
    "Each variant's anchors ALSO carry \"brandHue\" (the same brand hue when the phrase names one brand; otherwise the variant's primaryHue). A monochrome brief means all four anchors near-equal.",
    "Brand rule: brandHue is the recognizable brand color from the phrase ('bold red', 'T-Mobile magenta') — NEVER the button color. No brand color named: brandHue = primaryHue. A loud/light brand color named (bright red, vivid yellow): keep brandHue loud — the compiler derives a usable primary, never tame the brand into a button.",
    "Honor the parsed-brief numbers in every variant: a monochrome brief means all three anchors near-equal in hue; a vivid brief keeps the brand family. Hues only — chroma budgets are the compiler's job.",
    "Typography variants (\"typefaces\"): EXACTLY 3 distinct header/body directions for the same phrase, each {\"id\": <short unique slug>, \"name\": <evocative name>, \"display\": <header font id>, \"body\": <body font id>, \"reason\": <one sentence>}.",
    "display/body are closed-registry ids (never family names, never stacks). Match the brief: formal → serif or neutral grotesque; playful → expressive display; dense data → highly legible body.",
    fontChoiceBlock(),
  ].join(" ");
}

function phraseSystem(exemplars: CorpusEntry[] = [], constraints?: PromptConstraints): string {
  return [
    buildTeachBlock(),
    "You judge a word or phrase as design DNA for a UI identity. Rate each axis 0-1:",
    "warmth (cold/clinical→warm/organic), chroma (muted→vivid: how much color, not which color),",
    "energy (calm→loud), playfulness (serious→playful), sharpness (soft/round→sharp/angular),",
    "density (airy→compact), ornament (minimal→ornate), formality (casual→formal/institutional).",
    SHAPE_PREAMBLE,
    `"axes": ${AXES_SHAPE},`,
    '"palette": {"primaryHue":"<degrees>","accentHue":"<degrees>","neutralHue":"<degrees>","brandHue":"<degrees>"}.',
    VALUE_RULES,
    variantRules(),
    exemplarBlock(exemplars),
    constraintHint(constraints),
  ].filter(Boolean).join(" ");
}

function deltaSystem(): string {
  return [
    buildTeachBlock(),
    "You edit stored design DNA. Given the current DNA and an edit prompt,",
    "You edit stored design DNA. Reply with a DNA-only delta: {\"delta\": {\"axes\"?, \"palette\"?}} — optional",
    '"axes" and "palette" objects containing ONLY the fields the prompt implicates, with new values (unrelated',
    "fields absent, not repeated). No other keys.",
    VALUE_RULES,
  ].join(" ");
}

/** Rules version the teach block was built from (logged per generation). */
export function teachRulesVersion(): number {
  return designRulesVersion();
}

/**
 * Non-throwing JSON parse for the validation-retry path. A parse failure is
 * returned as data so the caller can feed it into the single retry exactly
 * like a schema-validation failure (previously the throw skipped the retry).
 */
function tryParseJson(text: string): { ok: true; value: unknown } | { ok: false; message: string } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, message: "previous reply was not valid JSON — reply with a single JSON object and no other text" };
  }
}

/** Feedback payload for the retry call: validation issues, or the parse failure. */
function retryFeedback(parseOk: boolean, issues: Array<{ path: Array<PropertyKey>; message: string }>, parseMessage: string): string {
  if (parseOk) {
    return JSON.stringify(issues);
  }
  return JSON.stringify([{ path: [], message: parseMessage }]);
}

async function callChatJson(args: {
  system: string;
  user: string;
  schema: unknown;
  /** Schema name for providers whose schema mode requires one (Groq json_schema). */
  schemaName: string;
  feedback?: string;
}): Promise<{ text: string; tokensIn: number | null; tokensOut: number | null; model: string }> {
  if (providerName() === "groq") {
    return callGroqJson(args);
  }
  return callGeminiJson({ system: args.system, userParts: [{ text: args.user }], schema: args.schema, feedback: args.feedback });
}

interface GroqResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string };
}

/**
 * Groq (OpenAI-compatible): text-only. Sends the response schema via
 * `json_schema` (best-effort mode — no `strict: true`, since the delta shape
 * has optional fields strict decoding would reject), falling back to plain
 * `json_object` on models that refuse the schema mode. The zod parse +
 * single retry stays the real guard either way.
 */
async function callGroqJson(args: {
  system: string;
  user: string;
  schema: unknown;
  schemaName: string;
  feedback?: string;
}): Promise<{ text: string; tokensIn: number | null; tokensOut: number | null; model: string }> {
  const model = assertModelCapable();
  const key = apiKey();
  const user = args.feedback ? `${args.user}\n\nYour previous reply was rejected by the schema validator with these errors — fix them and reply with valid JSON only:\n${args.feedback}` : args.user;
  const messages = [
    { role: "system", content: args.system },
    { role: "user", content: user },
  ];
  const post = (responseFormat: unknown) =>
    fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages, response_format: responseFormat }),
    });
  const readText = async (res: Response): Promise<{ json: GroqResponse; text: string }> => {
    const json = (await res.json()) as GroqResponse;
    if (!res.ok) {
      throw new Error(`provider error (HTTP ${res.status}): ${json.error?.message ?? "unknown"}`);
    }
    const text = json.choices?.[0]?.message?.content ?? "";
    if (!text) {
      throw new Error("provider returned no content");
    }
    return { json, text };
  };
  let res = await post({ type: "json_schema", json_schema: { name: args.schemaName, schema: args.schema } });
  if (!res.ok) {
    const probe = (await res.json().catch(() => null)) as GroqResponse | null;
    const msg = probe?.error?.message ?? "";
    if (res.status === 400 && /response_format|json_schema|strict|schema/i.test(msg)) {
      res = await post({ type: "json_object" });
    }
  }
  const { json, text } = await readText(res);
  return {
    text,
    tokensIn: json.usage?.prompt_tokens ?? null,
    tokensOut: json.usage?.completion_tokens ?? null,
    model,
  };
}

/**
 * Text door: phrase → DNA v2 only in ONE model call. A second call happens
 * only on the failure path (invalid output → one retry with validation
 * errors, then fail + log, store nothing) or when compilation reports an
 * unrepairable design-rule violation (retry carries the named rule
 * findings). Compliant generations cost exactly one call, as today.
 */
export interface GenerateDnaOptions {
  exemplars?: CorpusEntry[];
  constraints?: PromptConstraints;
  repairFeedback?: string;
}

export async function generateDna(prompt: string, repairOrOpts?: string | GenerateDnaOptions): Promise<DnaCallResult> {
  const trimmed = prompt.trim().slice(0, GENERATION_PROMPT_MAX_LENGTH);
  if (!trimmed) {
    throw new Error("prompt must not be empty");
  }
  const opts: GenerateDnaOptions =
    typeof repairOrOpts === "string" ? { repairFeedback: repairOrOpts } : (repairOrOpts ?? {});
  const system = phraseSystem(opts.exemplars ?? [], opts.constraints);
  const user = opts.repairFeedback
    ? `Phrase: ${trimmed}\n\nYour previous output compiled to a payload that violates these design rules — revise the DNA and palette to comply, keeping the same character:\n${opts.repairFeedback}`
    : `Phrase: ${trimmed}`;
  const call = await callChatJson({
    system,
    user,
    schema: DNA_RESPONSE_SCHEMA,
    schemaName: "dna_response",
  });
  const firstRaw = tryParseJson(call.text);
  const first = firstRaw.ok ? modelOutputSchema.safeParse(firstRaw.value) : null;
  if (first?.success) {
    return {
      output: {
        axes: first.data.axes,
        palette: first.data.palette,
        palettes: first.data.palettes,
        typefaces: first.data.typefaces,
        composition: first.data.composition,
        imagery: first.data.imagery,
      },
      model: call.model,
      tokensIn: call.tokensIn,
      tokensOut: call.tokensOut,
    };
  }
  const firstFeedback = retryFeedback(
    firstRaw.ok,
    first && !first.success ? first.error.issues.map((i) => ({ path: i.path, message: i.message })) : [],
    !firstRaw.ok ? firstRaw.message : "",
  );
  const retry = await callChatJson({
    system,
    user,
    schema: DNA_RESPONSE_SCHEMA,
    schemaName: "dna_response",
    feedback: firstFeedback,
  });
  const secondRaw = tryParseJson(retry.text);
  const second = secondRaw.ok ? modelOutputSchema.safeParse(secondRaw.value) : null;
  if (!second?.success) {
    throw new Error(
      secondRaw.ok && second && !second.success
        ? `provider output failed schema validation twice: ${second.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`
        : `provider output failed schema validation twice: ${!secondRaw.ok ? secondRaw.message : "unknown error"}`,
    );
  }
  return {
    output: {
      axes: second.data.axes,
      palette: second.data.palette,
      palettes: second.data.palettes,
      typefaces: second.data.typefaces,
      composition: second.data.composition,
      imagery: second.data.imagery,
    },
    model: retry.model,
    tokensIn: (call.tokensIn ?? 0) + (retry.tokensIn ?? 0),
    tokensOut: (call.tokensOut ?? 0) + (retry.tokensOut ?? 0),
  };
}

/**
 * Prompt edit: DNA-only delta with the same single validation retry as the
 * text door — a bad first output (unparseable or schema-invalid) gets one
 * retry with the failure fed back, then fails + logs and stores nothing.
 * Only implicated fields change; unrelated payload fields stay byte-identical.
 */
export async function generateDnaDelta(
  current: Pick<ModelOutput, "axes" | "palette">,
  prompt: string,
): Promise<DeltaCallResult> {
  const trimmed = prompt.trim().slice(0, 280);
  if (!trimmed) {
    throw new Error("edit prompt must not be empty");
  }
  const system = deltaSystem();
  const user = `Current DNA: ${JSON.stringify(current.axes)}\nCurrent palette: ${JSON.stringify(current.palette)}\nEdit: ${trimmed}`;
  const call = await callChatJson({
    system,
    user,
    schema: DELTA_RESPONSE_SCHEMA,
    schemaName: "dna_delta_response",
  });
  const firstRaw = tryParseJson(call.text);
  const first = firstRaw.ok ? modelDeltaOutputSchema.safeParse(firstRaw.value) : null;
  if (first?.success) {
    return {
      delta: first.data.delta ?? {},
      model: call.model,
      tokensIn: call.tokensIn,
      tokensOut: call.tokensOut,
    };
  }
  const retry = await callChatJson({
    system,
    user,
    schema: DELTA_RESPONSE_SCHEMA,
    schemaName: "dna_delta_response",
    feedback: retryFeedback(
      firstRaw.ok,
      first && !first.success ? first.error.issues.map((i) => ({ path: i.path, message: i.message })) : [],
      !firstRaw.ok ? firstRaw.message : "",
    ),
  });
  const secondRaw = tryParseJson(retry.text);
  const second = secondRaw.ok ? modelDeltaOutputSchema.safeParse(secondRaw.value) : null;
  if (!second?.success) {
    throw new Error(
      secondRaw.ok && second && !second.success
        ? `provider delta output failed validation twice: ${second.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`
        : `provider delta output failed validation twice: ${!secondRaw.ok ? secondRaw.message : "unknown error"}`,
    );
  }
  return {
    delta: second.data.delta ?? {},
    model: retry.model,
    tokensIn: (call.tokensIn ?? 0) + (retry.tokensIn ?? 0),
    tokensOut: (call.tokensOut ?? 0) + (retry.tokensOut ?? 0),
  };
}
