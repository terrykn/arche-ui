/**
 * Home-hero prompt handoff: the hero pill input saves the visitor's phrase in
 * a short-lived cookie before sending them to sign-up. Auth consumes the
 * cookie (and deletes it) so the AI generate form opens prefilled.
 */
export const HERO_PROMPT_COOKIE = "arche-hero-prompt";
export const HERO_PROMPT_MAX_AGE_SECONDS = 900;
export const HERO_PROMPT_MAX_LENGTH = 500;
/** Shared cap for generation phrases: hero pill, dashboard dock, provider, logs. */
export const GENERATION_PROMPT_MAX_LENGTH = HERO_PROMPT_MAX_LENGTH;

export function sanitizeHeroPrompt(raw: string): string | null {
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    // Not percent-encoded — use as-is.
  }
  value = value.trim().slice(0, HERO_PROMPT_MAX_LENGTH);
  return value ? value : null;
}

export function newIdentityHref(prompt: string): string {
  return `/dashboard?prompt=${encodeURIComponent(prompt)}`;
}
