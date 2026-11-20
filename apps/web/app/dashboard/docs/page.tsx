import { redirect } from "next/navigation";

// Dashboard docs mirror the public index: start at Configuration.
export default function DashboardDocsIndex() {
  redirect("/dashboard/docs/configuration");
}
