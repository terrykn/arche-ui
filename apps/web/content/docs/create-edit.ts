import type { DocsPageData } from "@/lib/docs-content";

export const createEdit: DocsPageData = {
  slug: "/create-edit",
  title: "Create / edit an identity",
  blocks: [
    {
      kind: "markdown",
      body: `Dashboard → **New Identity** starts from the Arche Default payload. The editor generates its controls from the foundation data:

- Token fields cover exactly the contract tokens, per mode (light/dark).
- Knob controls offer exactly each manifest's legal values — an illegal value is unrepresentable.
- The live preview re-skins installed components from the working payload.

**Save draft** validates before storing. **Publish** runs the same gate plus emission and stores an immutable versioned snapshot.

Prefer a head start? [Generate with AI](./customization) turns a sentence into a validated draft you then edit here.`,
    },
  ],
};
