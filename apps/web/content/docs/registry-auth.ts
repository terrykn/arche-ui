import type { DocsPageData } from "@/lib/docs-content";

export const registryAuth: DocsPageData = {
  slug: "/registry-auth",
  title: "Registry auth",
  blocks: [
    {
      kind: "markdown",
      body: "Public libraries serve openly. Private libraries require your registry token:",
    },
    {
      kind: "code",
      code: `// components.json (private library)
{
  "registries": {
    "@arche": {
      "url": "https://<host>/r/<user>/<identity>/{name}.json",
      "headers": { "Authorization": "Bearer \${REGISTRY_TOKEN}" }
    }
  }
}`,
    },
    {
      kind: "markdown",
      body: "Issue the token in dashboard Settings — shown once, stored hashed, revocable. Requests without a valid token get a bare 404 (no payload content, no existence hint).",
    },
  ],
};
