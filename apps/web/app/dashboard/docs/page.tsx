import Link from "next/link";

const DOCS = [
  { href: "/docs/getting-started", label: "Getting started" },
  { href: "/docs/install-identity", label: "Install an identity" },
  { href: "/docs/create-edit", label: "Create / edit an identity" },
  { href: "/docs/token-contract", label: "Token contract" },
  { href: "/docs/mcp", label: "MCP overview + setup" },
  { href: "/docs/cli", label: "CLI (as specced)" },
  { href: "/docs/registry-auth", label: "Registry auth" },
];

export default function DashboardDocs() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-3xl">Docs</h1>
      <ul className="mt-6 flex flex-col gap-2">
        {DOCS.map((doc) => (
          <li key={doc.href} className="rounded-lg border border-border p-3">
            <Link href={doc.href} className="underline-offset-4 hover:underline">
              {doc.label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
