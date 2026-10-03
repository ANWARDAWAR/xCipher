import type { Node } from '@tiptap/pm/model';

export function findText(doc: Node, query: string, caseSensitive = false): { from: number; to: number }[] {
  if (!query) return [];
  const matches: { from: number; to: number }[] = [];
  const needle = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'gu' : 'giu');
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return;
    const content = node.textBetween(0, node.content.size, '', '\ufffc');
    for (const match of content.matchAll(needle)) matches.push({ from: pos + 1 + match.index, to: pos + 1 + match.index + match[0].length });
    return false;
  });
  return matches;
}
