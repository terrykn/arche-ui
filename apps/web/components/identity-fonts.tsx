import { identityFontStylesheetUrls } from "@arche-ui/foundation/font-data";
import type { FontSelection } from "@arche-ui/foundation/fonts";

/**
 * Loads the official Fontshare stylesheets for an identity's font selection.
 * Google selections are intentionally omitted here: every Google registry
 * family is statically loaded through next/font/google in the root layout.
 */
export function IdentityFontLinks({ fonts }: { fonts: FontSelection }) {
  return (
    <>
      {identityFontStylesheetUrls(fonts).map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence="default" />
      ))}
    </>
  );
}
