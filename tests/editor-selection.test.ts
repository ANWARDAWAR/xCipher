// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { CharacterCount } from '@tiptap/extension-character-count';
import parse from 'html-react-parser';
import { renderToStaticMarkup } from 'react-dom/server';
import { getDocumentCounts, getDocumentOutline, getEditorFormattingState } from '@/lib/editor/document-state';
import { sanitizeArticleHtml } from '@/lib/sanitize';

function makeEditor(content = '<h2>Section</h2><p>First paragraph with enough text to select.</p>') {
  return new Editor({ extensions: [StarterKit, Highlight, CharacterCount], content });
}

describe('selection work', () => {
  it('reuses document counts across selection changes and refreshes after editing', () => {
    const editor = makeEditor();
    try {
      const words = vi.spyOn(editor.storage.characterCount, 'words');
      const characters = vi.spyOn(editor.storage.characterCount, 'characters');
      const initial = getDocumentCounts(editor);
      words.mockClear(); characters.mockClear();
      for (let to = 2; to < 8; to++) {
        editor.commands.setTextSelection({ from: 1, to });
        expect(getDocumentCounts(editor)).toBe(initial);
      }
      expect(words).not.toHaveBeenCalled();
      expect(characters).not.toHaveBeenCalled();
      editor.commands.setContent('<p>New document.</p>');
      expect(getDocumentCounts(editor)).not.toBe(initial);
      expect(getDocumentCounts(editor).words).toBe(2);
    } finally { editor.destroy(); }
  });

  it('reuses the outline during selection and refreshes headings after editing', () => {
    const editor = makeEditor();
    try {
      const initial = getDocumentOutline(editor);
      expect(initial).toEqual([{ text: 'Section', level: 2, pos: 0 }]);
      editor.commands.setTextSelection({ from: 1, to: 4 });
      expect(getDocumentOutline(editor)).toBe(initial);
      editor.commands.setContent('<h3>New section</h3><p>Text</p>');
      expect(getDocumentOutline(editor)).toEqual([{ text: 'New section', level: 3, pos: 0 }]);
    } finally { editor.destroy(); }
  });

  it('keeps menu state stable during plain-text selection and updates when marks change', () => {
    const editor = makeEditor('<p>First paragraph with enough text to select.</p>');
    try {
      editor.commands.setTextSelection({ from: 1, to: 5 });
      const initial = getEditorFormattingState(editor);
      editor.commands.setTextSelection({ from: 1, to: 12 });
      expect(getEditorFormattingState(editor)).toEqual(initial);
      editor.commands.toggleHighlight();
      expect(getEditorFormattingState(editor)).not.toEqual(initial);
      expect(editor.isActive('highlight')).toBe(true);
    } finally { editor.destroy(); }
  });
});

describe('public highlight persistence', () => {
  it('keeps the native mark and nested formatting through editor save, sanitization, and React parsing', () => {
    const editor = makeEditor('<p>Before <mark><strong>highlighted</strong> text</mark> after.</p>');
    try {
      const stored = sanitizeArticleHtml(editor.getHTML());
      const rendered = new DOMParser().parseFromString(renderToStaticMarkup(parse(stored)), 'text/html');
      expect(Array.from(rendered.querySelectorAll('mark')).map(mark => mark.textContent).join('')).toBe('highlighted text');
      expect(rendered.querySelector('strong')?.textContent).toBe('highlighted');
      const reopened = makeEditor(stored);
      try { expect(reopened.getHTML()).toBe(stored); } finally { reopened.destroy(); }
    } finally { editor.destroy(); }
  });

  it('removes unsafe inline colors and event handlers while retaining the highlight', () => {
    const safe = sanitizeArticleHtml('<p><mark style="background-color: yellow; color: black" onclick="alert(1)">Important</mark></p>');
    expect(safe).toBe('<p><mark>Important</mark></p>');
  });
});
