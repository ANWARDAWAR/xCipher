import React from 'react';
import { Editor } from '@tiptap/react';

interface EditorToolbarProps {
  editor: Editor;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) {
      return;
    }
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("Image URL (e.g. https://images.pexels.com/...)");
    if (!url) return;
    
    const alt = window.prompt("Alt Text (for accessibility/SEO):") || "";
    const caption = window.prompt("Caption (optional):") || "";
    const credit = window.prompt("Image Credit (optional):") || "";

    (editor.chain().focus() as any).setFigure({ src: url, alt, caption, credit }).run();
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="ed-toolbar" role="toolbar" aria-label="Formatting">
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
        aria-label="Undo"
      >
        ↩
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
        aria-label="Redo"
      >
        ↪
      </button>
      <span className="t-sep"></span>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "active bg-[#232a31]" : ""}
        title="Bold"
        aria-label="Bold"
      >
        <b>B</b>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "active bg-[#232a31]" : ""}
        title="Italic"
        aria-label="Italic"
      >
        <i style={{ fontFamily: "Georgia" }}>I</i>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={editor.isActive("underline") ? "active bg-[#232a31]" : ""}
        title="Underline"
        aria-label="Underline"
      >
        <u>U</u>
      </button>

      <span className="t-sep"></span>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive("heading", { level: 2 }) ? "active bg-[#232a31]" : ""}
        title="Heading 2"
        aria-label="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive("heading", { level: 3 }) ? "active bg-[#232a31]" : ""}
        title="Heading 3"
        aria-label="Heading 3"
      >
        H3
      </button>

      <span className="t-sep"></span>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive("blockquote") ? "active bg-[#232a31]" : ""}
        title="Quote"
        aria-label="Quote"
      >
        ❝
      </button>
      <button
        type="button"
        onClick={() => (editor.chain().focus() as any).setCallout({ type: 'takeaway' }).run()}
        className={editor.isActive("callout", { type: 'takeaway' }) ? "active bg-[#232a31]" : ""}
        title="Key Takeaway"
        aria-label="Key Takeaway"
      >
        💡
      </button>

      <span className="t-sep"></span>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive("bulletList") ? "active bg-[#232a31]" : ""}
        title="Bullet list"
        aria-label="Bullet list"
      >
        • List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive("orderedList") ? "active bg-[#232a31]" : ""}
        title="Numbered list"
        aria-label="Numbered list"
      >
        1. List
      </button>
      
      <span className="t-sep"></span>
      <button
        type="button"
        onClick={setLink}
        className={editor.isActive("link") ? "active bg-[#232a31]" : ""}
        title="Insert link"
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

      <span className="t-sep"></span>
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
        className={editor.isActive("codeBlock") ? "active bg-[#232a31]" : ""}
        title="Code block"
        aria-label="Code block"
      >
        &lt;/&gt;
      </button>
    </div>
  );
}
