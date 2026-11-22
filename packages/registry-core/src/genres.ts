/**
 * Genre blueprints (Brief #7, Deliverable 3) — page-type recipes as data.
 *
 * A genre selects an ordered block sequence with required / optional /
 * forbidden sets, variant preferences, and content rules. Blueprints are
 * consumed by the agent skill and by Studio alike; adding a genre is a data
 * entry here, never a code change. Nothing in this file touches the DOM, so
 * it is safe to bundle client-side.
 *
 * Every block named here comes from the aggregated catalog
 * (catalog-aggregate.json). Aggregated blocks ship fixed compositions without
 * variant axes, so the variant preferences below are guidance for hand edits
 * rather than inputs the selector can rank.
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
  /** Per-block variant guidance (prose, not code). */
  variantPreferences: Record<string, string>;
  /** Checkable content rules for the generation self-check. */
  contentRules: string[];
}

const APP_BLOCKS = ["sidebar-1", "charts-2", "table-03", "settings-3", "activity-3"];

const AUTH_BLOCKS = ["login-03", "signup-01"];

export const GENRE_BLUEPRINTS: Record<GenreId, GenreBlueprint> = {
  landing: {
    id: "landing",
    title: "Landing",
    description:
      "A marketing page that states one promise and routes visitors to one or two next steps.",
    sequence: [
      "navbar-floating",
      "hero-aurora",
      "logos-grid",
      "features-bento",
      "dusk-stats-1",
      "testimonials-grid",
      "pricing-three-tiers",
      "faq-accordion",
      "cta-split-image",
      "cta-newsletter",
      "footer-columns",
    ],
    required: ["navbar-floating", "hero-aurora", "footer-columns"],
    optional: [
      "logos-grid",
      "features-bento",
      "dusk-stats-1",
      "testimonials-grid",
      "pricing-three-tiers",
      "faq-accordion",
      "cta-split-image",
      "cta-newsletter",
    ],
    forbidden: [...APP_BLOCKS, ...AUTH_BLOCKS],
    variantPreferences: {
      "hero-aurora":
        "Media decides the shape: product imagery splits beside the headline; brand imagery sits below it; no media stays centered.",
      "features-bento":
        "Bento for expressive or media-rich stories; the icon grid stays the quiet default.",
      "pricing-three-tiers": "Keep the tiers the offer actually has; do not add a tier to fill the row.",
      "testimonials-grid": "Use the featured quote only when one customer story carries the page.",
    },
    contentRules: [
      "One h1 per page, carried by hero-aurora (blocks-one-h1-per-page).",
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
      "navbar-floating",
      "hero-globe",
      "features-tabs",
      "stats-01",
      "testimonials-featured",
      "pricing-comparison",
      "faq-two-column",
      "cta-split-image",
      "footer-columns",
    ],
    required: ["navbar-floating", "hero-globe", "footer-columns"],
    optional: [
      "features-tabs",
      "stats-01",
      "testimonials-featured",
      "pricing-comparison",
      "faq-two-column",
      "cta-split-image",
    ],
    forbidden: [...APP_BLOCKS, ...AUTH_BLOCKS, "logos-grid", "cta-newsletter"],
    variantPreferences: {
      "hero-globe": "Split beside product media whenever media exists; left-aligned for technical audiences.",
      "features-tabs": "Tabbed tour for feature-by-feature comparisons.",
      "pricing-comparison": "Comparison table once there are more than three plans.",
      "testimonials-featured": "A single flagship customer story beats a wall of short quotes.",
    },
    contentRules: [
      "One h1 per page, carried by hero-globe (blocks-one-h1-per-page).",
      "Every claimed number appears in stats-01, never only in prose.",
      "Screenshots or product media preferred over stock imagery.",
    ],
  },
  auth: {
    id: "auth",
    title: "Auth",
    description: "A sign-in or sign-up page: one form, one decision, no distractions.",
    sequence: ["navbar-floating", "login-03", "signup-01", "footer-columns"],
    required: ["login-03"],
    optional: ["navbar-floating", "signup-01", "footer-columns"],
    forbidden: [
      "hero-aurora",
      "logos-grid",
      "features-bento",
      "dusk-stats-1",
      "testimonials-grid",
      "pricing-three-tiers",
      "faq-accordion",
      "cta-split-image",
      "cta-newsletter",
      ...APP_BLOCKS,
    ],
    variantPreferences: {
      "login-03": "Single centered form; no marketing blocks compete with it.",
      "signup-01": "Mirrors the login surface so the two pages feel like one flow.",
    },
    contentRules: [
      "Exactly one of login-03 / signup-01 is primary per page; the other may link to it.",
      "No hero, pricing, or testimonials on the auth page itself.",
      "Every field carries a real label and an inline error state.",
    ],
  },
  dashboard: {
    id: "dashboard",
    title: "Dashboard",
    description: "An application surface: navigation shell plus operational content.",
    sequence: [
      "sidebar-1",
      "charts-2",
      "stats-03",
      "table-03",
      "activity-3",
      "settings-3",
      "empty-states-1",
    ],
    required: ["sidebar-1"],
    optional: [
      "charts-2",
      "stats-03",
      "table-03",
      "activity-3",
      "settings-3",
      "empty-states-1",
    ],
    forbidden: [
      "navbar-floating",
      "hero-aurora",
      "hero-globe",
      "logos-grid",
      "features-bento",
      "features-tabs",
      "dusk-stats-1",
      "testimonials-grid",
      "testimonials-featured",
      "pricing-three-tiers",
      "pricing-comparison",
      "faq-accordion",
      "faq-two-column",
      "cta-split-image",
      "cta-newsletter",
      "footer-columns",
      ...AUTH_BLOCKS,
    ],
    variantPreferences: {
      "sidebar-1": "Collapsible sidebar for dense operational tools; fixed for simple ones.",
      "stats-03": "Four columns for full overviews; three when the page answers one question.",
      "empty-states-1": "First-run and zero-data states ship with the page, not as an afterthought.",
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
