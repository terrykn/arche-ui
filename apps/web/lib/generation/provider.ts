import {
  buildTeachBlock,
  designRulesVersion,
  modelDeltaOutputSchema,
  modelOutputSchema,
  type DnaDelta,
  type GenerationProfile,
  type ModelOutput,
  type Plan,
  type SelfCheck,
} from "@arche/registry-core";

/**
 * Provider layer (Brief #6 §6, FR-GEN-4). All LLM access goes through
 * `generateDna` / `generateDnaDelta`. Provider and model come from server
 * environment only (LLM_PROVIDER, LLM_MODEL, LLM_API_KEY) — no
 * provider-specific types leak into payloads, the compiler, or MCP.
 */

export interface DnaCallResult {
  output: Pick<ModelOutput, "axes" | "palette">;
  /** Model-classified envelope preset, recorded on the payload. */
  profile: GenerationProfile;
  plan: Plan;
  selfCheck: SelfCheck;
  model: string;
  tokensIn: number | null;
  tokensOut: number | null;
}

export interface DeltaCallResult {
  delta: DnaDelta;
  /** Optional profile change from the same single-call response. */
  profile?: GenerationProfile;
  plan: Plan;
  selfCheck: SelfCheck;
  model: string;
  tokensIn: number | null;
  tokensOut: number | null;
}



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
 * instead of half-working. Image input is not supported (text door only).
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

const PLAN_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    colors: {
      type: "array",
      minItems: 4,
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          role: {
            type: "string",
            enum: ["background", "surface", "primary", "accent", "neutral", "text", "semantic-fixed"],
          },
          note: { type: "string" },
        },
        required: ["name", "role"],
      },
    },
  },
  required: ["colors"],
} as const;

const SELF_CHECK_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    verdict: { type: "string", enum: ["pass", "revised"] },
    notes: { type: "string" },
  },
  required: ["verdict", "notes"],
} as const;

const DNA_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    plan: PLAN_RESPONSE_SCHEMA,
    selfCheck: SELF_CHECK_RESPONSE_SCHEMA,
    axes: {
      type: "object",
      properties: {
        warmth: { type: "number", minimum: 0, maximum: 1 },
        energy: { type: "number", minimum: 0, maximum: 1 },
        playfulness: { type: "number", minimum: 0, maximum: 1 },
        sharpness: { type: "number", minimum: 0, maximum: 1 },
        density: { type: "number", minimum: 0, maximum: 1 },
        ornament: { type: "number", minimum: 0, maximum: 1 },
        retroFuturism: { type: "number", minimum: 0, maximum: 1 },
        formality: { type: "number", minimum: 0, maximum: 1 },
        material: { type: "string", enum: ["flat", "paper", "glass", "metal", "marble", "pixel", "clay"] },
        motionFeel: { type: "string", enum: ["snappy", "smooth", "bouncy", "stately", "glitchy"] },
        texture: { type: "string", enum: ["none", "grain", "scanlines", "grid", "marble-vein", "halftone"] },
        minContrast: { type: "string", enum: ["AA"] },
        respectReducedMotion: { type: "boolean" },
      },
      required: [
        "warmth", "energy", "playfulness", "sharpness", "density",
        "ornament", "retroFuturism", "formality",
        "material", "motionFeel", "texture", "minContrast", "respectReducedMotion",
      ],
    },
    palette: {
      type: "object",
      properties: {
        primaryHue: { type: "number", minimum: 0, maximum: 360 },
        accentHue: { type: "number", minimum: 0, maximum: 360 },
        neutralHue: { type: "number", minimum: 0, maximum: 360 },
      },
      required: ["primaryHue", "accentHue", "neutralHue"],
    },
    profile: { type: "string", enum: ["enterprise", "standard", "expressive"] },
  },
  required: ["plan", "selfCheck", "axes", "palette", "profile"],
} as const;

// Delta schema: same single-call shape (plan + self-check) with the revised
// inputs as a delta; every delta field optional — ONLY implicated fields.
const DELTA_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    plan: PLAN_RESPONSE_SCHEMA,
    selfCheck: SELF_CHECK_RESPONSE_SCHEMA,
    delta: {
      type: "object",
      properties: {
        axes: {
      type: "object",
      properties: {
        warmth: { type: "number", minimum: 0, maximum: 1 },
        energy: { type: "number", minimum: 0, maximum: 1 },
        playfulness: { type: "number", minimum: 0, maximum: 1 },
        sharpness: { type: "number", minimum: 0, maximum: 1 },
        density: { type: "number", minimum: 0, maximum: 1 },
        ornament: { type: "number", minimum: 0, maximum: 1 },
        retroFuturism: { type: "number", minimum: 0, maximum: 1 },
        formality: { type: "number", minimum: 0, maximum: 1 },
        material: { type: "string", enum: ["flat", "paper", "glass", "metal", "marble", "pixel", "clay"] },
        motionFeel: { type: "string", enum: ["snappy", "smooth", "bouncy", "stately", "glitchy"] },
        texture: { type: "string", enum: ["none", "grain", "scanlines", "grid", "marble-vein", "halftone"] },
      },
    },
        palette: {
          type: "object",
          properties: {
            primaryHue: { type: "number", minimum: 0, maximum: 360 },
            accentHue: { type: "number", minimum: 0, maximum: 360 },
            neutralHue: { type: "number", minimum: 0, maximum: 360 },
          },
        },
      },
    },
    profile: { type: "string", enum: ["enterprise", "standard", "expressive"] },
  },
  required: ["plan", "selfCheck", "delta"],
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
const AXES_TEMPLATE = [
  '{"warmth":0.5,"energy":0.5,"playfulness":0.5,"sharpness":0.5,"density":0.5,"ornament":0.5,',
  '"retroFuturism":0.5,"formality":0.5,"material":"metal","motionFeel":"snappy","texture":"grain",',
  '"minContrast":"AA","respectReducedMotion":true}',
].join("");

const SHAPE_PREAMBLE = [
  "You respond with ONE JSON object — no prose, no markdown — with these sections in order:",
  '1. "plan": {"colors": [4-6 entries {"name", "role", "note"?}]} — your palette plan: 4-6 named colors with intended roles',
  '(background, surface, primary, accent, neutral, text, semantic-fixed). Name each color; note is optional.',
  '2. "selfCheck": {"verdict": "pass"|"revised", "notes": "..."} — check the plan against the taught rules: name any item that reads as a',
  'generic default or violates a taught rule, or state the no-change verdict. Revise the final inputs accordingly inside this same response.',
].join(" ");

const VALUE_RULES = [
  "Value rules: every axis is a number 0-1.",
  "material is EXACTLY one of: flat, paper, glass, metal, marble, pixel, clay (lowercase, no other value).",
  "motionFeel is EXACTLY one of: snappy, smooth, bouncy, stately, glitchy.",
  "texture is EXACTLY one of: none, grain, scanlines, grid, marble-vein, halftone.",
  'minContrast is ALWAYS the string "AA", respectReducedMotion is ALWAYS true.',
  "Each palette hue is a NUMBER in degrees 0-360 (never a string, never hex).",
  'profile classifies the request: "enterprise" for fintech, healthcare-admin, legal, or institutional work;',
  '"expressive" for playful, loud, or artistic work; "standard" otherwise.',
].join(" ");

function phraseSystem(): string {
  return [
    buildTeachBlock(),
    "You judge a word or phrase as design DNA for a UI identity. Rate each axis 0-1:",
    "warmth (cold/clinical→warm/organic), energy (calm→loud), playfulness (serious→playful),",
    "sharpness (soft/round→sharp/angular), density (airy→compact), ornament (minimal→ornate),",
    "retroFuturism (contemporary→era-styled), formality (casual→formal/institutional).",
    SHAPE_PREAMBLE,
    `3. final inputs: "axes": ${AXES_TEMPLATE},`,
    '"palette": {"primaryHue":20,"accentHue":200,"neutralHue":40}, "profile": "standard".',
    VALUE_RULES,
  ].join(" ");
}

function deltaSystem(): string {
  return [
    buildTeachBlock(),
    "You edit stored design DNA. Given the current DNA and an edit prompt,",
    SHAPE_PREAMBLE,
    '3. revised inputs as "delta": an object with optional "axes" and "palette" objects containing ONLY the fields the prompt',
    'implicates, with new values (unrelated fields absent, not repeated), plus an optional "profile" when the edit changes the register.',
    VALUE_RULES,
  ].join(" ");
}

/** Rules version the teach block was built from (logged per generation). */
export function teachRulesVersion(): number {
  return designRulesVersion();
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("provider returned non-JSON output");
  }
}

async function callChatJson(args: {
  system: string;
  user: string;
  schema: unknown;
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

/** Groq (OpenAI-compatible): text-only, JSON object mode, validator retry. */
async function callGroqJson(args: {
  system: string;
  user: string;
  schema: unknown;
  feedback?: string;
}): Promise<{ text: string; tokensIn: number | null; tokensOut: number | null; model: string }> {
  const model = assertModelCapable();
  const user = args.feedback ? `${args.user}\n\nYour previous reply was rejected by the schema validator with these errors — fix them and reply with valid JSON only:\n${args.feedback}` : args.user;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey()}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  const json = (await res.json()) as GroqResponse;
  if (!res.ok) {
    throw new Error(`provider error (HTTP ${res.status}): ${json.error?.message ?? "unknown"}`);
  }
  const text = json.choices?.[0]?.message?.content ?? "";
  if (!text) {
    throw new Error("provider returned no content");
  }
  return {
    text,
    tokensIn: json.usage?.prompt_tokens ?? null,
    tokensOut: json.usage?.completion_tokens ?? null,
    model,
  };
}

/**
 * Text door: phrase → plan + self-check + DNA + palette + profile in ONE
 * model call. A second call happens only on the failure path (invalid
 * output → one retry with validation errors, then fail + log, store
 * nothing) or when compilation reports an unrepairable design-rule
 * violation (retry carries the named rule findings). Compliant generations
 * cost exactly one call, as today.
 */
export async function generateDna(prompt: string, repairFeedback?: string): Promise<DnaCallResult> {
  const trimmed = prompt.trim().slice(0, 120);
  if (!trimmed) {
    throw new Error("prompt must not be empty");
  }
  const system = phraseSystem();
  const user = repairFeedback
    ? `Phrase: ${trimmed}\n\nYour previous output compiled to a payload that violates these design rules — revise the DNA, palette, and profile to comply, keeping the same character:\n${repairFeedback}`
    : `Phrase: ${trimmed}`;
  const call = await callChatJson({
    system,
    user,
    schema: DNA_RESPONSE_SCHEMA,
  });
  const first = modelOutputSchema.safeParse(parseJson(call.text));
  if (first.success) {
    return {
      output: { axes: first.data.axes, palette: first.data.palette },
      profile: first.data.profile,
      plan: first.data.plan,
      selfCheck: first.data.selfCheck,
      model: call.model,
      tokensIn: call.tokensIn,
      tokensOut: call.tokensOut,
    };
  }
  const retry = await callChatJson({
    system,
    user,
    schema: DNA_RESPONSE_SCHEMA,
    feedback: JSON.stringify(first.error.issues.map((i) => ({ path: i.path, message: i.message }))),
  });
  const second = modelOutputSchema.safeParse(parseJson(retry.text));
  if (!second.success) {
    throw new Error(
      `provider output failed schema validation twice: ${second.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
    );
  }
  return {
    output: { axes: second.data.axes, palette: second.data.palette },
    profile: second.data.profile,
    plan: second.data.plan,
    selfCheck: second.data.selfCheck,
    model: retry.model,
    tokensIn: (call.tokensIn ?? 0) + (retry.tokensIn ?? 0),
    tokensOut: (call.tokensOut ?? 0) + (retry.tokensOut ?? 0),
  };
}

/**
 * Prompt edit: same single-call shape (plan + self-check + delta + optional
 * profile). Only implicated fields change; unrelated payload fields stay
 * byte-identical.
 */
export async function generateDnaDelta(
  current: Pick<ModelOutput, "axes" | "palette"> & { profile?: GenerationProfile },
  prompt: string,
): Promise<DeltaCallResult> {
  const trimmed = prompt.trim().slice(0, 280);
  if (!trimmed) {
    throw new Error("edit prompt must not be empty");
  }
  const system = deltaSystem();
  const user = `Current DNA: ${JSON.stringify(current.axes)}\nCurrent palette: ${JSON.stringify(current.palette)}\nCurrent profile: ${current.profile ?? "standard"}\nEdit: ${trimmed}`;
  const call = await callChatJson({
    system,
    user,
    schema: DELTA_RESPONSE_SCHEMA,
  });
  const parsed = modelDeltaOutputSchema.safeParse(parseJson(call.text));
  if (!parsed.success) {
    throw new Error(
      `provider delta output failed validation: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
    );
  }
  return {
    delta: parsed.data.delta,
    profile: parsed.data.profile,
    plan: parsed.data.plan,
    selfCheck: parsed.data.selfCheck,
    model: call.model,
    tokensIn: call.tokensIn,
    tokensOut: call.tokensOut,
  };
}
