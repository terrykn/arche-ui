import type { ComponentType } from "react";
import type { DocsBlock, DocsPageData } from "@/lib/docs-content";
import { DocsPageHeader } from "@/components/docs-page-header";
import { DocsPrevNext } from "@/components/docs-prev-next";
import { DocsMarkdown } from "@/components/docs/markdown";
import { DOCS_BLOCKS } from "@/components/docs/registry";
import { Callout, Cards, Steps } from "@/components/docs/blocks";

// Renders one data-defined docs page. Unknown component names fail loudly in
// development and are skipped in production, so a bad data file can't break
// the whole docs route.
function Block({ block }: { block: DocsBlock }) {
  switch (block.kind) {
    case "markdown":
      return <DocsMarkdown body={block.body} />;
    case "code":
      return (
        <>
          {block.caption ? <p className="proto-code-caption">{block.caption}</p> : null}
          <div className="proto-code proto-mono">{block.code}</div>
        </>
      );
    case "steps":
      return <Steps items={block.items} />;
    case "cards":
      return <Cards items={block.items} />;
    case "callout":
      return <Callout body={block.body} link={block.link} />;
    case "component": {
      const BlockComponent = DOCS_BLOCKS[block.name] as unknown as
        | ComponentType<Record<string, unknown>>
        | undefined;
      if (!BlockComponent) {
        if (process.env.NODE_ENV !== "production") {
          throw new Error(`Unknown docs block component "${block.name}"`);
        }
        return null;
      }
      return <BlockComponent {...block.props} />;
    }
  }
}

export function DocsPage({ page }: { page: DocsPageData }) {
  return (
    <div>
      <DocsPageHeader title={page.title} />
      {page.lede ? <p className="proto-lede">{page.lede}</p> : null}
      {page.blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
      <DocsPrevNext />
    </div>
  );
}
