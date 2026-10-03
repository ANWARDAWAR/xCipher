import { describe, expect, it } from 'vitest';
import { withEditorialSchema, serializeJsonLd } from '@/lib/article-schema';
import { generateNewsArticleJsonLd, siteConfig } from '@/lib/seo';
import { sanitizeArticleHtml } from '@/lib/sanitize';

const base = { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: 'A guide' };
const attr = (value: unknown) => JSON.stringify(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const faq = `<div data-type="faq-block" data-items="${attr([{ question: 'What is HDR?', answer: 'High dynamic range.' }])}"><h2>What is HDR?</h2><p>High dynamic range.</p></div>`;
const howTo = `<div data-type="howto-block" data-config="${attr({ title: 'Enable HDR', steps: [{ name: 'Settings', text: 'Open settings.' }, { text: 'Enable HDR.' }] })}"><h2>Enable HDR</h2><h3>Settings</h3><p>Open settings.</p><p>Enable HDR.</p></div>`;

describe('conditional editorial schemas', () => {
  it('preserves ordinary article metadata without optional blocks', () => {
    expect(withEditorialSchema(base, '<p>A normal article.</p>')).toEqual(base);
  });

  it('emits FAQPage and ordered HowTo steps alongside the article after sanitization', () => {
    expect(withEditorialSchema(base, sanitizeArticleHtml(faq + howTo))).toEqual({
      '@context': 'https://schema.org',
      '@graph': [base, {
        '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'What is HDR?', acceptedAnswer: { '@type': 'Answer', text: 'High dynamic range.' } }],
      }, {
        '@type': 'HowTo', name: 'Enable HDR', step: [
          { '@type': 'HowToStep', position: 1, name: 'Settings', text: 'Open settings.' },
          { '@type': 'HowToStep', position: 2, text: 'Enable HDR.' },
        ],
      }],
    });
  });

  it.each([
    '<div data-type="faq-block" data-items="invalid"></div>',
    `<div data-type="faq-block" data-items="${attr([{ question: 'Hidden?', answer: 'Hidden answer.' }])}"></div>`,
    '<div data-type="howto-block" data-config="{}"><p>Incomplete</p></div>',
  ])('ignores malformed, incomplete, or invisible block data', html => {
    expect(withEditorialSchema(base, html)).toEqual(base);
  });

  it('preserves review metadata when FAQ blocks are also present', () => {
    const verdict = `<div data-type="editorial-block" data-editorial-block="${attr({ kind: 'verdict', product: 'Phone', score: 8, summary: 'Good battery.', badge: 'Recommended' })}"></div>`;
    expect(withEditorialSchema(base, verdict + faq)).toMatchObject({
      '@graph': [{ '@type': 'TechArticle', mainEntity: { '@type': 'Product', name: 'Phone' } }, { '@type': 'FAQPage' }],
    });
    expect(serializeJsonLd({ text: '</script>' })).not.toContain('<');
  });

  it('always includes an absolute publisher logo in NewsArticle metadata', () => {
    const schema = generateNewsArticleJsonLd({ title: 'News', slug: 'news', createdAt: '2026-10-01', updatedAt: '2026-10-01' });
    expect(new URL(siteConfig.logoUrl).protocol).toMatch(/^https?:$/);
    expect(schema.publisher.logo?.url).toBe(siteConfig.logoUrl);
    expect(new URL(siteConfig.logoUrl).pathname).toBe('/xsypher-logo-full.png');
  });
});
