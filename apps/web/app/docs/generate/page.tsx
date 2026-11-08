export default function Generate() {
  return (
    <div>
      <h1 className="font-display text-3xl">Generate with AI (Shapeshift)</h1>
      <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed">
        <p>
          Dashboard → <strong>New Identity</strong> offers an AI door besides the blank start.
          It lands as a <strong>private draft</strong> — publishing is always a separate,
          explicit action.
        </p>
        <ul className="flex flex-col gap-1">
          <li>
            · <strong>Describe a vibe</strong> — a phrase (“90s arcade”, “quiet hospital calm”)
            becomes design DNA: model-judged axes and palette, compiled to tokens.
          </li>
        </ul>
        <p>
          <strong>Prompt edit</strong> (on the edit page, for generated identities) takes a
          natural-language nudge (“warmer, less playful”) and recompiles only the implicated
          DNA fields — unrelated payload fields stay byte-identical, and the diff is inspectable.
          Hand-recorded token overrides survive recompilation.
        </p>
        <p>Guarantees, enforced in code rather than promised in prose:</p>
        <ul className="flex flex-col gap-1">
          <li>· The model outputs DNA only — tokens, classes, and component code are unrepresentable.</li>
          <li>· Every compile passes the absolute AA contrast gate; failures change nothing.</li>
          <li>· Every attempt is logged with model and token counts, including failures.</li>
          <li>· A 24-hour generation allowance applies per account (failed checks don&apos;t consume it).</li>
          <li>· Provider keys live server-side only; the browser never sees them.</li>
        </ul>
        <p>
          Agents use the same text door through MCP: <strong>generate_identity</strong> (hosted
          only — see <a className="underline" href="/docs/mcp">MCP overview</a>).
        </p>
      </div>
    </div>
  );
}
