/**
 * Genre blueprints (Brief #7, Deliverable 3) — page-type recipes as data.
 *
 * A genre selects an ordered block sequence with required / optional /
 * forbidden sets, variant preferences, and content rules. Blueprints are
 * consumed by the agent skill and by Studio alike; adding a genre is a data
 * entry here, never a code change. Nothing in this file touches the DOM, so
 * it is safe to bundle client-side.
 */

export type GenreId = "landing" | "product" | "auth" | "dashboard";

export interface GenreBlueprint {
  id: GenreId;
  title: string;
  description: string;
  /** Ordered block sequence for a page of this genre. */
  sequence: string[];
  /** Must appear on every page of this genre (subset of sequence). */
  required: string[];
  /** May appear, in sequence order (subset of sequence). */
  optional: string[];
  /** Must never appear on a page of this genre. */
  forbidden: string[];
  /** Per-block variant guidance for the selector (prose, not code). */
  variantPreferences: Record<string, string>;
  /** Checkable content rules for the generation self-check. */
  contentRules: string[];
}

const MARKETING_APP_BLOCKS = [
  "app-shell",
  "dashboard-home",
  "data-table-page",
  "settings-page",
  "activity-feed",
];

const AUTH_BLOCKS = ["auth-login", "auth-signup"];

export const GENRE_BLUEPRINTS: Record<GenreId, GenreBlueprint> = {
  landing: {
    id: "landing",
    title: "Landing",
    description:
      "A marketing page that states one promise and routes visitors to one or two next steps.",
    sequence: [
      "site-header",
      "hero",
      "logo-cloud",
      "features",
      "stats-band",
      "testimonials",
      "pricing",
      "faq",
      "cta",
      "newsletter-signup",
      "site-footer",
    ],
    required: ["site-header", "hero", "site-footer"],
    optional: [
      "logo-cloud",
      "features",
      "stats-band",
      "testimonials",
      "pricing",
      "faq",
      "cta",
      "newsletter-signup",
    ],
    forbidden: [...MARKETING_APP_BLOCKS, ...AUTH_BLOCKS],
    variantPreferences: {
      hero: "Media decides the shape: product imagery splits beside the headline; brand imagery sits below it; no media stays centered. Enterprise and formal voices align left.",
      features:
        "Bento for expressive or media-rich stories; split for technical comparisons; grid stays the quiet default.",
      pricing: "Tier count follows the offer: simple offers show two, full lines show four, the default shows three.",
      testimonials: "A single featured quote for premium voices; the grid otherwise.",
    },
    contentRules: [
      "One h1 per page, carried by the hero (blocks-one-h1-per-page).",
      "At most one primary call-to-action in the hero (hero-one-primary-cta).",
      "Headline states the promise in 11 words or fewer.",
      "No email sign-up as the page's closing section by default.",
    ],
  },
  product: {
    id: "product",
    title: "Product",
    description:
      "A product page that proves the thing works: promise, proof, numbers, price.",
    sequence: [
      "site-header",
      "hero",
      "features",
      "stats-row",
      "testimonials",
      "pricing",
      "faq",
      "cta",
      "site-footer",
    ],
    required: ["site-header", "hero", "site-footer"],
    optional: ["features", "stats-row", "testimonials", "pricing", "faq", "cta"],
    forbidden: [...MARKETING_APP_BLOCKS, ...AUTH_BLOCKS, "logo-cloud", "newsletter-signup"],
    variantPreferences: {
      hero: "Split beside product media whenever media exists; left-aligned for technical audiences.",
      features: "Split for feature-by-feature comparisons; bento when the product is visual.",
      pricing: "Four tiers when the line is enterprise; two when the offer is a single plan plus trial.",
      testimonials: "Grid of short proof quotes; single only for a flagship customer story.",
    },
    contentRules: [
      "One h1 per page, carried by the hero (blocks-one-h1-per-page).",
      "Every claimed number appears in stats-row or stats-band, never only in prose.",
      "Screenshots or product media preferred over stock imagery.",
    ],
  },
  auth: {
    id: "auth",
    title: "Auth",
    description: "A sign-in or sign-up page: one form, one decision, no distractions.",
    sequence: ["site-header", "auth-login", "auth-signup", "site-footer"],
    required: ["auth-login"],
    optional: ["site-header", "auth-signup", "site-footer"],
    forbidden: [
      "hero",
      "logo-cloud",
      "features",
      "stats-band",
      "testimonials",
      "pricing",
      "faq",
      "cta",
      "newsletter-signup",
      ...MARKETING_APP_BLOCKS,
    ],
    variantPreferences: {
      "auth-login": "Single centered form; no marketing blocks compete with it.",
      "auth-signup": "Mirrors the login surface so the two pages feel like one flow.",
    },
    contentRules: [
      "Exactly one of auth-login / auth-signup is primary per page; the other may link to it.",
      "No hero, pricing, or testimonials on the auth page itself.",
      "Every field carries a real label and an inline error state.",
    ],
  },
  dashboard: {
    id: "dashboard",
    title: "Dashboard",
    description: "An application surface: navigation shell plus operational content.",
    sequence: [
      "app-shell",
      "dashboard-home",
      "stats-row",
      "data-table-page",
      "activity-feed",
      "settings-page",
      "empty-state",
    ],
    required: ["app-shell"],
    optional: [
      "dashboard-home",
      "stats-row",
      "data-table-page",
      "activity-feed",
      "settings-page",
      "empty-state",
    ],
    forbidden: [
      "site-header",
      "hero",
      "logo-cloud",
      "features",
      "stats-band",
      "testimonials",
      "pricing",
      "faq",
      "cta",
      "newsletter-signup",
      "site-footer",
      ...AUTH_BLOCKS,
    ],
    variantPreferences: {
      "app-shell": "Collapsible sidebar for dense operational tools; fixed for simple ones.",
      "stats-row": "Four columns for full overviews; three when the page answers one question.",
      "empty-state": "First-run and zero-data states ship with the page, not as an afterthought.",
    },
    contentRules: [
      "No marketing hero inside application surfaces.",
      "Data tables always pair with an empty state.",
      "Destructive actions confirm before committing.",
    ],
  },
};

/** All four genre blueprints, in canonical order. */
export function getGenreBlueprints(): GenreBlueprint[] {
  return [GENRE_BLUEPRINTS.landing, GENRE_BLUEPRINTS.product, GENRE_BLUEPRINTS.auth, GENRE_BLUEPRINTS.dashboard];
}
