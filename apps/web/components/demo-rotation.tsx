import { getDemoFixtures } from "@/lib/fixtures";
import { IdentityDemo } from "./identity-demo";

/** Server wrapper: fixtures load server-side, rotation runs client-side. */
export function DemoRotation() {
  const fixtures = getDemoFixtures().map(({ key, prompt, payload }) => ({
    key,
    prompt,
    tokens: payload.tokens,
  }));
  return <IdentityDemo fixtures={fixtures} />;
}
