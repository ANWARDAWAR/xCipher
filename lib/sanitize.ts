import DOMPurify from 'isomorphic-dompurify';
import { isAllowedEmbedSrc } from './embeds';

// Hosts an <img src> may point at, enforced server-side on every article save,
// avatar change and publication setting.
//
// The two upload destinations are read from the environment rather than
// hardcoded, because the R2 public base is per-deployment and the Cloudinary
// cloud name is per-account. If they were literals here, an upload would
// succeed and then be silently stripped on save -- the exact failure this
// codebase already hit with <iframe> and <mark>.
function uploadHosts(): string[] {
  const hosts: string[] = [];

  const r2 = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE;
  if (r2) {
    try {
      hosts.push(new URL(r2).hostname);
    } catch {
      // A malformed base is a configuration error, not a reason to crash every
      // sanitize call. Uploads to it will fail the allow-list check visibly.
    }
  }

  // Cloudinary serves every account from one host.
  //
  // Keyed off the NEXT_PUBLIC_ variable specifically. This module is imported
  // by client components (InsertMediaDialog, ArticleEditor), and a server-only
  // variable is undefined in the browser bundle -- the client would then build
  // a shorter allow-list than the server and reject a URL the server would have
  // accepted. Both sides must read the same value or the two validators
  // disagree, which is worse than either being wrong alone.
  if (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    hosts.push("res.cloudinary.com");
  }

  return hosts;
}

export const ALLOWED_MEDIA_DOMAINS = [
  "images.pexels.com",
  "images.unsplash.com",
  "plus.unsplash.com",
  "avatars.githubusercontent.com",
  "lh3.googleusercontent.com",
  "upload.wikimedia.org",
  ...uploadHosts(),
];

// Reusable configurations
const ARTICLE_DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
    'b', 'i', 'u', 'strong', 'em', 
    'a', 'img', 'ul', 'ol', 'li', 'blockquote', 
    'code', 'pre', 'br', 'hr', 'span', 'div',
    'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'aside',
    // Highlight. The editor has offered this mark all along, but it was absent
    // here, so every highlight was silently dropped on save -- visible while
    // writing, gone once published.
    'mark', 's', 'strike', 'del', 'sup', 'sub',
    // Video embeds. Permitted only in the narrow sense enforced by the
    // afterSanitizeElements hook below, which drops any iframe whose src this
    // application did not generate. Allowing the tag here is necessary but not
    // by itself sufficient.
    'iframe'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'target', 'rel',
    'data-type', 'data-callout-type', 'data-credit', 'data-youtube-video', 'data-youtube-id',
    'colspan', 'rowspan', 'colwidth',
    // `style` is permitted only so text alignment survives: TextAlign renders
    // as style="text-align: center", and without this every alignment was
    // stripped on save. The afterSanitizeAttributes hook below rewrites the
    // attribute down to the single alignment declaration, so no other CSS --
    // position, background images, url() and so on -- can ride in with it.
    'style',
    // iframe geometry and permissions. `allow` is restricted by the hook to a
    // fixed string; it is never taken from the input.
    'allow', 'allowfullscreen', 'frameborder', 'loading', 'width', 'height'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ['target'],
};

// The biography now uses the same editor as an article, so this has to accept
// the same markup that editor can produce -- otherwise a heading or a list
// would be offered in the toolbar and then silently deleted on save, which is
// the failure this codebase has already hit twice.
//
// It is still narrower than the article config on purpose. A profile is a
// standing description of a person, not a story: no h1 (the page supplies its
// own), and no iframe, because there is no reason for an author bio to embed a
// video player and every reason not to widen that surface here.
const BIO_DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'mark', 's', 'strike', 'del', 'sup', 'sub',
    'h2', 'h3', 'h4',
    'a', 'img', 'ul', 'ol', 'li', 'blockquote',
    'code', 'pre', 'hr', 'span', 'div',
    'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'aside',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt', 'title', 'class',
    'data-type', 'data-callout-type', 'data-credit',
    'colspan', 'rowspan', 'colwidth',
    // Alignment only; the shared hook rewrites this down to a single
    // text-align declaration and discards anything else.
    'style',
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

/**
 * Reduce `style` to at most a single text-align declaration.
 *
 * The attribute is allowed purely so TextAlign round-trips. Everything else a
 * style attribute can carry -- positioning, url() references, custom properties
 * -- is discarded rather than trusted, so widening the allow-list for alignment
 * does not widen it for anything else.
 *
 * Shared by both sanitizers: the bio config allows `style` for the same reason
 * the article one does, and a second copy of this rule would be a second place
 * to get it wrong.
 */
function restrictStyleToAlignment(node: unknown): void {
  const el = node as {
    getAttribute?: (n: string) => string | null;
    setAttribute?: (n: string, v: string) => void;
    removeAttribute?: (n: string) => void;
  };
  if (typeof el?.getAttribute !== 'function') return;

  const style = el.getAttribute('style');
  if (style === null) return;

  const match = /(?:^|;)\s*text-align\s*:\s*(left|right|center|justify)\s*(?:;|$)/i.exec(style);
  if (match) {
    el.setAttribute?.('style', `text-align: ${match[1].toLowerCase()}`);
  } else {
    el.removeAttribute?.('style');
  }
}

/** Exactly the capabilities a video player needs, and nothing else. Set by us,
 *  never carried over from the input. */
const IFRAME_ALLOW = "accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture";

export function sanitizeArticleHtml(html: string | null | undefined): string {
  if (!html) return "";

  // Element-level pass: decide whether each iframe is allowed to exist at all.
  //
  // Attribute allow-listing cannot express "an iframe, but only pointing at our
  // own embed origin" -- ALLOWED_ATTR would happily keep a src pointing
  // anywhere. So the iframe is removed outright unless its src is one
  // youTubeEmbedSrc could have produced. An author can paste any markup they
  // like; only our own embeds survive it.
  DOMPurify.addHook('afterSanitizeElements', function (node) {
    // Duck-typed rather than `instanceof Element`: this runs under jsdom on the
    // server, where the DOM classes are not globals, and an instanceof check
    // throws a ReferenceError that would take down every article save.
    const el = node as unknown as {
      tagName?: string;
      getAttribute?: (n: string) => string | null;
      setAttribute?: (n: string, v: string) => void;
      removeAttribute?: (n: string) => void;
      remove?: () => void;
    };
    if (el?.tagName !== 'IFRAME' || typeof el.getAttribute !== 'function') return;

    if (!isAllowedEmbedSrc(el.getAttribute('src'))) {
      el.remove?.();
      return;
    }

    // Normalise the surviving iframe so its permissions come from us rather
    // than from whatever the document happened to carry.
    el.setAttribute?.('allow', IFRAME_ALLOW);
    el.setAttribute?.('allowfullscreen', '');
    el.setAttribute?.('loading', 'lazy');
    el.setAttribute?.('frameborder', '0');
    el.removeAttribute?.('srcdoc'); // never legitimate here
    el.removeAttribute?.('sandbox'); // ours to decide, not the document's
  });

  DOMPurify.addHook('afterSanitizeAttributes', restrictStyleToAlignment);

  // Custom hook to ensure all external links have target="_blank" and rel="noopener noreferrer"
  DOMPurify.addHook('afterSanitizeAttributes', function (node) {
    // Skip iframes: `target` is meaningless on them and the element hook has
    // already set their attributes deliberately. Duck-typed for the same
    // reason as above.
    if ((node as unknown as { tagName?: string })?.tagName === 'IFRAME') return;

    if ('target' in node) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });

  const sanitized = DOMPurify.sanitize(html, ARTICLE_DOMPURIFY_CONFIG);
  DOMPurify.removeHook('afterSanitizeAttributes');
  DOMPurify.removeHook('afterSanitizeElements');

  return sanitized as string;
}

export function sanitizeBioHtml(html: string | null | undefined): string {
  if (!html) return "";

  // Same alignment-only restriction as articles. The bio config allows `style`
  // so alignment survives; without this hook it would allow arbitrary CSS.
  DOMPurify.addHook('afterSanitizeAttributes', restrictStyleToAlignment);

  DOMPurify.addHook('afterSanitizeAttributes', function (node) {
    if ('target' in node) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });

  const sanitized = DOMPurify.sanitize(html, BIO_DOMPURIFY_CONFIG);
  DOMPurify.removeHook('afterSanitizeAttributes');
  
  return sanitized as string;
}

export function isValidSafeUrl(url: string, restrictToDomains?: string[]): boolean {
  if (!url || !url.trim()) return false;
  
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    
    if (restrictToDomains && restrictToDomains.length > 0) {
      return restrictToDomains.includes(parsed.hostname);
    }
    
    return true;
  } catch (e) {
    return false; // Invalid URL structure
  }
}
