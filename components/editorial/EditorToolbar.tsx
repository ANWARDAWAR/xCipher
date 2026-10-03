"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { type Editor, useEditorState } from '@tiptap/react';
import { Undo, Redo, Bold, Italic, Underline, Strikethrough, Code, List, ListOrdered, Quote, ImagePlus, Link2, FileCode, Minus, Maximize2, Minimize2, RemoveFormatting, MonitorPlay, Table as TableIcon, AlignLeft, AlignCenter, AlignRight, Subscript, Superscript, Highlighter, Search, ChevronDown, BarChart3, Workflow, ListChecks, ClipboardList, Star, Download, PanelLeft } from 'lucide-react';
import { InsertMediaDialog, type MediaKind } from './InsertMediaDialog';
import { BLOCK_LABELS, type BlockKind } from '@/lib/editorial-blocks';
import type { CalloutType } from './extensions/Callout';
import FindReplace from './FindReplace';
import { getEditorFormattingState } from '@/lib/editor/document-state';

interface EditorToolbarProps {
  editor: Editor;
  isFullscreen?: boolean;
  toggleFullscreen?: () => void;
  onToggleOutline?: () => void;
  outlineOpen?: boolean;
}

function Tool({ icon: Icon, title, onClick, active = false, disabled = false }: { icon: ElementType; title: string; onClick: () => void; active?: boolean; disabled?: boolean }) {
  return <button type="button" className={`studio-tool ${active ? 'is-active' : ''}`} title={title} aria-label={title} aria-pressed={active} disabled={disabled} onMouseDown={event => event.preventDefault()} onClick={onClick}><Icon size={16} /></button>;
}
function Menu({ title, children }: { title: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!ref.current?.contains(event.target as globalThis.Node)) ref.current?.removeAttribute('open'); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && ref.current?.open) { ref.current.removeAttribute('open'); ref.current.querySelector('summary')?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, []);
  return <details ref={ref} className="studio-menu"><summary>{title}<ChevronDown size={12} /></summary><div className="studio-menu-panel" onClick={event => { if ((event.target as HTMLElement).closest('button')) ref.current?.removeAttribute('open'); }}>{children}</div></details>;
}
function Item({ children, onClick, disabled = false }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button type="button" disabled={disabled} onMouseDown={event => event.preventDefault()} onClick={onClick}>{children}</button>;
}

export function EditorToolbar({ editor, isFullscreen, toggleFullscreen, onToggleOutline, outlineOpen }: EditorToolbarProps) {
  useEditorState({ editor, selector: ({ editor }) => getEditorFormattingState(editor) });
  const [tab, setTab] = useState<'write' | 'insert'>('write');
  const [findOpen, setFindOpen] = useState(false);
  const [mediaKind, setMediaKind] = useState<MediaKind | null>(null);
  const [mediaSession, setMediaSession] = useState(0);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState('');
  const linkDialog = useRef<HTMLDialogElement>(null);
  const linkSelection = useRef<{ from: number; to: number } | null>(null);
  const openLink = () => {
    const { from, to } = editor.state.selection;
    linkSelection.current = { from, to };
    setLinkUrl(String(editor.getAttributes('link').href || ''));
    setLinkError('');
    linkDialog.current?.showModal();
  };
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const root = editor.view.dom.closest('.editor-studio');
      if (!root?.contains(document.activeElement)) return;
      if (event.key.toLowerCase() === 'f') { event.preventDefault(); setFindOpen(true); }
      if (event.key.toLowerCase() === 'k') { event.preventDefault(); openLink(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  });
  const applyLink = () => {
    const value = linkUrl.trim();
    const selection = linkSelection.current;
    const chain = editor.chain().focus();
    if (selection) chain.setTextSelection(selection);
    if (!value) { chain.extendMarkRange('link').unsetLink().run(); linkDialog.current?.close(); return; }
    try { if (!['https:', 'http:', 'mailto:'].includes(new URL(value).protocol)) throw new Error(); }
    catch { setLinkError('Enter an http, https, or mailto URL.'); return; }
    if (selection && selection.from !== selection.to) {
      chain.extendMarkRange('link').setLink({ href: value }).run();
    } else if (editor.state.selection.empty && !editor.isActive('link')) {
      editor.chain().focus().insertContent({ type: 'text', text: value, marks: [{ type: 'link', attrs: { href: value } }] }).run();
    } else {
      chain.extendMarkRange('link').setLink({ href: value }).run();
    }
    linkDialog.current?.close();
  };
  const removeLink = () => {
    const selection = linkSelection.current;
    const chain = editor.chain().focus();
    if (selection) chain.setTextSelection(selection);
    chain.extendMarkRange('link').unsetLink().run();
    linkDialog.current?.close();
  };
  const openMedia = (kind: MediaKind) => { setMediaSession(value => value + 1); setMediaKind(kind); };
  const exportDocument = () => {
    const blob = new Blob([JSON.stringify(editor.getJSON(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'article-document.json'; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const callout = (type: CalloutType) => editor.chain().focus().toggleCallout({ type }).run();
  return <div className="studio-toolbar">
    <div className="studio-menu-row">
      <div className="studio-tabs" role="group" aria-label="Toolbar sections"><button type="button" aria-pressed={tab === 'write'} onClick={() => setTab('write')}>Write</button><button type="button" aria-pressed={tab === 'insert'} onClick={() => setTab('insert')}>Insert</button></div>
      <Menu title="Document"><Item onClick={exportDocument}><Download size={15} /> Export document JSON</Item><Item onClick={() => setFindOpen(true)}><Search size={15} /> Find and replace</Item>{onToggleOutline && <Item onClick={onToggleOutline}><PanelLeft size={15} /> {outlineOpen ? 'Hide' : 'Show'} outline</Item>}{toggleFullscreen && <Item onClick={toggleFullscreen}><Maximize2 size={15} /> {isFullscreen ? 'Exit' : 'Enter'} focus mode</Item>}</Menu>
      <span className="studio-toolbar-hint">{tab === 'write' ? 'A space for your next great story' : 'Build a richer story'}</span>
    </div>
    <div className="studio-ribbon" role="toolbar" aria-label={tab === 'write' ? 'Text formatting' : 'Insert content'}>
      <div className="studio-tool-group"><Tool icon={Undo} title="Undo (Ctrl+Z)" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} /><Tool icon={Redo} title="Redo (Ctrl+Shift+Z)" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} /></div>
      {tab === 'write' ? <>
        <div className="studio-tool-group"><select className="studio-style-select" aria-label="Paragraph style" value={editor.isActive('heading') ? String(editor.getAttributes('heading').level) : 'paragraph'} onChange={event => { if (event.target.value === 'paragraph') editor.chain().focus().setParagraph().run(); else editor.chain().focus().setHeading({ level: Number(event.target.value) as 1 | 2 | 3 | 4 }).run(); }}><option value="paragraph">Normal text</option><option value="1">Heading 1</option><option value="2">Heading 2</option><option value="3">Heading 3</option><option value="4">Heading 4</option></select></div>
        <div className="studio-tool-group"><Tool icon={Bold} title="Bold (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} /><Tool icon={Italic} title="Italic (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} /><Tool icon={Underline} title="Underline (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} /><Tool icon={Highlighter} title="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} /><Menu title="More"><Item onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={15} /> Strikethrough</Item><Item onClick={() => editor.chain().focus().toggleSubscript().run()}><Subscript size={15} /> Subscript</Item><Item onClick={() => editor.chain().focus().toggleSuperscript().run()}><Superscript size={15} /> Superscript</Item><Item onClick={() => editor.chain().focus().toggleCode().run()}><Code size={15} /> Inline code</Item><Item onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><RemoveFormatting size={15} /> Clear formatting</Item></Menu></div>
        <div className="studio-tool-group"><Tool icon={AlignLeft} title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} /><Tool icon={AlignCenter} title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} /><Tool icon={AlignRight} title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} /></div>
        <div className="studio-tool-group"><Tool icon={List} title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} /><Tool icon={ListOrdered} title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} /><Tool icon={Quote} title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} /></div>
        <div className="studio-tool-group"><Tool icon={Link2} title="Insert or edit link (Ctrl+K)" active={editor.isActive('link')} onClick={openLink} /><Tool icon={ImagePlus} title="Insert image" onClick={() => openMedia('image')} /><Tool icon={Search} title="Find and replace (Ctrl+F)" active={findOpen} onClick={() => setFindOpen(!findOpen)} /></div>
      </> : <>
        <div className="studio-tool-group"><Tool icon={ImagePlus} title="Insert image" onClick={() => openMedia('image')} /><Tool icon={MonitorPlay} title="YouTube video" onClick={() => openMedia('video')} /><Menu title="Review blocks">{(Object.keys(BLOCK_LABELS) as BlockKind[]).map(kind => <Item key={kind} onClick={() => editor.chain().focus().insertEditorialBlock(kind).run()}>{BLOCK_LABELS[kind]}</Item>)}<Item onClick={() => editor.chain().focus().insertProsCons().run()}><ListChecks size={15} /> Pros and cons</Item><Item onClick={() => editor.chain().focus().insertSpecSheet().run()}><ClipboardList size={15} /> Specification sheet</Item><Item onClick={() => editor.chain().focus().insertScoreBreakdown().run()}><Star size={15} /> Score breakdown</Item></Menu></div>
        <div className="studio-tool-group"><Menu title="Callout">{(['info', 'takeaway', 'quote', 'warning', 'editor-note', 'update', 'pro-tip'] as const).map(type => <Item key={type} onClick={() => callout(type)}>{({ info: 'Information', takeaway: 'Key takeaway', quote: 'Pull quote', warning: 'Warning', 'editor-note': 'Editor’s note', update: 'Update', 'pro-tip': 'Pro tip' })[type]}</Item>)}</Menu><Menu title="Chart">{(['bar', 'horizontal-bar', 'line', 'pie', 'scatter'] as const).map(type => <Item key={type} onClick={() => editor.chain().focus().convertSelectionToChart(type).run()}><BarChart3 size={15} /> {type}</Item>)}</Menu><Tool icon={Workflow} title="Diagram from selection" onClick={() => editor.chain().focus().convertSelectionToMermaid().run()} /><Tool icon={FileCode} title="Code block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} /><Tool icon={Minus} title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()} /></div>
      </>}
      <Menu title="Table"><Item onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon size={15} /> Insert 3 × 3 table</Item>{editor.isActive('table') && <>
        <Item onClick={() => editor.chain().focus().addRowBefore().run()}>Add row above</Item><Item onClick={() => editor.chain().focus().addRowAfter().run()}>Add row below</Item><Item onClick={() => editor.chain().focus().addColumnBefore().run()}>Add column before</Item><Item onClick={() => editor.chain().focus().addColumnAfter().run()}>Add column after</Item><Item onClick={() => editor.chain().focus().toggleHeaderRow().run()}>Toggle header row</Item><Item disabled={!editor.can().mergeCells()} onClick={() => editor.chain().focus().mergeCells().run()}>Merge selected cells</Item><Item disabled={!editor.can().splitCell()} onClick={() => editor.chain().focus().splitCell().run()}>Split cell</Item><Item onClick={() => editor.chain().focus().deleteRow().run()}>Delete row</Item><Item onClick={() => editor.chain().focus().deleteColumn().run()}>Delete column</Item><Item onClick={() => editor.chain().focus().deleteTable().run()}>Delete table</Item><Item onClick={() => editor.chain().focus().convertTableToSpecSheet().run()}>Convert to specification sheet</Item><Item onClick={() => editor.chain().focus().convertTableToProsCons().run()}>Convert to pros and cons</Item><Item onClick={() => editor.chain().focus().convertTableToScoreBreakdown().run()}>Convert to score breakdown</Item>
      </>}</Menu>
      {toggleFullscreen && <Tool icon={isFullscreen ? Minimize2 : Maximize2} title={isFullscreen ? 'Exit focus mode' : 'Focus mode'} active={isFullscreen} onClick={toggleFullscreen} />}
    </div>
    {findOpen && <FindReplace editor={editor} close={() => setFindOpen(false)} />}
    <dialog ref={linkDialog} className="studio-dialog" aria-label="Insert or edit link"><h2>Insert link</h2><p>Link the selected text to a source.</p><label>URL<input autoFocus type="url" value={linkUrl} onChange={event => setLinkUrl(event.target.value)} placeholder="https://" onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); applyLink(); } }} /></label>{linkError && <p role="alert">{linkError}</p>}<div><button type="button" onClick={() => linkDialog.current?.close()}>Cancel</button><button type="button" onClick={removeLink}>Remove link</button><button type="button" className="studio-primary" onClick={applyLink}>Apply</button></div></dialog>
    <InsertMediaDialog key={mediaSession} kind={mediaKind || 'image'} open={mediaKind !== null} onClose={() => setMediaKind(null)} onInsertImage={value => {
      if (editor.isActive('figure') || editor.isActive('image')) {
        editor.chain().focus().updateAttributes('figure', value).run();
      } else {
        (editor.chain().focus() as any).setFigure(value).run();
      }
    }} onInsertVideo={value => editor.chain().focus().setYouTubeVideo(value).run()} />
  </div>;
}
