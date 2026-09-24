import React, { useCallback, useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Undo, Redo, Heading1, Heading2, Heading3, Type, Bold, Italic, Underline,
  Strikethrough, Code, List, ListOrdered, Quote, ImagePlus, Link2,
  FileCode, Minus, Maximize2, RemoveFormatting, MonitorPlay, Table as TableIcon,
  AlignLeft, AlignCenter, AlignRight, Subscript as SubscriptIcon, Superscript as SuperscriptIcon,
  Lightbulb
} from 'lucide-react';
import { InsertMediaDialog, type MediaKind } from './InsertMediaDialog';

interface EditorToolbarProps {
  editor: Editor;
  isFullscreen?: boolean;
  toggleFullscreen?: () => void;
}

// Declared at module scope on purpose.
//
// These used to live inside EditorToolbar's render body, which gave them a new
// component identity on every render. Because the toolbar re-renders on each
// editor transaction -- that is, on every keystroke -- React was unmounting and
// remounting all thirty-odd buttons continuously, discarding their DOM nodes
// and any focus on them. Hoisting makes the identity stable so React can
// reconcile the buttons instead of rebuilding them.

interface ToolbarButtonProps {
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ElementType;
  title: string;
}

function ToolbarButton({ isActive = false, onClick, disabled = false, icon: Icon, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      // Tooltips are not exposed reliably to assistive tech, so the accessible
      // name is carried explicitly rather than inferred from title.
      aria-label={title}
      aria-pressed={isActive}
      className={`w-11 h-11 md:w-8 md:h-8 shrink-0 flex items-center justify-center rounded-lg transition-colors ${
        isActive
          ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-semibold shadow-sm'
          : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]'
      } ${disabled ? 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-[var(--muted)]' : ''}`}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
    </button>
  );
}

function Divider() {
  return <div className="h-4 w-[1px] bg-[var(--line)] mx-1" aria-hidden="true" />;
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
    
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`[${url}](${url}) `).run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }, [editor]);

  // Media insertion moved out of window.prompt and into a real dialog: the
  // prompt chain could not be cancelled partway, validated nothing, showed no
  // preview, and was unusable on touch.
  const [mediaKind, setMediaKind] = useState<MediaKind | null>(null);
  const [initialMedia, setInitialMedia] = useState<any>(null);
  // Bumped each time the dialog opens so it remounts with empty fields. This is
  // what lets InsertMediaDialog drop its reset-on-open effect: React discards
  // the previous instance's state instead of the component clearing it by hand
  // and forcing an extra render.
  const [mediaSession, setMediaSession] = useState(0);

  const openMedia = (kind: MediaKind, currentAttrs?: any) => {
    setMediaSession((n) => n + 1);
    setMediaKind(kind);
    setInitialMedia(currentAttrs || null);
  };

  const insertImage = useCallback(
    (v: { src: string; alt: string; caption: string; credit: string }) => {
      (editor.chain().focus() as any).setFigure(v).run();
    },
    [editor]
  );

  const insertVideo = useCallback(
    (v: { src: string }) => {
      // setYouTubeVideo returns false for anything it cannot parse, so a bad
      // URL leaves the document untouched rather than inserting a dead block.
      editor.chain().focus().setYouTubeVideo({ src: v.src }).run();
    },
    [editor]
  );

  return (
    <div 
      className="sticky top-0 z-50 bg-[var(--surface)] border-b border-[var(--line)] py-2 md:mb-8 flex md:flex-wrap items-center gap-1 mx-auto w-full overflow-x-auto overflow-y-hidden md:max-w-3xl px-2 md:px-0 shadow-md md:shadow-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      role="toolbar" 
      aria-label="Formatting"
    >
      {/* Group 1: History */}
      <ToolbarButton
        icon={Undo}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      />
      <ToolbarButton
        icon={Redo}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Shift+Z)"
      />
      
      <Divider />

      {/* Group 2: Hierarchy & Style */}
      <ToolbarButton
        icon={Heading1}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      />
      <ToolbarButton
        icon={Heading2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      />
      <ToolbarButton
        icon={Heading3}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      />
      <ToolbarButton
        icon={Type}
        onClick={() => editor.chain().focus().setParagraph().run()}
        isActive={editor.isActive('paragraph')}
        title="Paragraph"
      />
      
      <Divider />

      <ToolbarButton
        icon={Bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      />
      <ToolbarButton
        icon={Italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      />
      <ToolbarButton
        icon={Underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
      />
      <ToolbarButton
        icon={Strikethrough}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      />
      <ToolbarButton
        icon={SubscriptIcon}
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        isActive={editor.isActive('subscript')}
        title="Subscript"
      />
      <ToolbarButton
        icon={SuperscriptIcon}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        isActive={editor.isActive('superscript')}
        title="Superscript"
      />
      <ToolbarButton
        icon={Code}
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Inline Code"
      />

      <Divider />

      {/* Group 3: Lists & Quotes */}
      <ToolbarButton
        icon={List}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      />
      <ToolbarButton
        icon={ListOrdered}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Ordered List"
      />
      <ToolbarButton
        icon={Quote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Blockquote"
      />
      <ToolbarButton
        icon={Lightbulb}
        onClick={() => {
          editor.chain().focus().insertContent({
            type: 'callout',
            attrs: { type: 'takeaway' },
            content: [
              {
                type: 'heading',
                attrs: { level: 3 },
                content: [{ type: 'text', text: 'Key Takeaways' }]
              },
              {
                type: 'bulletList',
                content: [
                  {
                    type: 'listItem',
                    content: [{ type: 'paragraph' }]
                  }
                ]
              }
            ]
          }).run()
        }}
        title="Key Takeaways"
      />

      <span className="hidden sm:contents">
        <Divider />
        <ToolbarButton
          icon={AlignLeft}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align left"
        />
        <ToolbarButton
          icon={AlignCenter}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align centre"
        />
        <ToolbarButton
          icon={AlignRight}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align right"
        />
      </span>

      <Divider />

      {/* Group 4: Media & Embeds */}
      <ToolbarButton
        icon={ImagePlus}
        onClick={() => {
          if (editor.isActive('figure')) {
            openMedia('image', editor.getAttributes('figure'));
          } else {
            openMedia('image');
          }
        }}
        isActive={editor.isActive('figure')}
        title={editor.isActive('figure') ? "Update image" : "Insert image"}
      />
      <ToolbarButton
        icon={MonitorPlay}
        onClick={() => openMedia('video')}
        title="Insert YouTube video"
      />
      <ToolbarButton
        icon={TableIcon}
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        isActive={editor.isActive('table')}
        title="Insert table"
      />
      <ToolbarButton
        icon={Link2}
        onClick={setLink}
        isActive={editor.isActive('link')}
        title="Insert Link"
      />
      <ToolbarButton
        icon={FileCode}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="Code Block"
      />
      <ToolbarButton
        icon={Minus}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      />

      <Divider />

      {/* Group 5: View / Utilities */}
      <ToolbarButton
        icon={RemoveFormatting}
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        title="Clear Formatting"
      />
      {toggleFullscreen && (
        <ToolbarButton
          icon={Maximize2}
          onClick={toggleFullscreen}
          isActive={isFullscreen}
          title="Toggle Fullscreen"
        />
      )}

      <InsertMediaDialog
        key={mediaSession}
        kind={mediaKind ?? 'image'}
        initialImage={initialMedia}
        open={mediaKind !== null}
        onClose={() => setMediaKind(null)}
        onInsertImage={insertImage}
        onInsertVideo={insertVideo}
      />
    </div>
  );
}
