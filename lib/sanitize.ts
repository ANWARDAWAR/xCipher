import DOMPurify from 'isomorphic-dompurify';
import { isAllowedEmbedSrc } from './embeds';

export const ALLOWED_MEDIA_DOMAINS = [
  "images.pexels.com",
  "images.unsplash.com",
  "plus.unsplash.com",
  "avatars.githubusercontent.com",
  "lh3.googleusercontent.com",
  "upload.wikimedia.org"
];

// Reusable configurations
const ARTICLE_DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
    'b', 'i', 'u', 'strong', 'em', 
    'a', 'img', 'ul', 'ol', 'li', 'blockquote', 
    'code', 'pre', 'br', 'hr', 'span', 'div',
    'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'aside',
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
    // iframe geometry and permissions. `allow` is restricted by the hook to a
    // fixed string; it is never taken from the input.
    'allow', 'allowfullscreen', 'frameborder', 'loading', 'width', 'height'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ['target'],
};

const BIO_DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'strong', 'em', 'a', 'p', 'br'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

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
