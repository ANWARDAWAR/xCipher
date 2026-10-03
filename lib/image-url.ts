const TRANSFORM_PATH = "/cdn-cgi/image/";

/**
 * Routes public R2 images through Cloudflare Image Transformations.
 * Non-HTTP sources (for example blob previews) remain unchanged.
 */
export function optimizeImageUrl(src: string, width: number): string {
  if (!src || !/^https?:\/\//i.test(src)) return src;

  try {
    const url = new URL(src);
    const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE;
    if (!publicBase || new URL(publicBase).origin !== url.origin) return src;
    if (url.pathname.startsWith(TRANSFORM_PATH)) return src;

    const options = `width=${Math.max(1, Math.round(width))},format=auto,quality=82`;
    const path = `${TRANSFORM_PATH}${options}${url.pathname}`;
    return `${url.origin}${path}${url.search}`;
  } catch {
    return src;
  }
}
