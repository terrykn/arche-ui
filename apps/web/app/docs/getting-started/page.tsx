export default function GettingStarted() {
  return (
    <div>
      <h1 className="font-display text-3xl">Getting started</h1>
      <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed">
        <p>
          1. Browse the <a href="/identities" className="underline">identities gallery</a> and open a
          public identity&apos;s page for its install block.
        </p>
        <p>2. Point the stock shadcn CLI at the identity&apos;s registry URL (see Install an identity).</p>
        <p>
          3. To author your own library, <a href="/sign-up" className="underline">create an account</a>,
          open the dashboard, and create an identity — the editor only offers legal values.
        </p>
      </div>
    </div>
  );
}
