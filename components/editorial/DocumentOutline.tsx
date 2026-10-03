"use client";

import { type Editor, useEditorState } from '@tiptap/react';
import { ListTree, X } from 'lucide-react';
import { getDocumentOutline } from '@/lib/editor/document-state';

export default function DocumentOutline({ editor, close }: { editor: Editor; close: () => void }) {
  const headings = useEditorState({ editor, selector: ({ editor }) => getDocumentOutline(editor) });
  return <aside className="studio-outline" aria-label="Document outline"><div className="studio-outline-heading"><ListTree size={15} /><span>Document outline</span><button type="button" onClick={close} aria-label="Hide outline"><X size={14} /></button></div>
    <nav aria-label="Jump to section">{headings.length ? headings.map(heading => <button type="button" key={heading.pos} style={{ paddingLeft: `${12 + (Math.min(heading.level, 4) - 1) * 10}px` }} onClick={() => editor.chain().focus().setTextSelection(heading.pos + 1).scrollIntoView().run()}>{heading.text}</button>) : <p>Your headings will appear here. Use heading styles to organize your story.</p>}</nav>
    <div className="studio-outline-tip"><span>WRITER’S TOOLKIT</span><p>Type <kbd>/</kbd> in your document to insert a block.</p><p><kbd>Ctrl / ⌘ K</kbd> to cite a source.</p></div>
  </aside>;
}
