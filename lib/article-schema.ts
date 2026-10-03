import { htmlToDOM, type Element, type DOMNode } from 'html-react-parser';
import { parseEditorialBlock, type EditorialBlock } from './editorial-blocks';
import { z } from 'zod';

const schemaText = z.string().trim().min(1).max(10000);
const faqItems = z.array(z.object({ question: schemaText, answer: schemaText })).min(1).max(50);
const howToData = z.object({
  title: schemaText,
  steps: z.array(z.object({ name: schemaText.optional(), text: schemaText })).min(1).max(100),
});

// Parser dependencies can load separate Element constructors on the server.
// Discriminate by node type so saved blocks work across those module boundaries.
function isElement(node: DOMNode): node is Element {
  return node.type === 'tag' || node.type === 'script' || node.type === 'style';
}

function visibleText(nodes: DOMNode[]): string {
  return nodes.map(node => {
    if (node.type === 'text') return node.data;
    if (!isElement(node) || ['script', 'style', 'template'].includes(node.name)
      || 'hidden' in node.attribs || node.attribs['aria-hidden'] === 'true') return '';
    return visibleText(node.children as DOMNode[]);
  }).join(' ').replace(/\s+/g, ' ').trim();
}

/** Build structured data from the same saved HTML that readers see. */
export function withEditorialSchema(base: Record<string, unknown>, html: string | null | undefined): Record<string, unknown> {
  if (!html) return base;
  let verdict: Extract<EditorialBlock, { kind: 'verdict' }> | undefined;
  let technical = false;
  const pros: string[] = [];
  const cons: string[] = [];
  const benchmarks: { '@type': string; name: string; value: number | string }[] = [];
  const questions: Record<string, unknown>[] = [];
  const howTos: Record<string, unknown>[] = [];
  function strings(value: string | undefined): string[] {
    try { const parsed: unknown = JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string' && !!item.trim()).slice(0, 20) : []; }
    catch { return []; }
  }
  function visit(nodes: DOMNode[]) {
    for (const node of nodes) {
      if (!isElement(node)) continue;
      // Future blocks must save visible HTML plus these existing, allowed attributes:
      // faq-block: data-items=[{ question, answer }]
      // howto-block: data-config={ title, steps: [{ name?, text }] }
      // No schema is emitted for empty placeholders or data absent from the visible block.
      if (['faq-block', 'howto-block'].includes(node.attribs['data-type'])) {
        const renderedText = visibleText([node]);
        const contains = (value: string) => renderedText.includes(value.replace(/\s+/g, ' ').trim());
        try {
          if (node.attribs['data-type'] === 'faq-block') {
            const result = faqItems.safeParse(JSON.parse(node.attribs['data-items'] || 'null'));
            if (result.success && result.data.every(item => contains(item.question) && contains(item.answer))) {
              questions.push(...result.data.map(item => ({
                '@type': 'Question', name: item.question,
                acceptedAnswer: { '@type': 'Answer', text: item.answer },
              })));
            }
          } else {
            const result = howToData.safeParse(JSON.parse(node.attribs['data-config'] || 'null'));
            if (result.success && contains(result.data.title)
              && result.data.steps.every(step => contains(step.text) && (!step.name || contains(step.name)))) {
              howTos.push({
                '@type': 'HowTo', name: result.data.title,
                step: result.data.steps.map((step, index) => ({ '@type': 'HowToStep', position: index + 1, ...step })),
              });
            }
          }
        } catch { /* Incomplete future blocks must not break article metadata. */ }
      }
      if (node.attribs['data-type'] === 'editorial-block') {
        const block = parseEditorialBlock(node.attribs['data-editorial-block']);
        if (block?.kind === 'verdict' && !verdict) verdict = block;
        if (block?.kind === 'comparison') technical = true;
      }
      if (node.attribs['data-type'] === 'spec-sheet-block') technical = true;
      if (node.attribs['data-type'] === 'pros-cons-block') {
        pros.push(...strings(node.attribs['data-pros'])); cons.push(...strings(node.attribs['data-cons']));
      }
      if (node.attribs['data-type'] === 'score-breakdown-block') {
        technical = true;
        try {
          const items: unknown = JSON.parse(node.attribs['data-items'] || node.attribs['data-scores'] || node.attribs['data-categories'] || '[]');
          if (Array.isArray(items)) for (const item of items.slice(0, 100)) {
            if (item && typeof item === 'object' && typeof item.metric === 'string' && (typeof item.score === 'string' || typeof item.score === 'number' && Number.isFinite(item.score))) {
              benchmarks.push({ '@type': 'PropertyValue', name: item.metric, value: item.score });
            }
          }
        } catch { /* Legacy invalid score attributes do not prevent page rendering. */ }
      }
      visit(node.children as DOMNode[]);
    }
  }
  visit(htmlToDOM(html) as DOMNode[]);
  const withSupplementalSchema = (article: Record<string, unknown>): Record<string, unknown> => {
    if (!questions.length && !howTos.length) return article;
    return {
      '@context': 'https://schema.org',
      '@graph': [article, ...(questions.length ? [{ '@type': 'FAQPage', mainEntity: questions }] : []), ...howTos],
    };
  };
  if (!verdict) return withSupplementalSchema(technical ? { ...base, '@type': 'TechArticle' } : base);
  const notes = (items: string[]) => ({ '@type': 'ItemList', itemListElement: items.map((name, index) => ({ '@type': 'ListItem', position: index + 1, name })) });
  return withSupplementalSchema({
    ...base, '@type': 'TechArticle',
    mainEntity: {
      '@type': 'Product', name: verdict.product,
      ...(base.image ? { image: base.image } : {}),
      ...(benchmarks.length ? { additionalProperty: benchmarks } : {}),
      review: {
        '@type': 'Review', name: base.headline, author: base.author, datePublished: base.datePublished,
        reviewBody: verdict.summary,
        reviewRating: { '@type': 'Rating', ratingValue: verdict.score, bestRating: 10, worstRating: 0 },
        ...(pros.length ? { positiveNotes: notes(pros) } : {}),
        ...(cons.length ? { negativeNotes: notes(cons) } : {}),
      },
    },
  });
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
