import { redirect } from "next/navigation";

// Docs start at the first section tab (Configuration), not Installation.
export default function DocsIndex() {
  redirect("/docs/configuration");
}
