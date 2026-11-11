import type { DocsPageData } from "@/lib/docs-content";

export const installIdentity: DocsPageData = {
  slug: "/install-identity",
  title: "Install an identity",
  blocks: [
    {
      kind: "markdown",
      body: "Identities install through the stock shadcn CLI — no Arche tooling required:",
    },
    {
      kind: "code",
      code: `// components.json — replace <host>, <user>, <identity> with the install block values
{
  "registries": {
    "@arche": "https://<host>/r/<user>/<identity>/{name}.json"
  }
}

pnpm dlx shadcn@latest add @arche/all`,
    },
    {
      kind: "markdown",
      body: `Private libraries add an \`Authorization: Bearer \${REGISTRY_TOKEN}\` header entry (see [Registry auth](./registry-auth)) and the same \`add\` command.

Pin a version for reproducible installs: \`https://<host>/r/<user>/<identity>/v/<n>/all.json\`.`,
    },
  ],
};
