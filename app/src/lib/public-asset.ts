/**
 * Prepend NEXT_PUBLIC_ASSET_PREFIX to a root-relative path that lives in
 * Next.js' /public/ folder (logos, product covers, etc.).
 *
 * assetPrefix in next.config only prefixes /_next/static/... — public
 * files keep their literal path like "/kw-logo.svg". When the static
 * export is served from a subpath (e.g. /wp-content/plugins/…/konfigurator/)
 * those paths 404. This helper stitches the prefix in at build time.
 */
export function publicAsset(path: string): string {
  if (!path) return path;
  // External or data/blob URL — leave alone.
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  const prefix = process.env.NEXT_PUBLIC_ASSET_PREFIX ?? "";
  if (!prefix) return path;
  return path.startsWith("/") ? `${prefix}${path}` : `${prefix}/${path}`;
}
