import Link from "next/link";
import type { Manifest } from "@arche-ui/registry-core";

/** Shared manifest-generated component reference (public + dashboard). */
export function ComponentIndex({ manifests }: { manifests: Manifest[] }) {
  const byCategory = new Map<string, Manifest[]>();
  for (const manifest of manifests) {
    const list = byCategory.get(manifest.category) ?? [];
    list.push(manifest);
    byCategory.set(manifest.category, list);
  }
  return (
    <div className="flex flex-col gap-8">
      {[...byCategory.entries()].map(([category, items]) => (
        <section key={category}>
          <h2 className="font-display text-xl capitalize">{category}</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {items.map((manifest) => (
              <li key={manifest.name} className="rounded-lg border-(length:--border-width) border-border bg-card p-4 text-card-foreground">
                <Link href={`/components/${manifest.name}`} className="font-medium underline-offset-4 hover:underline">
                  {manifest.title}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">{manifest.description}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function ComponentDetail({ manifest }: { manifest: Manifest }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground capitalize">{manifest.category}</p>
        <h1 className="font-display text-4xl">{manifest.title}</h1>
        <p className="mt-2 text-muted-foreground">{manifest.description}</p>
      </div>
      <section>
        <h2 className="text-lg font-medium">Variant axes</h2>
        <div className="mt-2 flex flex-col gap-2 text-sm">
          {Object.entries(manifest.axes).map(([axis, def]) => (
            <p key={axis}>
              <code>{axis}</code>: {def.values.map(String).join(" · ")} (default: <code>{String(def.default)}</code>)
            </p>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-lg font-medium">Style surface</h2>
        <div className="mt-2 flex flex-col gap-3 text-sm">              {Object.entries(manifest.styleSurface).map(([slot, knobs]) => {
                const entries = Object.entries(knobs as Record<string, { type: string; values?: Array<string | number>; value?: string; scale?: string[]; default: unknown }>);
                return (
            <div key={slot}>
              <p className="font-medium">{slot}</p>
              <ul className="mt-1 flex flex-col gap-1 text-muted-foreground">
                {entries.map(([knob, spec]) => (
                  <li key={knob}>
                    <code>{knob}</code> ({String(spec.type)}):{" "}
                    {spec.values ? spec.values.map(String).join(" · ") : ""}
                    {spec.value ? `fixed ${String(spec.value)}` : ""}
                    {spec.scale ? ` @ ${spec.scale.join(" · ")}` : ""}
                    {" "}(default: <code>{String(spec.default)}</code>)
                  </li>
                ))}
              </ul>
            </div>
                );
              })}
        </div>
      </section>
      <section>
        <h2 className="text-lg font-medium">Tokens used</h2>
        <p className="mt-2 text-sm text-muted-foreground">{manifest.tokensUsed.join(", ")}</p>
      </section>
      <section>
        <h2 className="text-lg font-medium">Behavior source</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {manifest.primitive
            ? `${manifest.primitive.package}. Parts: ${manifest.primitive.parts.join(", ")}. All props inherited.`
            : `native <${manifest.native?.element}> element`}
        </p>
      </section>
      {manifest.standards ? (
      <section>
        <h2 className="text-lg font-medium">Standards</h2>
        <p className="mt-2 text-sm text-muted-foreground">{manifest.standards.purpose}</p>
        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <p className="font-medium">Use when</p>
            <ul className="mt-1 text-muted-foreground">
              {manifest.standards.useWhen.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium">Do not use when</p>
            <ul className="mt-1 text-muted-foreground">
              {manifest.standards.doNotUseWhen.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </div>
        </div>
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {manifest.standards.rules.map((rule) => (
            <li key={rule.id}>
              <code>{rule.id}</code> [{rule.severity}]: {rule.check}
            </li>
          ))}
        </ul>
      </section>
      ) : null}
    </div>
  );
}
