import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DocsMarkdownLink } from "@/components/docs/markdown-link";

// Server-rendered markdown for docs content: parsed once per request (static
// pages are prerendered), no client JS shipped for prose.
export function DocsMarkdown({ body }: { body: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => <DocsMarkdownLink href={href}>{children}</DocsMarkdownLink>,
        pre: ({ children }) => <div className="proto-code proto-mono">{children}</div>,
        h2: ({ children }) => <h2>{children}</h2>,
        h3: ({ children }) => <h3>{children}</h3>,
      }}
    >
      {body}
    </ReactMarkdown>
  );
}
