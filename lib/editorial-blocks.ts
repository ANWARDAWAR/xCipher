import { z } from 'zod';

export function safeWebUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}

export function socialPost(value: string): { provider: 'x' | 'tiktok'; id: string; url: string } | null {
  if (!safeWebUrl(value)) return null;
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'].includes(host)) {
    const match = /^\/(?:[\w]+\/)?status\/(\d+)\/?$/.exec(url.pathname);
    if (match) return { provider: 'x', id: match[1], url: `https://x.com${url.pathname}` };
  }
  if (['tiktok.com', 'www.tiktok.com'].includes(host)) {
    const match = /\/video\/(\d+)/.exec(url.pathname) || /\/player\/v1\/(\d+)/.exec(url.pathname);
    if (match) return { provider: 'tiktok', id: match[1], url: `https://www.tiktok.com${url.pathname}` };
  }
  return null;
}

const text = z.string().trim().max(2000);
const required = text.min(1, 'This field is required');
const url = text.refine(safeWebUrl, 'Enter a complete http or https URL');
const optionalUrl = z.union([z.literal(''), url]);
const photo = z.object({ src: url, alt: required, caption: text, credit: text });

export const editorialBlockSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('affiliate'), product: required, disclosure: required, offers: z.array(z.object({ retailer: required, price: required, url, logo: optionalUrl })).min(1).max(12) }),
  z.object({ kind: z.literal('slider'), title: required, before: photo, after: photo, beforeLabel: required, afterLabel: required }),
  z.object({ kind: z.literal('gallery'), title: text, layout: z.enum(['two', 'three', 'masonry']), images: z.array(photo).min(2, 'Add at least two images').max(24) }),
  z.object({
    kind: z.literal('social'),
    url: url.refine(value => socialPost(value) !== null, 'Use a full X post or TikTok video URL'),
    caption: text,
    provider: z.enum(['x', 'tiktok']).optional(),
    postId: z.string().regex(/^\d+$/).optional(),
  }),
  z.object({ kind: z.literal('verdict'), product: required, score: z.number().min(0).max(10), summary: required, badge: z.enum(['Final verdict', "Editor’s choice", 'Recommended', 'Best value']) }),
  z.object({ 
    kind: z.literal('comparison'), 
    title: z.string().optional(), 
    first: z.string().optional(), 
    second: z.string().optional(), 
    firstImage: photo.optional(),
    secondImage: photo.optional(),
    firstLink: optionalUrl.optional(),
    secondLink: optionalUrl.optional(),
    rows: z.array(z.object({ 
      category: z.string().optional(), 
      spec: z.string().optional(), 
      firstValue: z.string().optional(), 
      secondValue: z.string().optional(),
      first: z.string().optional(), 
      second: z.string().optional(), 
      winner: z.enum(['none', 'first', 'second']).optional() 
    })).optional() 
  }),
  z.object({ kind: z.literal('toc'), title: required }),
]);

export type EditorialBlock = z.infer<typeof editorialBlockSchema>;
export type BlockKind = EditorialBlock['kind'];
export const BLOCK_LABELS: Record<BlockKind, string> = {
  affiliate: 'Where to buy', slider: 'Camera comparison', gallery: 'Image gallery', social: 'X / TikTok post', verdict: 'Final verdict', comparison: 'Device comparison', toc: 'Table of contents',
};
export function newEditorialBlock(kind: BlockKind): EditorialBlock {
  const emptyPhoto = { src: '', alt: '', caption: '', credit: '' };
  switch (kind) {
    case 'affiliate': return { kind, product: '', disclosure: 'We may earn a commission when you buy through our links. Prices can change.', offers: [{ retailer: '', price: '', url: '', logo: '' }] };
    case 'slider': return { kind, title: 'Camera comparison', before: { ...emptyPhoto }, after: { ...emptyPhoto }, beforeLabel: 'Device A', afterLabel: 'Device B' };
    case 'gallery': return { kind, title: '', layout: 'two', images: [{ ...emptyPhoto }, { ...emptyPhoto }] };
    case 'social': return { kind, url: '', caption: '', provider: undefined, postId: undefined };
    case 'verdict': return { kind, product: '', score: 8, summary: '', badge: 'Final verdict' };
    case 'comparison': return { kind, title: 'Head to head', first: 'Device A', second: 'Device B', firstImage: { ...emptyPhoto }, secondImage: { ...emptyPhoto }, firstLink: '', secondLink: '', rows: [] };
    case 'toc': return { kind, title: 'In this article' };
  }
}

export function parseEditorialBlock(raw: unknown): EditorialBlock | null {
  try {
    const result = editorialBlockSchema.safeParse(typeof raw === 'string' ? JSON.parse(raw) : raw);
    return result.success ? result.data : null;
  } catch { return null; }
}
