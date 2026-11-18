import { ProtoAurora, ProtoNav, ProtoFooter } from "@/components/proto-shell";

export default function PricingPage() {
  return (
    <div className="proto-root flex min-h-screen flex-col">
      <ProtoAurora />
      <ProtoNav />
      <div className="proto-view flex-1">
        <div className="proto-wrap">
          <section className="proto-section">
            <h2>Pricing</h2>
            <p className="proto-lede">Coming soon! Enjoy the free features for now.</p>
          </section>
        </div>
      </div>
      <ProtoFooter />
    </div>
  );
}
