import { redirect } from "next/navigation";

/**
 * Examples moved onto the home page below the feature cards; the old
 * route forwards to that section so existing links keep working.
 */
export default function Examples() {
  redirect("/#examples");
}
