import Image from "next/image";

/** Arche brand mark. The app is dark-only, so the white raster asset is used everywhere. */
export function ArcheLogo({ size = 30 }: { size?: number }) {
  const style = { width: size, height: size } as const;
  return (
    <span className="inline-flex shrink-0 items-center" style={style} aria-hidden="true">
      <Image src="/arche_white_logo.png" alt="" width={128} height={128} style={style} unoptimized />
    </span>
  );
}
