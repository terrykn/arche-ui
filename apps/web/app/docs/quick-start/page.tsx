import Link from "next/link";

export default function QuickStart() {
  return (
    <div>
      <span className="proto-chip">Getting Started</span>
      <h1>Quick Start</h1>
      <p className="proto-lede">From zero to your first component in five minutes.</p>
      <div className="proto-steps">
        <div className="proto-step">
          <div>
            <strong>Create an account</strong>
            <p>
              <Link href="/sign-up">Sign up</Link> with email or Google, then open the Dashboard.
            </p>
          </div>
        </div>
        <div className="proto-step">
          <div>
            <strong>Generate a library</strong>
            <p>Describe the vibe — Arche builds tokens, variants, and all 30 components as one system.</p>
          </div>
        </div>
        <div className="proto-step">
          <div>
            <strong>Install it</strong>
            <p>
              Run <span className="proto-mono">npx @arche/cli add button dialog select</span> and start building.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
