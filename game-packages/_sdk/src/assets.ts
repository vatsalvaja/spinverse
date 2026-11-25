/**
 * URL of a file in the game's own `public/` folder, correct wherever the package is served from.
 *
 * Vite builds with `base: "./"`, so BASE_URL is relative and resolves against the game's entry HTML. Never write
 * a root-absolute path like "/art/x.webp" in a game: it would point at the host website instead of the package,
 * and the Package Builder rejects it in HTML and CSS files.
 *
 *   assetUrl("art/back.webp")  ->  "./art/back.webp"
 */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}
