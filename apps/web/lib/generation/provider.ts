import {
  dnaDeltaSchema,
  modelOutputSchema,
  type DnaDelta,
  type ModelOutput,
} from "@arche/registry-core";

/**
 * Provider layer (Brief #6 §6, FR-GEN-4). All LLM access goes through
 * `generateDna` / `generateDnaDelta`. Provider and model come from server
 * environment only (LLM_PROVIDER, LLM_MODEL, LLM_API_KEY) — no
 * provider-specific types leak into payloads, the compiler, or MCP.
 */

export interface DnaCallResult {
  output: ModelOutput;
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

const DNA_RESPONSE_SCHEMA = {
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
  },
  required: ["axes", "palette"],
} as const;

// Delta schema: every field optional — the model returns ONLY what the
// prompt implicates.
const DELTA_RESPONSE_SCHEMA = {
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

const PHRASE_SYSTEM = [
  "You judge a word or phrase as design DNA for a UI identity.",
  "Rate each axis 0-1:",
  "warmth (cold/clinical→warm/organic), energy (calm→loud), playfulness (serious→playful),",
  "sharpness (soft/round→sharp/angular), density (airy→compact), ornament (minimal→ornate),",
  "retroFuturism (contemporary→era-styled), formality (casual→formal/institutional).",
  "Reply with a JSON object ONLY — no prose, no markdown, no token values, no class names —",
  "with EXACTLY this shape and no extra keys:",
  '{"axes":{"warmth":0.5,"energy":0.5,"playfulness":0.5,"sharpness":0.5,"density":0.5,"ornament":0.5,',
  '"retroFuturism":0.5,"formality":0.5,"material":"metal","motionFeel":"snappy","texture":"grain",',
  '"minContrast":"AA","respectReducedMotion":true},',
  '"palette":{"primaryHue":20,"accentHue":200,"neutralHue":40}}',
  "Rules: every axis is a number 0-1.",
  "material is EXACTLY one of: flat, paper, glass, metal, marble, pixel, clay (lowercase, no other value).",
  "motionFeel is EXACTLY one of: snappy, smooth, bouncy, stately, glitchy.",
  "texture is EXACTLY one of: none, grain, scanlines, grid, marble-vein, halftone.",
  "minContrast is ALWAYS the string \"AA\", respectReducedMotion is ALWAYS true.",
  "Each palette hue is a NUMBER in degrees 0-360 that the phrase evokes (never a string, never hex).",
].join(" ");

const DELTA_SYSTEM = [
  "You edit stored design DNA. Given the current DNA and an edit prompt, return ONLY",
  "the fields the prompt implicates, with their new values. Omit every field the prompt",
  "does not touch — unrelated fields must be absent from your reply, not repeated.",
  "Reply with a JSON object ONLY — no prose, no markdown. ",
  "Shape: an object with optional \"axes\" and \"palette\" objects; inside, include ONLY implicated fields.",
  "Same value rules as creation: axes numbers 0-1;",
  "material EXACTLY one of flat|paper|glass|metal|marble|pixel|clay;",
  "motionFeel EXACTLY one of snappy|smooth|bouncy|stately|glitchy;",
  "texture EXACTLY one of none|grain|scanlines|grid|marble-vein|halftone;",
  "palette hues are NUMBERS 0-360 (never strings or hex).",
].join(" ");

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

/** Text door: phrase → DNA + palette. One retry with validator feedback, then fail. */
export async function generateDna(prompt: string): Promise<DnaCallResult> {
  const trimmed = prompt.trim().slice(0, 120);
  if (!trimmed) {
    throw new Error("prompt must not be empty");
  }
  const call = await callChatJson({
    system: PHRASE_SYSTEM,
    user: `Phrase: ${trimmed}`,
    schema: DNA_RESPONSE_SCHEMA,
  });
  const first = modelOutputSchema.safeParse(parseJson(call.text));
  if (first.success) {
    return { output: first.data, model: call.model, tokensIn: call.tokensIn, tokensOut: call.tokensOut };
  }
  const retry = await callChatJson({
    system: PHRASE_SYSTEM,
    user: `Phrase: ${trimmed}`,
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
    output: second.data,
    model: retry.model,
    tokensIn: (call.tokensIn ?? 0) + (retry.tokensIn ?? 0),
    tokensOut: (call.tokensOut ?? 0) + (retry.tokensOut ?? 0),
  };
}

/** Prompt edit: current DNA + prompt → DNA delta (only implicated fields). */
export async function generateDnaDelta(current: ModelOutput, prompt: string): Promise<DeltaCallResult> {
  const trimmed = prompt.trim().slice(0, 280);
  if (!trimmed) {
    throw new Error("edit prompt must not be empty");
  }
  const call = await callChatJson({
    system: DELTA_SYSTEM,
    user: `Current DNA: ${JSON.stringify(current.axes)}\nCurrent palette: ${JSON.stringify(current.palette)}\nEdit: ${trimmed}`,
    schema: DELTA_RESPONSE_SCHEMA,
  });
  const parsed = dnaDeltaSchema.safeParse(parseJson(call.text));
  if (!parsed.success) {
    throw new Error(
      `provider delta output failed validation: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
    );
  }
  return { delta: parsed.data, model: call.model, tokensIn: call.tokensIn, tokensOut: call.tokensOut };
}
