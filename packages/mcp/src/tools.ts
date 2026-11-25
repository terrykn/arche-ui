import { z } from "zod";
import {
  getBlockManifests,
  getCatalogManifests,
  getManifests,
  getTokenContract,
  serializeStable,
  validateIdentity,
  type ArcheIdentity,
} from "@arche-ui/registry-core";
import { createHash } from "node:crypto";
import { checkPlacement, type PlacementContext } from "./check.js";
import type { McpBackend } from "./backend.js";

/** Minimal tool definition mounted on both transports (§4). */
export interface ToolDef {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  handler: (args: Record<string, unknown>, backend: McpBackend) => Promise<unknown>;
}

function textResult(value: unknown): unknown {
  return {
    content: [{ type: "text", text: typeof value === "string" ? value : serializeStable(value) }],
    structuredContent: value as Record<string, unknown>,
  };
}

export const ListComponentsSchema = z.object({
  category: z.string().optional().describe("Filter by manifest category, e.g. actions or overlays"),
});

export const GetComponentSchema = z.object({
  name: z.string().min(1).describe("Component name, e.g. button or dialog"),
});

export const ListBlocksSchema = z.object({
  category: z.string().optional().describe("Filter by block category: marketing or application"),
});

export const GetBlockSchema = z.object({
  name: z.string().min(1).describe("Block name, e.g. hero-aurora or sidebar-1"),
});

export const GetTokenContractSchema = z.object({});

export const ListLibrariesSchema = z.object({});

export const GetIdentitySchema = z.object({
  library: z.string().min(1).describe("Library reference (<user>/<library> hosted, payload name local)"),
  version: z.number().int().positive().optional().describe("Pinned published version; default is latest"),
});

export const ValidateIdentitySchema = z.object({
  library: z.string().min(1).optional().describe("Validate a stored library by reference"),
  payload: z.record(z.string(), z.unknown()).optional().describe("Or validate an inline payload object"),
});

export const CheckPlacementSchema = z.object({
  component: z.string().min(1).describe("Component or block to place, e.g. button or hero-aurora"),
  variant: z.string().optional(),
  purpose: z.string().optional().describe("Function-fit class: navigation, action, confirmation, data-entry, ..."),
  primaryActionsInRegion: z.number().int().min(0).optional(),
  hasConfirmation: z.boolean().optional(),
  iconOnly: z.boolean().optional(),
  hasAccessibleLabel: z.boolean().optional(),
  insideDialog: z.boolean().optional(),
  targetSizePx: z.number().optional(),
  pageComponents: z.array(z.string()).optional().describe("Names already on the page, for page-level rules (one h1, one header)"),
});

const IdentityEditSchema = z.object({
  setToken: z
    .object({ token: z.string(), mode: z.enum(["light", "dark"]), value: z.string() })
    .optional(),
  setKnob: z
    .object({ component: z.string(), knob: z.string(), value: z.unknown() })
    .optional(),
  setFont: z
    .object({ slot: z.enum(["sans", "display", "mono"]), id: z.string() })
    .optional(),
  setIcon: z.object({ id: z.string() }).optional(),
});

export const ApplyIdentityEditSchema = z.object({
  library: z.string().min(1),
  changes: z.array(IdentityEditSchema).min(1).describe("Diff-scoped edits; nothing else is expressible"),
});

export const PublishIdentitySchema = z.object({
  library: z.string().min(1),
});

export const EmitRegistrySchema = z.object({
  library: z.string().min(1),
  outDir: z.string().min(1),
});

export const GenerateIdentitySchema = z.object({
  prompt: z.string().min(1).max(120).describe("Vibe phrase, e.g. '90s arcade' or 'quiet hospital calm'"),
  name: z.string().max(80).optional().describe("Draft name; defaults to the phrase"),
});

function applyChangesToPayload(payload: ArcheIdentity, changes: z.infer<typeof IdentityEditSchema>[]): void {
  for (const change of changes) {
    if (change.setToken) {
      const tokens = payload.tokens as Record<string, Record<string, { $value?: unknown }>>;
      const modeTokens = tokens[change.setToken.mode];
      if (!modeTokens || !(change.setToken.token in modeTokens)) {
        throw new Error(`unknown token '${change.setToken.token}'`);
      }
      modeTokens[change.setToken.token] = {
        ...(modeTokens[change.setToken.token] as object),
        $value: change.setToken.value,
      } as { $value?: unknown };
    } else if (change.setKnob) {
      const component = payload.components[change.setKnob.component];
      if (!component) throw new Error(`unknown component '${change.setKnob.component}'`);
      component[change.setKnob.knob] = change.setKnob.value;
    } else if (change.setFont) {
      payload.fonts[change.setFont.slot] = change.setFont.id;
    } else if (change.setIcon) {
      payload.icons = change.setIcon.id;
    } else {
      throw new Error("empty change: each entry must set exactly one of token/knob/font/icon");
    }
  }
}

export function buildToolRegistry(): ToolDef[] {
  return [
    {
      name: "list_components",
      description: "List every Arche catalog component (name, title, category). Filter by category when exploring one surface.",
      inputSchema: ListComponentsSchema,          handler: async (args) => {
            const { category } = ListComponentsSchema.parse(args);
            // Wrapped in an object: the SDK requires structuredContent to be a record.
            return textResult({
              components: getManifests()
                .filter((m) => !category || m.category === category)
                .map((m) => ({ name: m.name, title: m.title, category: m.category, description: m.description })),
            });
          },
    },
    {
      name: "get_component",
      description: "Read a component's full declared surface from its manifest: slots, axes, knobs, tokens, deps, standards. Call before styling or placing it.",
      inputSchema: GetComponentSchema,
      handler: async (args) => {
        const { name } = GetComponentSchema.parse(args);
        const manifest = getManifests().find((m) => m.name === name);
        if (!manifest) throw new Error(`unknown component '${name}'`);
        return textResult(manifest);
      },
    },
    {
      name: "list_blocks",
      description: "List every Arche installable block (name, title, category). Filter by marketing or application.",
      inputSchema: ListBlocksSchema,      handler: async (args) => {
            const { category } = ListBlocksSchema.parse(args);
            return textResult({
              blocks: getBlockManifests()
                .filter((m) => !category || m.category === category)
                .map((m) => ({ name: m.name, title: m.title, category: m.category, description: m.description })),
            });
          },
    },
    {
      name: "get_block",
      description: "Read a block's full composition contract: content slots, child components, layout axes, heading role, install command. Call before installing or composing it.",
      inputSchema: GetBlockSchema,
      handler: async (args) => {
        const { name } = GetBlockSchema.parse(args);
        const manifest = getBlockManifests().find((m) => m.name === name);
        if (!manifest) throw new Error(`unknown block '${name}'`);
        return textResult(manifest);
      },
    },
    {
      name: "get_token_contract",
      description: "Read the DTCG token vocabulary: names, types, contrast pairs. Call before choosing token values.",
      inputSchema: GetTokenContractSchema,
      handler: async () => textResult(getTokenContract()),
    },
    {
      name: "list_libraries",
      description: "List the caller's libraries (hosted: <user>/<library>; local: configured payload names).",
      inputSchema: ListLibrariesSchema,          handler: async (_args, backend) => textResult({ libraries: await backend.listLibraries() }),
    },
    {
      name: "get_identity",
      description: "FR-APPLY-1: fetch an identity's full payload (both token sets, knob/font/icon selections) plus its install block. Payload data only — never component source.",
      inputSchema: GetIdentitySchema,
      handler: async (args, backend) => {
        const { library, version } = GetIdentitySchema.parse(args);
        const result = await backend.getIdentity(library, version);
        if (!result) throw new Error(`library '${library}' not found`);
        return textResult(result);
      },
    },
    {
      name: "validate_identity",
      description: "Run the shared publish-gate validator over a stored library or an inline payload. Returns pass (plus informational design-rule lint) or the named token/pair/knob failures.",
      inputSchema: ValidateIdentitySchema,
      handler: async (args, backend) => {
        const parsed = ValidateIdentitySchema.parse(args);
        if (parsed.payload) {
          return textResult(backend.validatePayload(parsed.payload));
        }
        if (parsed.library) {
          const draft = await backend.getDraft(parsed.library);
          if (!draft) throw new Error(`library '${parsed.library}' not found`);
          return textResult(backend.validatePayload(draft));
        }
        throw new Error("provide either library or payload");
      },
    },
    {
      name: "check_placement",
      description: "Call before writing code that places an Arche component or block. Reports every standards rule plus pass/violation/not-evaluated per rule. A violation is a stop-and-reconsider signal: surface it to your user.",
      inputSchema: CheckPlacementSchema,
      handler: async (args) => {
        const parsed = CheckPlacementSchema.parse(args);
        const { component, ...ctx } = parsed;
        if (!getCatalogManifests().some((m) => m.name === component)) {
          throw new Error(`unknown component or block '${component}'`);
        }
        return textResult(checkPlacement(component, ctx as PlacementContext));
      },
    },
    {
      name: "apply_identity_edit",
      description: "Apply a diff-scoped draft edit (token/knob/font/icon only). Invalid edits change nothing. Publishing is never implied; call publish_identity separately.",
      inputSchema: ApplyIdentityEditSchema,
      handler: async (args, backend) => {
        const { library, changes } = ApplyIdentityEditSchema.parse(args);
        const before = await backend.getDraft(library);
        if (!before) throw new Error(`library '${library}' not found`);
        const beforeHash = createHash("sha256").update(serializeStable(before)).digest("hex");
        const next = JSON.parse(serializeStable(before)) as ArcheIdentity;
        applyChangesToPayload(next, changes);
        const validation = backend.validatePayload(next);
        if (!validation.ok) {
          return textResult({ ok: false, issues: validation.issues, draftUnchanged: true });
        }
        await backend.saveDraft(library, next, "mcp");
        // Re-read after saving: proves the write landed (a second apply must
        // observe this hash as its before-hash) and keeps drafts auditable.
        const afterHash = await backend.draftHash(library);
        return textResult({
          ok: true,
          library,
          changes: changes.map((c) => c),
          draftHashBefore: beforeHash.slice(0, 12),
          draftHashAfter: (afterHash ?? "unknown").slice(0, 12),
        });
      },
    },
    {
      name: "publish_identity",
      description: "Publish a library through the real publish gate (validate, emit, immutable snapshot). Returns the new version or the gate's named failures; publishes nothing on failure.",
      inputSchema: PublishIdentitySchema,
      handler: async (args, backend) => {
        const { library } = PublishIdentitySchema.parse(args);
        return textResult(await backend.publish(library));
      },
    },
    {
      name: "emit_registry",
      description: "Local mode only: emit registry items for a payload file via @arche-ui/registry-core. Byte-identical to the CLI emit for the same payload.",
      inputSchema: EmitRegistrySchema,
      handler: async (args, backend) => {
        const { library, outDir } = EmitRegistrySchema.parse(args);
        if (backend.kind !== "local") throw new Error("emit_registry is local mode only");
        return textResult({ files: await backend.emit(library, outDir) });
      },
    },
    {
      name: "generate_identity",
      description:
        "Hosted mode only: turn a vibe phrase into a validated private draft (Shapeshift text door — same implementation as the dashboard). Draft only, never published; publish_identity stays separate.",
      inputSchema: GenerateIdentitySchema,
      handler: async (args, backend) => {
        const { prompt, name } = GenerateIdentitySchema.parse(args);
        if (backend.kind !== "hosted") throw new Error("generate_identity is hosted mode only");
        return textResult(await backend.generateIdentity(prompt, name));
      },
    },
  ];
}
