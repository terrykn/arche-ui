import type { CSSProperties } from "react";
import type { DemoIdentity } from "./demo-identities";
import { Plus } from "lucide-react";

/**
 * Acme Tasks — the fixed mini app (§4). Identical DOM for every identity;
 * only the skin (inline custom properties) changes.
 */
export function AcmeTasks({ identity }: { identity: DemoIdentity }) {
  const skin = {
    "--d-bg": identity.background,
    "--d-surface": identity.surface ?? "#ffffff",
    "--d-ink": identity.ink,
    "--d-primary": identity.primary,
    "--d-accent-bg": identity.accentBg,
    "--d-accent-text": identity.accentText,
    "--d-radius": identity.radius,
    "--d-btn-radius": identity.buttonRadius,
    "--d-line": "color-mix(in srgb, currentColor 12%, transparent)",
  } as CSSProperties;

  return (
    <div className="acme" style={skin}>
      <aside className="acme-side">
        <p className="acme-brand">AC Acme Tasks</p>
        <span className="acme-nav active">Overview</span>
        <span className="acme-nav">My tasks</span>
        <span className="acme-nav">Calendar</span>
        <span className="acme-nav">Settings</span>
        <span className="acme-user">JD Jordan Doe</span>
      </aside>
      <div className="acme-main">
        <h3 className="acme-h">Good morning, Jordan</h3>
        <p className="acme-sub">Tuesday · 6 tasks due today · 2 teammates online</p>
        <div className="acme-tabs">
          <span className="acme-tab active">Today</span>
          <span className="acme-tab">Week</span>
          <span className="acme-tab">All tasks</span>
        </div>
        <div className="acme-stats">
          <div className="acme-stat">
            <b>12</b> Open tasks
            <i className="acme-bar"><i style={{ width: "62%" }} /></i>
          </div>
          <div className="acme-stat">
            <b>86%</b> Sprint progress
            <i className="acme-bar"><i style={{ width: "86%" }} /></i>
          </div>
          <div className="acme-stat">
            <b>4</b> Reviews waiting
            <i className="acme-bar"><i style={{ width: "34%" }} /></i>
          </div>
        </div>
        <div className="acme-task">
          <label className="acme-row">
            <input type="checkbox" defaultChecked aria-label="Ship the new onboarding flow" />
            Ship the new onboarding flow <em className="acme-tag done">Done</em>
          </label>
          <div className="acme-row">Review Maya&apos;s design handoff <em className="acme-tag">In review</em></div>
          <div className="acme-row">Prepare Friday demo notes <em className="acme-tag">Today</em></div>
        </div>
        <div className="acme-actions">
          <button type="button" className="acme-btn-primary"><Plus size={14} aria-hidden="true" style={{ verticalAlign: "-0.2em" }} /> New task</button>
          <button type="button" className="acme-btn-ghost">Share board</button>
          <input className="acme-search" placeholder="Search tasks…" aria-label="Search tasks" />
          <label className="acme-switch">
            <input type="checkbox" defaultChecked aria-label="Notifications" />
            <span>Notifications</span>
          </label>
        </div>
      </div>
    </div>
  );
}
