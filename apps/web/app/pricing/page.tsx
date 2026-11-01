import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { PLANS } from "@/lib/plans";

export default function PricingPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-4xl">Pricing</h1>
        <p className="mt-2 text-muted-foreground">
          Creating an identity is a one-time purchase; applying it across seats is a subscription.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-border bg-card p-6 text-card-foreground">
              <h2 className="font-medium">{plan.name}</h2>
              <p className="mt-3 text-sm text-muted-foreground">Create</p>
              <p className="font-display text-3xl">
                {plan.create} <span className="text-sm font-normal">{plan.createNote}</span>
              </p>
              <p className="mt-3 text-sm text-muted-foreground">Apply</p>
              <p className="font-display text-3xl">
                {plan.apply} <span className="text-sm font-normal">{plan.applyNote}</span>
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{plan.blurb}</p>
              <ul className="mt-3 flex flex-col gap-1 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature}>· {feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          No checkout in this preview — <Link href="/sign-up" className="underline">create an account</Link> to start.
        </p>
      </main>
    </>
  );
}
