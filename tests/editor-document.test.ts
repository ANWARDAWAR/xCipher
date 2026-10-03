// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { EditorialBlock } from '@/components/editorial/extensions/EditorialBlock';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import { findText } from '@/lib/editor/find-text';
import { serializeJsonLd, withEditorialSchema } from '@/lib/article-schema';
import type { EditorialBlock as BlockData } from '@/lib/editorial-blocks';

const photo = { src: 'https://images.example.com/photo.jpg', alt: 'Camera sample', caption: 'Night mode', credit: 'Test photographer' };
const verdict: BlockData = { kind: 'verdict', product: 'Test phone', score: 8.5, summary: 'Excellent battery life.', badge: 'Recommended' };
const fixtures: BlockData[] = [
  verdict,
  { kind: 'affiliate', product: 'Test phone', disclosure: 'We may earn a commission.', offers: [{ retailer: 'Store', price: '$899', url: 'https://example.com/buy?ref=editor&product=phone', logo: '' }] },
  { kind: 'slider', title: 'Night photography', beforeLabel: 'Phone A', afterLabel: 'Phone B', before: photo, after: { ...photo, src: 'https://images.example.com/other.jpg' } },
  { kind: 'gallery', title: 'Camera samples', layout: 'masonry', images: [photo, { ...photo, alt: 'Second sample' }] },
  { kind: 'social', url: 'https://x.com/example/status/123456789', caption: 'An announcement' },
  { kind: 'comparison', title: 'Compare devices', first: 'Phone A', second: 'Phone B', rows: [{ category: 'Display', spec: 'Brightness', first: '1500 nits', second: '2000 nits', winner: 'second' }] },
  { kind: 'toc', title: 'In this review' },
];
const makeEditor = (content: string | JSONContent) => new Editor({ extensions: [StarterKit, EditorialBlock], content });

describe('publication block persistence', () => {
  it.each(fixtures.map(data => [data.kind, data] as const))('retains %s data through HTML sanitization and reopening', (_, data) => {
    const editor = makeEditor({ type: 'doc', content: [{ type: 'editorialBlock', attrs: { data } }] });
    const stored = sanitizeArticleHtml(editor.getHTML());
    expect(stored).toContain('data-editorial-block');
    const reopened = makeEditor(stored);
    expect(reopened.getJSON().content?.[0].attrs?.data).toEqual(data);
    expect(sanitizeArticleHtml(stored)).toEqual(stored);
    reopened.destroy(); editor.destroy();
  });
});

describe('find and replace positions', () => {
  it('finds text across inline formatting and replaces without losing unrelated formatting', () => {
    const editor = makeEditor('<p><strong>Camera</strong> testing and camera samples.</p>');
    const matches = findText(editor.state.doc, 'camera');
    expect(matches).toHaveLength(2);
    const transaction = editor.state.tr;
    [...matches].reverse().forEach(match => transaction.insertText('Lens', match.from, match.to));
    editor.view.dispatch(transaction);
    expect(editor.getHTML()).toBe('<p><strong>Lens</strong> testing and Lens samples.</p>');
    editor.destroy();
  });
  it('treats punctuation literally and preserves Unicode document positions', () => {
    const editor = makeEditor('<p>İstanbul camera (test) 😀 CAMERA</p>');
    expect(findText(editor.state.doc, '(test)')).toHaveLength(1);
    for (const match of findText(editor.state.doc, 'camera')) expect(editor.state.doc.textBetween(match.from, match.to).toLowerCase()).toBe('camera');
    expect(findText(editor.state.doc, 'camera', true)).toHaveLength(1);
    editor.destroy();
  });
});

describe('review structured data', () => {
  it('maps the visible verdict, pros/cons, and benchmark measurements to a product review', () => {
    const editor = makeEditor({ type: 'doc', content: [{ type: 'editorialBlock', attrs: { data: verdict } }] });
    const html = editor.getHTML() + '<div data-type="pros-cons-block" data-pros="[&quot;Great battery&quot;]" data-cons="[&quot;Expensive&quot;]"></div><div data-type="score-breakdown-block" data-items="[{&quot;metric&quot;:&quot;Camera&quot;,&quot;score&quot;:150}]"></div>';
    const schema = withEditorialSchema({ headline: 'Phone review', author: [{ '@type': 'Person', name: 'Editor' }], datePublished: '2026-10-02' }, sanitizeArticleHtml(html));
    expect(schema).toMatchObject({ '@type': 'TechArticle', mainEntity: { '@type': 'Product', name: 'Test phone', additionalProperty: [{ name: 'Camera', value: 150 }], review: { reviewRating: { ratingValue: 8.5, bestRating: 10 }, positiveNotes: { itemListElement: [{ name: 'Great battery' }] }, negativeNotes: { itemListElement: [{ name: 'Expensive' }] } } } });
    editor.destroy();
  });
  it('preserves news metadata and escapes script termination in JSON-LD', () => {
    expect(withEditorialSchema({ '@type': 'NewsArticle' }, '<p>News</p>')).toEqual({ '@type': 'NewsArticle' });
    expect(serializeJsonLd({ title: '</script><script>alert(1)</script>' })).not.toContain('<');
  });
});
