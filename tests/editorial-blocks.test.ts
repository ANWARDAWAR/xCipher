import { describe, expect, it } from 'vitest';
import {
  editorialBlockSchema,
  newEditorialBlock,
  parseEditorialBlock,
  socialPost,
} from '@/lib/editorial-blocks';

describe('affiliate editorial blocks', () => {
  it('creates an editable affiliate block with a disclosure and offer row', () => {
    const block = newEditorialBlock('affiliate');

    expect(block).toEqual({
      kind: 'affiliate',
      product: '',
      disclosure: expect.stringContaining('commission'),
      offers: [{ retailer: '', price: '', url: '', logo: '' }],
    });

    describe('social editorial blocks', () => {
      it('extracts X and TikTok embed IDs from supported URLs', () => {
        expect(socialPost('https://x.com/example/status/123456789')).toEqual({
          provider: 'x',
          id: '123456789',
          url: 'https://x.com/example/status/123456789',
        });
        expect(socialPost('https://www.tiktok.com/@creator/video/987654321')).toEqual({
          provider: 'tiktok',
          id: '987654321',
          url: 'https://www.tiktok.com/@creator/video/987654321',
        });
      });

      it('persists parsed social provider and post ID fields', () => {
        const result = parseEditorialBlock({
          kind: 'social',
          url: 'https://x.com/example/status/123456789',
          caption: 'A post',
          provider: 'x',
          postId: '123456789',
        });

        expect(result).toMatchObject({ kind: 'social', provider: 'x', postId: '123456789' });
      });
    });
  });

  it('accepts valid retailer offers and optional logo URLs', () => {
    const result = editorialBlockSchema.safeParse({
      kind: 'affiliate',
      product: 'Example Phone',
      disclosure: 'We may earn a commission from qualifying purchases.',
      offers: [{
        retailer: 'Example Store',
        price: '$799',
        url: 'https://store.example.test/example-phone',
        logo: 'https://store.example.test/logo.svg',
      }],
    });

    expect(result.success).toBe(true);
  });

  it('rejects unsafe retailer and logo URLs', () => {
    const block = {
      kind: 'affiliate',
      product: 'Example Phone',
      disclosure: 'We may earn a commission from qualifying purchases.',
      offers: [{
        retailer: 'Example Store',
        price: '$799',
        url: 'javascript:alert(1)',
        logo: 'data:image/svg+xml,<svg></svg>',
      }],
    };

    expect(parseEditorialBlock(block)).toBeNull();
  });
});
