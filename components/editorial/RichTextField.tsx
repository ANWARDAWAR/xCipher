"use client";

import { useCallback } from "react";
import { Editor, EditorContent } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link2,
  Unlink,
  RemoveFormatting,
} from "lucide-react";

// ──────────────────────────────────────────────────────────────────────────────
// RichTextField — compact rich text control for form fields
// ──────────────────────────────────────────────────────────────────────────────
//
// The article editor's toolbar is built for long-form work: headings 1-3, code
// blocks, tables, images, fullscreen. Dropping that onto a biography field
// would offer a writer an H1 and an image embed inside what is, in the end, a
// paragraph about themselves.
//
// So this is a deliberately smaller instrument with the same visual language as
// the article toolbar -- icon buttons, active states, tooltips -- rather than
// the untitled letter buttons ("B", "I", "H2") the bio field used before.
// ──────────────────────────────────────────────────────────────────────────────

interface RichTextFieldProps {
  editor: Editor | null;
  /** Rendered under the field. */
  hint?: string;
  minHeight?: number;
  ariaLabel?: string;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      // aria-pressed, not just a colour change: a screen reader user otherwise
      // has no way to know bold is currently on.
      aria-pressed={Boolean(active)}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? "bg-[var(--accent)]/12 text-[var(--accent)]"
          : "text-[var(--ink-2)] hover:bg-[var(--surface-3)] hover:text-[var(--ink)]"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden="true" className="w-px h-4 bg-[var(--line-2)] mx-1 self-center" />;
}

export default function RichTextField({
  editor,
  hint,
  minHeight = 140,
  ariaLabel,
}: RichTextFieldProps) {
  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("Link URL", previous || "https://");
    if (url === null) return;

    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // The bio renders on a public profile page, so an unvalidated href here is
    // a javascript: URI waiting to happen. The article toolbar already guards
    // this; the bio field previously did not.
    try {
      const parsed = new URL(url);
      if (!["http:", "https:", "mailto:"].includes(parsed.protocol)) {
        window.alert("Only http, https and mailto links are allowed.");
        return;
      }
    } catch {
      window.alert("Please enter a valid URL, including https://");
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    // Tiptap initialises on the client; render the shell so the form does not
    // jump when it arrives.
    return (
      <div
        className="rounded-lg border border-[var(--line)] bg-[var(--surface)]"
        style={{ minHeight: minHeight + 42 }}
        aria-busy="true"
      />
    );
  }

  return (
    <div>
      <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] overflow-hidden focus-within:border-[var(--accent)]/50 focus-within:ring-1 focus-within:ring-[var(--accent)]/30 transition-colors">
        <div
          role="toolbar"
          aria-label="Text formatting"
          className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-[var(--line)] bg-[var(--surface-2)]"
        >
          <ToolbarButton
            label="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Underline"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </ToolbarButton>

          <Divider />

          <ToolbarButton
            label="Subheading"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Bulleted list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Quote"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="w-3.5 h-3.5" />
          </ToolbarButton>

          <Divider />

          <ToolbarButton label="Add link" active={editor.isActive("link")} onClick={setLink}>
            <Link2 className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Remove link"
            disabled={!editor.isActive("link")}
            onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
          >
            <Unlink className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Clear formatting"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </ToolbarButton>
        </div>

        <div
          className="ed-body px-3.5 py-3 prose prose-sm dark:prose-invert max-w-none"
          style={{ minHeight }}
          aria-label={ariaLabel}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
      {hint && (
        <span className="block mt-1.5 text-[11.5px] text-[var(--muted)]">{hint}</span>
      )}
    </div>
  );
}
