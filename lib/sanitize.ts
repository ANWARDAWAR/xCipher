import sanitizeHtml from 'sanitize-html';
import { isAllowedEmbedSrc } from './embeds';

// Hosts an <img src> may point at, enforced server-side on every article save,
// avatar change and publication setting.
function uploadHosts(): string[] {
  const hosts: string[] = [];

  const r2 = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE;
  if (r2) {
    try {
      hosts.push(new URL(r2).hostname);
    } catch {}
  }

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
  "res.cloudinary.com",
  ...uploadHosts(),
];

const IFRAME_ALLOW = "accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture";

function transformAlignStyle(tagName: string, attribs: Record<string, string>) {
  if (attribs.style) {
    const match = /(?:^|;)\s*text-align\s*:\s*(left|right|center|justify)\s*(?:;|$)/i.exec(attribs.style);
    if (match) {
      attribs.style = `text-align: ${match[1].toLowerCase()}`;
    } else {
      delete attribs.style;
    }
  }
  return { tagName, attribs };
}

function transformLink(tagName: string, attribs: Record<string, string>) {
  const res = transformAlignStyle(tagName, attribs);
  res.attribs.target = '_blank';
  res.attribs.rel = 'noopener noreferrer';
  return res;
}

const COMMON_ALLOWED_ATTRIBUTES = {
  '*': ['class', 'style', 'data-type', 'data-callout-type', 'data-credit', 'data-youtube-video', 'data-youtube-id', 'data-config', 'data-chart-type'],
  'a': ['href', 'target', 'rel', 'title'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  'th': ['colspan', 'rowspan', 'colwidth'],
  'td': ['colspan', 'rowspan', 'colwidth']
};

export function sanitizeArticleHtml(html: string | null | undefined): string {
  if (!html) return "";

  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
      'b', 'i', 'u', 'strong', 'em', 
      'a', 'img', 'ul', 'ol', 'li', 'blockquote', 
      'code', 'pre', 'br', 'hr', 'span', 'div',
      'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'aside',
      'mark', 's', 'strike', 'del', 'sup', 'sub',
      'iframe'
    ],
    allowedAttributes: {
      ...COMMON_ALLOWED_ATTRIBUTES,
      'iframe': ['src', 'allow', 'allowfullscreen', 'frameborder', 'loading', 'width', 'height']
    },
    allowedSchemesByTag: {
      '*': ['http', 'https', 'mailto', 'tel', 'callto', 'cid', 'xmpp', 'data']
    },
    exclusiveFilter: function(frame) {
      if (frame.tag === 'iframe') {
        if (!isAllowedEmbedSrc(frame.attribs.src)) return true; // remove it
      }
      return false;
    },
    transformTags: {
      '*': transformAlignStyle,
      'a': transformLink,
      'iframe': function(tagName, attribs) {
        const res = transformAlignStyle(tagName, attribs);
        res.attribs.allow = IFRAME_ALLOW;
        res.attribs.allowfullscreen = "";
        res.attribs.loading = "lazy";
        res.attribs.frameborder = "0";
        delete res.attribs.sandbox;
        delete res.attribs.srcdoc;
        return res;
      }
    }
  });
}

export function sanitizeBioHtml(html: string | null | undefined): string {
  if (!html) return "";

  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'mark', 's', 'strike', 'del', 'sup', 'sub',
      'h2', 'h3', 'h4',
      'a', 'img', 'ul', 'ol', 'li', 'blockquote',
      'code', 'pre', 'hr', 'span', 'div',
      'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'aside',
    ],
    allowedAttributes: COMMON_ALLOWED_ATTRIBUTES,
    allowedSchemesByTag: {
      '*': ['http', 'https', 'mailto']
    },
    transformTags: {
      '*': transformAlignStyle,
      'a': transformLink
    }
  });
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
