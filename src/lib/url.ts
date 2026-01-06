/**
 * URL utility to construct paths with the correct base
 * Reads from ASTRO_BASE_PATH environment variable
 */

// Get base path from ASTRO_BASE_PATH environment variable, default to '/'
const BASE = import.meta.env.ASTRO_BASE_PATH || "/";

/**
 * Constructs a URL path with the base path prepended
 * @param path - The path to append to the base (with or without leading slash)
 * @returns Full path with base prepended
 *
 * @example
 * withBase('/games/maduro-survivors') // => '/maduro/games/maduro-survivors' (when ASTRO_BASE_PATH=/maduro)
 * withBase('/games/maduro-survivors') // => '/games/maduro-survivors' (when ASTRO_BASE_PATH not set)
 */
export function withBase(path: string): string {
  // Ensure path starts with /
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  // If base is just '/', return the path as-is
  if (BASE === "/") {
    return cleanPath;
  }

  // Remove trailing slash from base and combine
  const cleanBase = BASE.endsWith("/") ? BASE.slice(0, -1) : BASE;
  return `${cleanBase}${cleanPath}`;
}
