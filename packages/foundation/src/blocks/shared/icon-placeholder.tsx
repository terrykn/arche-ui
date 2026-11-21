import * as React from "react";
import * as Lucide from "lucide-react";

export interface IconPlaceholderProps extends React.SVGProps<SVGSVGElement> {
  lucide?: string;
  tabler?: string;
  hugeicons?: string;
  phosphor?: string;
  remixicon?: string;
}

// Demo icon used by imported application blocks. The source catalogs reference
// a multi-library dynamic icon; this port resolves the lucide name against
// lucide-react and falls back to a dashed square for the other libraries.
const icons = Lucide as unknown as Record<string, React.ComponentType<{ className?: string }>>;

export function IconPlaceholder({
  lucide,
  tabler: _tabler,
  hugeicons: _hugeicons,
  phosphor: _phosphor,
  remixicon: _remixicon,
  className,
  ...props
}: IconPlaceholderProps) {
  const exact = lucide ? icons[lucide] : undefined;
  const suffixed = lucide && !lucide.endsWith("Icon") ? icons[`${lucide}Icon`] : undefined;
  const Cmp = exact ?? suffixed ?? Lucide.SquareDashed;
  return <Cmp className={className} {...props} />;
}
