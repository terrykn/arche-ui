import { ProtoAurora, ProtoNav, ProtoFooter } from "@/components/proto-shell";
import { SinkCarousel } from "@/components/kitchen-sink";

/**
 * Examples: the kitchen sink, one demo per screen.
 * Same pager carousel as the dashboard identities list.
 */
export default function Examples() {
  return (
    <div className="proto-root">
      <ProtoAurora />
      <ProtoNav />
      <div className="proto-view">
        <div className="proto-wrap">
          <section className="proto-section">
            <h2>Examples</h2>
            <div className="pt-6">
              <SinkCarousel />
            </div>
          </section>
        </div>
      </div>
      <ProtoFooter />
    </div>
  );
}
