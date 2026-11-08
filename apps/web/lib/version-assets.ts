// Keep in sync with ASSETS_BUCKET in ./specimen-assets (no import: that module
// pulls in puppeteer-core, which must never enter a client bundle).
const ASSETS_BUCKET = "identity-assets";

/** Deterministic public URLs for a version's capture assets. Server-safe. */
export function versionAssetUrls(
  libraryId: string,
  version: number,
): {
  sinkLight: string;
  sinkDark: string;
  og: string;
} | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const prefix = `${base}/storage/v1/object/public/${ASSETS_BUCKET}/${libraryId}/v${version}`;
  return {
    sinkLight: `${prefix}/sink-light.png`,
    sinkDark: `${prefix}/sink-dark.png`,
    og: `${prefix}/og.png`,
  };
}
