import DOMPurify from 'isomorphic-dompurify';

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
    'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'aside'
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'data-type', 'data-callout-type', 'data-credit', 'colspan', 'rowspan', 'colwidth'],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ['target'],
};

const BIO_DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'strong', 'em', 'a', 'p', 'br'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

export function sanitizeArticleHtml(html: string | null | undefined): string {
  if (!html) return "";
  
  // Custom hook to ensure all external links have target="_blank" and rel="noopener noreferrer"
  DOMPurify.addHook('afterSanitizeAttributes', function (node) {
    if ('target' in node) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });

  const sanitized = DOMPurify.sanitize(html, ARTICLE_DOMPURIFY_CONFIG);
  DOMPurify.removeHook('afterSanitizeAttributes');
  
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
