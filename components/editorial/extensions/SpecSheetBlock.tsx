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
  { category: 'Display', key: 'Type', value: '6.7" OLED, 120Hz' },
  { category: 'Display', key: 'Resolution', value: '1440 x 3200 pixels' },
  { category: 'Platform', key: 'Chipset', value: 'Snapdragon 8 Gen 3' },
  { category: 'Platform', key: 'RAM', value: '12GB / 16GB' },
  { category: 'Battery', key: 'Capacity', value: '5000 mAh' },
  { category: 'Battery', key: 'Charging', value: '65W Wired, 15W Wireless' }
];

export const SpecSheetBlock = Node.create({
  name: 'specSheetBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      items: {
        default: JSON.stringify(DEFAULT_SPECS),
        parseHTML: (element) => element.getAttribute('data-items'),
        renderHTML: (attributes) => ({
          'data-items': attributes.items,
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
  const items = JSON.parse(node.attrs.items || '[]');
  const [newCategory, setNewCategory] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const addSpec = () => {
    if (newKey.trim() && newValue.trim()) {
      const inheritedCategory = items.length > 0 ? items[items.length - 1].category : '';
      const finalCategory = newCategory.trim() !== '' ? newCategory.trim() : inheritedCategory;

      updateAttributes({
        items: JSON.stringify([
          ...items,
          { category: finalCategory, key: newKey.trim(), value: newValue.trim() }
        ])
      });
      setNewCategory('');
      setNewKey('');
      setNewValue('');
    }
  };

  const insertSpecAt = (index: number) => {
    const inheritedCategory = items[index]?.category || '';
    updateAttributes({
      items: JSON.stringify([
        ...items.slice(0, index + 1),
        { category: inheritedCategory, key: '', value: '' },
        ...items.slice(index + 1)
      ])
    });
  };

  const removeSpec = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    updateAttributes({ items: JSON.stringify(next) });
  };

  const updateSpec = (index: number, field: 'category' | 'key' | 'value', val: string) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: val };
    updateAttributes({ items: JSON.stringify(next) });
  };

  return (
    <NodeViewWrapper className="my-4 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] overflow-hidden font-sans">
      <div className="bg-[var(--surface-3)] px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-500 border-b border-[var(--line)] flex items-center gap-2">
        <List className="w-4 h-4 text-red-500" />
        Specifications (3-Column: Category / Spec / Value)
      </div>
      <div className="p-3 flex flex-col gap-2">
        {/* Column Headers */}
        <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider px-2 pb-1">
          <div className="col-span-3">Category</div>
          <div className="col-span-3">Spec Name</div>
          <div className="col-span-5">Value</div>
          <div className="col-span-1"></div>
        </div>

        {items.map((spec: any, i: number) => {
          const isSameAsPrev = i > 0 && spec.category && spec.category === items[i - 1].category;
          return (
          <div key={i} className="grid grid-cols-12 gap-2 items-center bg-[var(--surface)] p-2 rounded-md border border-[var(--line)]">
            <div className="col-span-3">
              <input 
                type="text" 
                value={spec.category || ''} 
                onChange={(e) => updateSpec(i, 'category', e.target.value)}
                placeholder="Category"
                className={`w-full bg-transparent text-sm focus:outline-none placeholder:font-normal ${isSameAsPrev ? 'opacity-0 focus:opacity-100 placeholder:opacity-0 focus:placeholder:opacity-100 transition-opacity' : 'text-[var(--ink)] font-bold placeholder:text-[var(--muted)]'}`}
              />
            </div>
            <div className="col-span-3 border-l border-[var(--line)] pl-2">
              <input 
                type="text" 
                value={spec.key} 
                onChange={(e) => updateSpec(i, 'key', e.target.value)}
                placeholder="e.g. Type"
                className="w-full bg-transparent text-[var(--ink)] text-sm font-medium focus:outline-none placeholder:text-[var(--muted)] placeholder:font-normal"
              />
            </div>
            <div className="col-span-5 border-l border-[var(--line)] pl-2">
              <input 
                type="text" 
                value={spec.value} 
                onChange={(e) => updateSpec(i, 'value', e.target.value)}
                placeholder="e.g. 6.7&quot; OLED, 120Hz"
                className="w-full bg-transparent text-[var(--ink)] text-sm focus:outline-none placeholder:text-[var(--muted)]"
              />
            </div>
            <div className="col-span-1 flex justify-end items-center gap-1">
              <button type="button" onClick={() => insertSpecAt(i)} className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                <Plus className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => removeSpec(i)} className="text-[var(--muted)] hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          );
        })}
        
        {/* Add new row */}
        <div className="grid grid-cols-12 gap-2 items-center mt-1">
          <div className="col-span-3">
            <input 
              type="text" 
              value={newCategory} 
              onChange={e => setNewCategory(e.target.value)}
              placeholder={items.length > 0 ? `(Inherit: ${items[items.length - 1].category || 'None'})` : "Category"}
              className="w-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div className="col-span-3">
            <input 
              type="text" 
              value={newKey} 
              onChange={e => setNewKey(e.target.value)}
              placeholder="Spec Name"
              className="w-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div className="col-span-5">
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
              placeholder="Value"
              className="w-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div className="col-span-1 flex justify-end">
            <button type="button" onClick={addSpec} className="bg-[var(--surface-3)] hover:bg-[var(--line)] text-[var(--ink)] px-2.5 py-1.5 rounded-md border border-[var(--line)] transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
