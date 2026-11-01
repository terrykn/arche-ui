/**
 * Pricing plan config (Brief #3 §8). Prices live here — never hard-coded in pages.
 * Per Addendum A1.4: tiers carry create (one-time) and apply (subscription) labels.
 * Display only in this brief — no checkout.
 */
export interface Plan {
  id: string;
  name: string;
  blurb: string;
  create: string;
  createNote: string;
  apply: string;
  applyNote: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    blurb: "Browse the gallery and install public identities.",
    create: "$0",
    createNote: "one-time",
    apply: "$0",
    applyNote: "per seat / month",
    features: ["Public gallery", "Install public identities", "Community docs"],
  },
  {
    id: "creator",
    name: "Creator",
    blurb: "Create identities, publish versions, keep libraries private.",
    create: "$12",
    createNote: "one-time",
    apply: "$0",
    applyNote: "per seat / month",
    features: ["Unlimited identities", "Private libraries", "Versioned snapshots", "Registry tokens"],
  },
  {
    id: "studio",
    name: "Studio",
    blurb: "Team applications, shared identities, priority serving.",
    create: "$12",
    createNote: "one-time, per identity",
    apply: "$29",
    applyNote: "per seat / month",
    features: ["Everything in Creator", "Shared applications", "Team roles", "Priority registry serving"],
  },
];
