import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    prosCons: {
      insertProsCons: () => ReturnType;
    };
  }
}

export const ProsConsBlock = Node.create({
  name: 'prosConsBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      pros: {
        default: '["Great battery life", "Excellent display"]',
        parseHTML: (element) => element.getAttribute('data-pros'),
        renderHTML: (attributes) => ({
          'data-pros': attributes.pros,
        }),
      },
      cons: {
        default: '["High price", "No headphone jack"]',
        parseHTML: (element) => element.getAttribute('data-cons'),
        renderHTML: (attributes) => ({
          'data-cons': attributes.cons,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="pros-cons-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'pros-cons-block' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ProsConsNodeView);
  },

  addCommands() {
    return {
      insertProsCons: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
        });
      },
    };
  },
});

function ProsConsNodeView({ node, updateAttributes }: any) {
  const pros = JSON.parse(node.attrs.pros || '[]');
  const cons = JSON.parse(node.attrs.cons || '[]');
  const [newPro, setNewPro] = useState('');
  const [newCon, setNewCon] = useState('');

  const addPro = () => {
    if (newPro.trim()) {
      updateAttributes({ pros: JSON.stringify([...pros, newPro.trim()]) });
      setNewPro('');
    }
  };

  const addCon = () => {
    if (newCon.trim()) {
      updateAttributes({ cons: JSON.stringify([...cons, newCon.trim()]) });
      setNewCon('');
    }
  };

  const removePro = (index: number) => {
    const next = [...pros];
    next.splice(index, 1);
    updateAttributes({ pros: JSON.stringify(next) });
  };

  const removeCon = (index: number) => {
    const next = [...cons];
    next.splice(index, 1);
    updateAttributes({ cons: JSON.stringify(next) });
  };

  return (
    <NodeViewWrapper className="my-8 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] overflow-hidden font-sans">
      <div className="bg-[var(--surface-3)] px-4 py-2 text-sm font-semibold text-[var(--ink)] border-b border-[var(--line)]">
        Pros & Cons Builder
      </div>
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--line)]">
        {/* Pros Column */}
        <div className="p-4 flex flex-col gap-3">
          <h4 className="text-green-500 font-bold flex items-center gap-2 m-0 text-base">
            <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">+</span>
            Pros
          </h4>
          <ul className="flex flex-col gap-2 m-0 p-0 list-none">
            {pros.map((p: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm bg-[var(--surface)] p-2 rounded-md border border-[var(--line)] text-[var(--ink)]">
                <span className="flex-1">{p}</span>
                <button type="button" onClick={() => removePro(i)} className="text-[var(--muted)] hover:text-red-500 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mt-auto pt-2">
            <input 
              type="text" 
              value={newPro} 
              onChange={e => setNewPro(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  addPro();
                }
              }}
              placeholder="Add a pro..."
              className="flex-1 bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)]"
            />
            <button type="button" onClick={addPro} className="bg-[var(--surface-3)] hover:bg-[var(--line)] text-[var(--ink)] px-3 py-1.5 rounded-md border border-[var(--line)]">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Cons Column */}
        <div className="p-4 flex flex-col gap-3">
          <h4 className="text-red-500 font-bold flex items-center gap-2 m-0 text-base">
            <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">-</span>
            Cons
          </h4>
          <ul className="flex flex-col gap-2 m-0 p-0 list-none">
            {cons.map((c: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm bg-[var(--surface)] p-2 rounded-md border border-[var(--line)] text-[var(--ink)]">
                <span className="flex-1">{c}</span>
                <button type="button" onClick={() => removeCon(i)} className="text-[var(--muted)] hover:text-red-500 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mt-auto pt-2">
            <input 
              type="text" 
              value={newCon} 
              onChange={e => setNewCon(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  addCon();
                }
              }}
              placeholder="Add a con..."
              className="flex-1 bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)]"
            />
            <button type="button" onClick={addCon} className="bg-[var(--surface-3)] hover:bg-[var(--line)] text-[var(--ink)] px-3 py-1.5 rounded-md border border-[var(--line)]">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
