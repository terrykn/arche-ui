"use client";

import * as React from "react";
import Link from "next/link";
import { ProtoAurora, ProtoNav, ProtoFooter } from "@/components/proto-shell";

const TIERS = [
  {
    id: "free",
    name: "Free",
    monthly: "$0",
    blurb: "Perfect for getting started.",
    features: ["Create 1 library", "Up to 1,000 components", "Basic AI features", "Community support"],
    cta: "Get Started",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    monthly: "$19",
    yearly: "$15",
    blurb: "For serious builders.",
    features: ["Unlimited libraries", "All components", "Advanced AI features", "Priority support"],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthly: "Custom",
    blurb: "For your organization.",
    features: [
      "Dedicated infrastructure",
      "Custom integrations",
      "SLA & support",
      "Contact sales",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingPage() {
  const [yearly, setYearly] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  return (
    <div className="proto-root">
      <ProtoAurora />
      <ProtoNav />
      <div className="proto-view">
        <div className="proto-wrap">
          <section className="proto-section">
            <h2>Simple, transparent pricing</h2>
            <p className="proto-lede">Start for free. Upgrade anytime.</p>
            <p className="proto-help-banner" role="note">
              Arche is a working prototype: there is no billing yet, so everything below is free.
              Paid tiers will appear here when billing ships.
            </p>
        <div className="proto-billing" role="group" aria-label="Billing period">
          <button
            type="button"
            className={yearly ? "" : "active"}
            aria-pressed={!yearly}
            onClick={() => setYearly(false)}
          >
            Monthly
          </button>
          <button
            type="button"
            className={yearly ? "active" : ""}
            aria-pressed={yearly}
            onClick={() => setYearly(true)}
          >
            Yearly<span className="proto-save-tag">Save 20%</span>
          </button>
        </div>
        <div className="proto-tiers">
          {TIERS.map((tier) => (
            <article key={tier.id} className={`proto-card proto-tier${tier.popular ? " popular" : ""}`}>
              {tier.popular ? <span className="proto-pop-tag">Most Popular</span> : null}
              <h2>{tier.name}</h2>
              <p className="proto-tier-price">
                {tier.id === "pro" && yearly ? tier.yearly : tier.monthly}
                {tier.monthly.startsWith("$") ? (
                  <span style={{ fontSize: 15, fontWeight: 500 }}> /month</span>
                ) : null}
              </p>
              <p className="proto-sub">{tier.blurb}</p>
              <ul>
                {tier.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <div style={{ marginTop: 22 }}>
                {tier.id === "enterprise" ? (
                  <button
                    type="button"
                    className="proto-btn proto-btn-ghost"
                    onClick={() => setToast("Sales form is a placeholder in this prototype")}
                  >
                    {tier.cta}
                  </button>
                ) : (
                  <Link
                    href="/sign-up"
                    className={`proto-btn ${tier.popular ? "proto-btn-dark" : "proto-btn-ghost"}`}
                  >
                    {tier.cta}
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
          </section>
        </div>
      </div>
      <ProtoFooter />
      {toast ? (
        <div className="proto-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
