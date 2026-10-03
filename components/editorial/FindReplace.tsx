"use client";

import { useMemo, useState } from 'react';
import { type Editor, useEditorState } from '@tiptap/react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { findText } from '@/lib/editor/find-text';

export default function FindReplace({ editor, close }: { editor: Editor; close: () => void }) {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const doc = useEditorState({ editor, selector: ({ editor }) => editor.state.doc });
  const matches = useMemo(() => findText(doc, query, caseSensitive), [doc, query, caseSensitive]);
  const jump = (backward = false) => {
    const current = editor.state.selection.from;
    const match = backward ? [...matches].reverse().find(item => item.from < current) || matches.at(-1) : matches.find(item => item.from > current) || matches[0];
    if (match) editor.chain().setTextSelection(match).scrollIntoView().run();
  };
  const replace = (all: boolean) => {
    const selected = matches.find(item => item.from === editor.state.selection.from && item.to === editor.state.selection.to);
    const targets = all ? matches : [selected || matches[0]].filter(Boolean);
    if (!targets.length) return;
    const transaction = editor.state.tr;
    [...targets].reverse().forEach(match => transaction.insertText(replacement, match.from, match.to));
    editor.view.dispatch(transaction);
  };
  return <div className="studio-find" role="search" aria-label="Find and replace" onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close(); editor.commands.focus(); } }}>
    <input aria-label="Find in document" autoFocus placeholder="Find in document" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); jump(event.shiftKey); } }} />
    <span aria-live="polite">{matches.length} matches</span>
    <button type="button" disabled={!matches.length} onClick={() => jump(true)} aria-label="Previous match"><ChevronUp size={16} /></button>
    <button type="button" disabled={!matches.length} onClick={() => jump()} aria-label="Next match"><ChevronDown size={16} /></button>
    <label><input type="checkbox" checked={caseSensitive} onChange={event => setCaseSensitive(event.target.checked)} /> Match case</label>
    <input aria-label="Replace with" placeholder="Replace with" value={replacement} onChange={event => setReplacement(event.target.value)} />
    <button type="button" disabled={!matches.length} onClick={() => replace(false)}>Replace</button><button type="button" disabled={!matches.length} onClick={() => replace(true)}>Replace all</button>
    <button type="button" onClick={close} aria-label="Close find and replace"><X size={16} /></button>
  </div>;
}
