import { ArrowRight } from "lucide-react";
import { DocsLink } from "@/components/docs-base";
import { DocsMarkdown } from "@/components/docs/markdown";

// Primitive section layouts shared by every docs page. Data files stay declarative:
// these render the markup, the data file only supplies strings.

export function Steps({ items }: { items: Array<{ title: string; body: string }> }) {
  return (
    <div className="proto-steps">
      {items.map((item) => (
        <div key={item.title} className="proto-step">
          <div>
            <strong>{item.title}</strong>
            <DocsMarkdown body={item.body} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Step({ title, body }: { title: string; body: string }) {
  return (
    <div className="proto-step">
      <div>
        <strong>{title}</strong>
        <DocsMarkdown body={body} />
      </div>
    </div>
  );
}

export function Code({ code, caption }: { code: string; caption?: string }) {
  return (
    <>
      {caption ? <p className="proto-code-caption">{caption}</p> : null}
      <div className="proto-code proto-mono">{code}</div>
    </>
  );
}

export function Cards({ items }: { items: Array<{ title: string; body: string }> }) {
  return (
    <div className="proto-card" style={{ marginTop: 22 }}>
      {items.map((item) => (
        <section key={item.title}>
          <h3>{item.title}</h3>
          <DocsMarkdown body={item.body} />
        </section>
      ))}
    </div>
  );
}

export function Callout({
  body,
  link,
}: {
  body: string;
  link?: { label: string; path: string };
}) {
  return (
    <div className="proto-help-banner">
      {body}{" "}
      {link ? (
        <DocsLink path={link.path}>
          {link.label} <ArrowRight size={14} aria-hidden="true" style={{ verticalAlign: "-0.2em" }} />
        </DocsLink>
      ) : null}
    </div>
  );
}
