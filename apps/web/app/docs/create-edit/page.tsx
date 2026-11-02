export default function CreateEdit() {
  return (
    <div>
      <h1 className="font-display text-3xl">Create / edit an identity</h1>
      <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed">
        <p>
          Dashboard → <strong>New Identity</strong> starts from the Arche Default payload. The editor
          generates its controls from the foundation data:
        </p>
        <ul className="flex flex-col gap-1">
          <li>· Token fields cover exactly the contract tokens, per mode (light/dark).</li>
          <li>· Knob controls offer exactly each manifest&apos;s legal values — an illegal value is unrepresentable.</li>
          <li>· The live preview re-skins installed components from the working payload.</li>
        </ul>
        <p>
          <strong>Save draft</strong> validates before storing. <strong>Publish</strong> runs the same
          gate plus emission and stores an immutable versioned snapshot.
        </p>
      </div>
    </div>
  );
}
