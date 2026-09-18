"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Link2,
  Link2Off,
  Highlighter,
  Check,
  X,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Selection formatting menu
// ─────────────────────────────────────────────────────────────────────────────
//
// Appears over a text selection with the marks a writer reaches for mid
// sentence, so the hand does not travel to the toolbar for a bold or a link.
// Deliberately only marks: block-level changes stay in the toolbar, because a
// menu that changes size as the selection moves is hard to aim at.
//
// The link editor takes over the same surface rather than opening a second
// floating layer. Two stacked popovers over a selection is where this pattern
// usually starts feeling clumsy.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  editor: Editor | null;
}

/** Accepted link protocols. Matches the server-side allowance in lib/sanitize
 *  so a link that looks saved in the editor is not silently dropped later. */
function normaliseHref(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  // A bare domain is what people actually type. Default to https rather than
  // rejecting it, but only when it cannot be read as a scheme already.
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;

  try {
    const url = new URL(candidate);
    if (!["http:", "https:", "mailto:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function MarkButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: typeof Bold;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className="eb-btn"
      data-active={active ? "true" : undefined}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
    </button>
  );
}

export function EditorBubbleMenu({ editor }: Props) {
  const [linkMode, setLinkMode] = useState(false);
  const [draft, setDraft] = useState("");
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the field when the link editor opens, so it is immediately typeable.
  useEffect(() => {
    if (linkMode) inputRef.current?.focus();
  }, [linkMode]);

  const openLinkEditor = useCallback(() => {
    if (!editor) return;
    setDraft(editor.getAttributes("link").href ?? "");
    setInvalid(false);
    setLinkMode(true);
  }, [editor]);

  const closeLinkEditor = useCallback(() => {
    setLinkMode(false);
    setDraft("");
    setInvalid(false);
    // Returning focus to the document is what makes Escape feel correct --
    // otherwise the caret is lost and the writer has to click back in.
    editor?.chain().focus().run();
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;

    // An empty field means "remove the link" -- the same gesture as clearing
    // any other field, rather than a separate destructive button.
    if (!draft.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      closeLinkEditor();
      return;
    }

    const href = normaliseHref(draft);
    if (!href) {
      setInvalid(true);
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    closeLinkEditor();
  }, [editor, draft, closeLinkEditor]);

  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 8 }}
      shouldShow={({ editor: ed, from, to }) => {
        // Never over an atom such as a video: the marks would not apply and the
        // menu would float over the block with nothing useful on it.
        if (ed.isActive("youtubeEmbed") || ed.isActive("figure")) return false;
        // Inside a code block the marks are meaningless too.
        if (ed.isActive("codeBlock")) return false;
        if (linkMode) return true;
        return from !== to;
      }}
      className="eb-menu"
    >
      {linkMode ? (
        <div className="eb-link">
          <input
            ref={inputRef}
            type="url"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (invalid) setInvalid(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                closeLinkEditor();
              }
            }}
            placeholder="Paste or type a URL"
            aria-label="Link URL"
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? "eb-link-error" : undefined}
            className="eb-link-input"
            data-invalid={invalid ? "true" : undefined}
          />
          <button type="button" onClick={applyLink} aria-label="Apply link" title="Apply" className="eb-btn">
            <Check className="w-4 h-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={closeLinkEditor} aria-label="Cancel" title="Cancel" className="eb-btn">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
          {invalid && (
            <span id="eb-link-error" role="alert" className="eb-link-error">
              Enter a valid http, https or mailto address.
            </span>
          )}
        </div>
      ) : (
        <div className="eb-row" role="toolbar" aria-label="Text formatting">
          <MarkButton
            icon={Bold}
            label="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          <MarkButton
            icon={Italic}
            label="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
          <MarkButton
            icon={UnderlineIcon}
            label="Underline"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          />
          <MarkButton
            icon={Strikethrough}
            label="Strikethrough"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          />

          <span className="eb-sep" aria-hidden="true" />

          <MarkButton
            icon={Code}
            label="Inline code"
            active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
          />
          <MarkButton
            icon={Highlighter}
            label="Highlight"
            active={editor.isActive("highlight")}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
          />

          <span className="eb-sep" aria-hidden="true" />

          <MarkButton
            icon={Link2}
            label={editor.isActive("link") ? "Edit link" : "Add link"}
            active={editor.isActive("link")}
            onClick={openLinkEditor}
          />
          {editor.isActive("link") && (
            <MarkButton
              icon={Link2Off}
              label="Remove link"
              onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
            />
          )}
        </div>
      )}
    </BubbleMenu>
  );
}
