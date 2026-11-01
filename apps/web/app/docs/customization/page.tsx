export default function Customization() {
  return (
    <div>
      <span className="proto-chip">Advanced</span>
      <h1>Customization</h1>
      <p className="proto-lede">Every identity is data — tune it without touching component code.</p>
      <div className="proto-steps">
        <div className="proto-step">
          <div>
            <strong>Pick tokens</strong>
            <p>Adjust colors, radius, type, shadows, and motion. Contrast pairs are checked as you go.</p>
          </div>
        </div>
        <div className="proto-step">
          <div>
            <strong>Set knobs</strong>
            <p>Choose default variants, sizes, and surface options — only legal values are offered.</p>
          </div>
        </div>
        <div className="proto-step">
          <div>
            <strong>Publish a version</strong>
            <p>Snapshots are immutable, so yesterday&apos;s install stays reproducible.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
