/** Resolve a file from public/ under Vite's active deployment base path. */
export function siteAssetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}
