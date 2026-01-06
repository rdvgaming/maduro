/**
 * URL utility to construct paths with the correct base
 * Automatically includes the base path from astro.config.mjs
 */

// Get base path from import.meta.env at build time
const BASE = import.meta.env.BASE_URL || '/';

/**
 * Constructs a URL path with the base path prepended
 * @param path - The path to append to the base (with or without leading slash)
 * @returns Full path with base prepended
 *
 * @example
 * withBase('/games/maduro-survivors') // => '/maduro/games/maduro-survivors' (on GitHub Pages)
 * withBase('/games/maduro-survivors') // => '/games/maduro-survivors' (locally)
 */
export function withBase(path: string): string {
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // If base is just '/', return the path as-is
  if (BASE === '/') {
    return cleanPath;
  }

  // Remove trailing slash from base and combine
  const cleanBase = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  return `${cleanBase}${cleanPath}`;
}
