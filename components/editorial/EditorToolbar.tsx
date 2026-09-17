import React, { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { CODE_LANGUAGES } from './extensions/CodeBlockLowlight';

interface EditorToolbarProps {
  editor: Editor;
  isFullscreen?: boolean;
  toggleFullscreen?: () => void;
}

export function EditorToolbar({ editor, isFullscreen, toggleFullscreen }: EditorToolbarProps) {
  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) {
      return;
    }
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    // Basic URL safety check
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
        alert('Only http, https, and mailto links are allowed.');
        return;
      }
    } catch {
      alert('Please enter a valid URL.');
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt("Image URL (e.g. https://images.pexels.com/...)");
    if (!url) return;
    
    const alt = window.prompt("Alt Text (for accessibility/SEO):") || "";
    const caption = window.prompt("Caption (optional):") || "";
    const credit = window.prompt("Image Credit (optional):") || "";

    (editor.chain().focus() as any).setFigure({ src: url, alt, caption, credit }).run();
  }, [editor]);

  const addTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  // Current heading level for the dropdown
  const getCurrentHeading = (): string => {
    for (let level = 1; level <= 6; level++) {
      if (editor.isActive("heading", { level })) return `h${level}`;
    }
    return "paragraph";
  };

  const handleHeadingChange = (value: string) => {
    if (value === "paragraph") {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = parseInt(value.replace("h", ""));
      editor.chain().focus().toggleHeading({ level: level as 1|2|3|4|5|6 }).run();
    }
  };

  const currentLanguage = editor.isActive("codeBlock") 
    ? editor.getAttributes("codeBlock").language || '' 
    : '';

  const isInTable = editor.isActive("table");

  return (
    <div className="ed-toolbar" role="toolbar" aria-label="Formatting">
      {/* ── Undo / Redo ─────────────── */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
      >
        ↩
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Shift+Z)"
        aria-label="Redo"
      >
        ↪
      </button>
      <span className="t-sep" />

      {/* ── Block Type Selector ─────────────── */}
      <select
        className="ed-heading-select"
        value={getCurrentHeading()}
        onChange={(e) => handleHeadingChange(e.target.value)}
        title="Block type"
        aria-label="Block type"
      >
        <option value="paragraph">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="h4">Heading 4</option>
      </select>
      <span className="t-sep" />

      {/* ── Inline Formatting ─────────────── */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "active" : ""}
        title="Bold (Ctrl+B)"
        aria-label="Bold"
      >
        <b>B</b>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "active" : ""}
        title="Italic (Ctrl+I)"
        aria-label="Italic"
      >
        <i style={{ fontFamily: "Georgia" }}>I</i>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={editor.isActive("underline") ? "active" : ""}
        title="Underline (Ctrl+U)"
        aria-label="Underline"
      >
        <u>U</u>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive("strike") ? "active" : ""}
        title="Strikethrough"
        aria-label="Strikethrough"
      >
        <s>S</s>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={editor.isActive("code") ? "active" : ""}
        title="Inline Code"
        aria-label="Inline Code"
      >
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px' }}>{`<>`}</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={editor.isActive("highlight") ? "active" : ""}
        title="Highlight"
        aria-label="Highlight"
      >
        <span style={{ background: 'rgba(255, 213, 0, 0.5)', padding: '0 2px', borderRadius: '2px' }}>H</span>
      </button>
      <span className="t-sep" />

      {/* ── Block Formatting ─────────────── */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive("blockquote") ? "active" : ""}
        title="Blockquote"
        aria-label="Blockquote"
      >
        ❝
      </button>
      <button
        type="button"
        onClick={() => (editor.chain().focus() as any).setCallout({ type: 'info' }).run()}
        className={editor.isActive("callout", { type: 'info' }) ? "active" : ""}
        title="Info Callout"
        aria-label="Info Callout"
      >
        ℹ️
      </button>
      <button
        type="button"
        onClick={() => (editor.chain().focus() as any).setCallout({ type: 'takeaway' }).run()}
        className={editor.isActive("callout", { type: 'takeaway' }) ? "active" : ""}
        title="Key Takeaway"
        aria-label="Key Takeaway"
      >
        💡
      </button>
      <span className="t-sep" />

      {/* ── Lists ─────────────── */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive("bulletList") ? "active" : ""}
        title="Bullet list (Ctrl+Shift+8)"
        aria-label="Bullet list"
      >
        • List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive("orderedList") ? "active" : ""}
        title="Numbered list (Ctrl+Shift+7)"
        aria-label="Numbered list"
      >
        1. List
      </button>
      <span className="t-sep" />

      {/* ── Insert ─────────────── */}
      <button
        type="button"
        onClick={setLink}
        className={editor.isActive("link") ? "active" : ""}
        title="Insert link (Ctrl+K)"
        aria-label="Insert link"
      >
        🔗
      </button>
      <button
        type="button"
        onClick={addImage}
        title="Insert Image (with caption)"
        aria-label="Insert Image"
      >
        🖼️
      </button>
      <button
        type="button"
        onClick={addTable}
        title="Insert Table"
        aria-label="Insert Table"
      >
        📊
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
        aria-label="Horizontal Rule"
      >
        —
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive("codeBlock") ? "active" : ""}
        title="Code block"
        aria-label="Code block"
      >
        &lt;/&gt;
      </button>

      {/* ── Language Selector (shown when inside a code block) ─────────────── */}
      {editor.isActive("codeBlock") && (
        <>
          <span className="t-sep" />
          <select
            className="ed-lang-select"
            value={currentLanguage}
            onChange={(e) => {
              editor.chain().focus().updateAttributes('codeBlock', { language: e.target.value }).run();
            }}
            title="Code language"
            aria-label="Code language"
          >
            {Object.entries(CODE_LANGUAGES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </>
      )}

      {/* ── Table Controls (shown when inside a table) ─────────────── */}
      {isInTable && (
        <>
          <span className="t-sep" />
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            title="Add row below"
            aria-label="Add row below"
          >
            +Row
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            title="Add column right"
            aria-label="Add column right"
          >
            +Col
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            title="Delete row"
            aria-label="Delete row"
            style={{ color: 'var(--bad)' }}
          >
            −Row
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            title="Delete column"
            aria-label="Delete column"
            style={{ color: 'var(--bad)' }}
          >
            −Col
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteTable().run()}
            title="Delete table"
            aria-label="Delete table"
            style={{ color: 'var(--bad)' }}
          >
            ✕ Table
          </button>
        </>
      )}

      {/* ── Fullscreen Toggle ─────────────── */}
      {toggleFullscreen && (
        <>
          <span style={{ flexGrow: 1 }} />
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
          >
            {isFullscreen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            )}
          </button>
        </>
      )}
    </div>
  );
}
