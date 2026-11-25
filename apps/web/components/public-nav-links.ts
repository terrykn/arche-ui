/**
 * Public site destinations. The marketing header and the dashboard's menu
 * both build their link lists from this, so the two can't drift apart.
 */
export const PUBLIC_NAV_LINKS: Array<{ href: string; label: string }> = [
  // Docs open on Configuration, the first page in the reading order.
  { href: "/docs/configuration", label: "Docs" },
  // Examples lives on the home page below the feature cards.
  { href: "/#examples", label: "Examples" },
  { href: "/pricing", label: "Pricing" },
];
