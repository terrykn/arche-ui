/** Product changelog (Part 4.4b): real changes, newest first. Backfilled at month granularity. */
export interface ChangelogEntry {
  date: string;
  title: string;
  body: string;
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-11-08",
    title: "Border width becomes a token; kitchen sink ships",
    body: "Component borders now resolve to the --border-width dimension token (1px everywhere on existing identities, so nothing visually changes until you opt into 2–3px). Generated identities pick their width from DNA sharpness and profile, bounded per profile by the new border-width-profile-bounds rule. The kitchen sink renders all 37 catalog components under any identity, the Studio preview is now the full sink, and border-width profile bounds are enforced at generation and publish.",
  },
  {
    date: "2026-11-08",
    title: "Shapeshift learns the design rulebook",
    body: "AI generation now works inside published design rules: the model returns a plan, a self-check, and DNA in one call; the compiler repairs checkable violations into the envelope (recording every repair) and fails loudly on the rest. Three generation profiles — enterprise, standard, expressive — scale the envelopes without relaxing AA.",
  },
  {
    date: "November 2026",
    title: "AI identity generation (Shapeshift) and the MCP server",
    body: "Describe-a-vibe generation landed behind a generation allowance, with prompt-edit deltas and the publish gate holding generated payloads to the same validator as hand-made ones. Agents use the same surface through the hosted MCP server: manifests, tokens, standards, and generate_identity.",
  },
  {
    date: "November 2026",
    title: "Web app, dashboard, and public identity pages",
    body: "The Studio edits tokens and knobs against live previews, publish stores immutable versioned snapshots, and every public identity gets an installable registry with a full-catalog preview.",
  },
  {
    date: "November 2026",
    title: "Token contract, registry, and CLI",
    body: "The closed token contract (OKLCH colors, radius, type, motion, shadows), the deterministic registry emitter, manifest↔template agreement checks, and the arche add/install CLI flow shipped first — everything since builds on them.",
  },
];
