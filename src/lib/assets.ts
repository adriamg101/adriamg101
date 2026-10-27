// Resolves an asset path from content JSON (e.g. skills.json `icon`, entry `image`)
// against the Vite base, so `/icons/x.svg` and `icons/x.svg` both work when the site
// is served from a sub-path such as /adriamg101/. Absolute URLs and data: URIs pass through.
export function resolveAsset(path: string, base: string = import.meta.env.BASE_URL): string {
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(path)) return path
  const b = base.endsWith('/') ? base : `${base}/`
  return b + path.replace(/^(\.?\/)+/, '')
}
