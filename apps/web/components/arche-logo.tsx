import Image from "next/image";

/**
 * Arche brand mark. The AR monogram ships as two raster assets:
 * black for light surfaces, white for dark surfaces. The `.dark`
 * class on <html> (see @custom-variant in globals.css) picks which
 * one is visible, so the mark always contrasts with the theme.
 */
export function ArcheLogo({ size = 30 }: { size?: number }) {
  const style = { width: size, height: size } as const;
  return (
    <span className="inline-flex shrink-0 items-center" style={style} aria-hidden="true">
      <Image
        src="/arche_logo.png"
        alt=""
        width={128}
        height={128}
        style={style}
        className="block dark:hidden"
      />
      <Image
        src="/arche_logo.png"
        alt=""
        width={128}
        height={128}
        style={style}
        className="hidden dark:block"
      />
    </span>
  );
}
