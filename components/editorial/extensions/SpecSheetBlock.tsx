import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState } from 'react';
import { Plus, X, List } from 'lucide-react';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    specSheet: {
      insertSpecSheet: () => ReturnType;
    };
  }
}

const DEFAULT_SPECS = [
  { label: 'Display', value: '6.7" OLED, 120Hz' },
  { label: 'Processor', value: 'Snapdragon 8 Gen 3' },
  { label: 'RAM', value: '12GB / 16GB' },
  { label: 'Battery', value: '5000 mAh' }
];

export const SpecSheetBlock = Node.create({
  name: 'specSheetBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      specs: {
        default: JSON.stringify(DEFAULT_SPECS),
        parseHTML: (element) => element.getAttribute('data-specs'),
        renderHTML: (attributes) => ({
          'data-specs': attributes.specs,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="spec-sheet-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'spec-sheet-block' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SpecSheetNodeView);
  },

  addCommands() {
    return {
      insertSpecSheet: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
        });
      },
    };
  },
});

function SpecSheetNodeView({ node, updateAttributes }: any) {
  const specs = JSON.parse(node.attrs.specs || '[]');
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');

  const addSpec = () => {
    if (newLabel.trim() && newValue.trim()) {
      updateAttributes({ specs: JSON.stringify([...specs, { label: newLabel.trim(), value: newValue.trim() }]) });
      setNewLabel('');
      setNewValue('');
    }
  };

  const removeSpec = (index: number) => {
    const next = [...specs];
    next.splice(index, 1);
    updateAttributes({ specs: JSON.stringify(next) });
  };

  const updateSpec = (index: number, field: 'label' | 'value', val: string) => {
    const next = [...specs];
    next[index][field] = val;
    updateAttributes({ specs: JSON.stringify(next) });
  };

  return (
    <NodeViewWrapper className="my-8 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] overflow-hidden font-sans">
      <div className="bg-[var(--surface-3)] px-4 py-2 text-sm font-semibold text-[var(--ink)] border-b border-[var(--line)] flex items-center gap-2">
        <List className="w-4 h-4 text-[var(--muted)]" />
        Product Specifications
      </div>
      <div className="p-4 flex flex-col gap-3">
        <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1 px-2">
          <div className="col-span-4">Specification</div>
          <div className="col-span-7">Value</div>
        </div>
        
        {specs.map((spec: any, i: number) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center bg-[var(--surface)] p-2 rounded-md border border-[var(--line)]">
            <div className="col-span-4">
              <input 
                type="text" 
                value={spec.label} 
                onChange={(e) => updateSpec(i, 'label', e.target.value)}
                className="w-full bg-transparent text-[var(--ink)] text-sm font-medium focus:outline-none"
              />
            </div>
            <div className="col-span-7 border-l border-[var(--line)] pl-2">
              <input 
                type="text" 
                value={spec.value} 
                onChange={(e) => updateSpec(i, 'value', e.target.value)}
                className="w-full bg-transparent text-[var(--ink)] text-sm focus:outline-none"
              />
            </div>
            <div className="col-span-1 flex justify-end">
              <button type="button" onClick={() => removeSpec(i)} className="text-[var(--muted)] hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        <div className="grid grid-cols-12 gap-2 items-center mt-2">
          <div className="col-span-4">
            <input 
              type="text" 
              value={newLabel} 
              onChange={e => setNewLabel(e.target.value)}
              placeholder="E.g. Camera"
              className="w-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div className="col-span-7">
            <input 
              type="text" 
              value={newValue} 
              onChange={e => setNewValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  addSpec();
                }
              }}
              placeholder="E.g. 50MP Main, 12MP Ultrawide"
              className="w-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div className="col-span-1 flex justify-end">
            <button type="button" onClick={addSpec} className="bg-[var(--surface-3)] hover:bg-[var(--line)] text-[var(--ink)] px-2.5 py-1.5 rounded-md border border-[var(--line)]">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
