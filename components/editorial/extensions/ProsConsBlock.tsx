import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState } from 'react';
import { Plus, X, Table } from 'lucide-react';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    prosCons: {
      insertProsCons: () => ReturnType;
      convertTableToProsCons: () => ReturnType;
      convertProsConsToTable: (pos?: number) => ReturnType;
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

      convertTableToProsCons: () => ({ state, dispatch, tr }) => {
        const { $from } = state.selection;
        let tableNode: any = null;
        let tablePos = -1;

        const selNode = (state.selection as any).node;
        if (selNode && selNode.type.name === 'table') {
          tableNode = selNode;
          tablePos = state.selection.from;
        } else {
          for (let d = $from.depth; d > 0; d--) {
            if ($from.node(d).type.name === 'table') {
              tableNode = $from.node(d);
              tablePos = $from.before(d);
              break;
            }
          }
        }

        if (!tableNode || tablePos < 0) {
          return false;
        }

        const pros: string[] = [];
        const cons: string[] = [];

        tableNode.forEach((rowNode: any) => {
          if (rowNode.type.name !== 'tableRow') return;

          const cells: string[] = [];
          rowNode.forEach((cellNode: any) => {
            if (cellNode.type.name === 'tableCell' || cellNode.type.name === 'tableHeader') {
              cells.push(cellNode.textContent.trim());
            }
          });

          if (cells.length === 0) return;

          const proText = cells[0] || '';
          const conText = cells[1] || '';

          // Skip completely empty rows
          if (!proText && !conText) return;

          // Smart Cleanup: skip header row if they just say "Pros" or "Cons" (case-insensitive)
          const isHeaderRow =
            (proText.toLowerCase() === 'pros' || proText.toLowerCase() === 'pro' || proText.toLowerCase() === 'advantages' || proText.toLowerCase() === 'the good') &&
            (conText.toLowerCase() === 'cons' || conText.toLowerCase() === 'con' || conText.toLowerCase() === 'disadvantages' || conText.toLowerCase() === 'the bad');
          if (isHeaderRow) return;

          // Extract Column 1 into pros (if non-empty and not just header label)
          if (proText && proText.toLowerCase() !== 'pros' && proText.toLowerCase() !== 'pro') {
            pros.push(proText);
          }

          // Extract Column 2 into cons (if non-empty and not just header label)
          if (conText && conText.toLowerCase() !== 'cons' && conText.toLowerCase() !== 'con') {
            cons.push(conText);
          }
        });

        if (pros.length === 0 && cons.length === 0) {
          pros.push('');
          cons.push('');
        }

        const prosConsType = state.schema.nodes.prosConsBlock;
        if (!prosConsType) return false;

        const newNode = prosConsType.create({
          pros: JSON.stringify(pros),
          cons: JSON.stringify(cons),
        });

        if (dispatch) {
          const transaction = tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newNode);
          dispatch(transaction.scrollIntoView());
        }

        return true;
      },

      convertProsConsToTable: (pos?: number) => ({ state, dispatch, tr }) => {
        let targetNode: any = null;
        let targetPos = -1;

        if (typeof pos === 'number' && pos >= 0) {
          const nodeAtPos = state.doc.nodeAt(pos);
          if (nodeAtPos && nodeAtPos.type.name === 'prosConsBlock') {
            targetNode = nodeAtPos;
            targetPos = pos;
          }
        }

        if (!targetNode) {
          const selNode = (state.selection as any).node;
          if (selNode && selNode.type.name === 'prosConsBlock') {
            targetNode = selNode;
            targetPos = state.selection.from;
          }
        }

        if (!targetNode) {
          const { $from } = state.selection;
          for (let d = $from.depth; d >= 0; d--) {
            if ($from.node(d).type.name === 'prosConsBlock') {
              targetNode = $from.node(d);
              targetPos = $from.before(d);
              break;
            }
          }
        }

        if (!targetNode) {
          const { $from } = state.selection;
          if ($from.nodeAfter && $from.nodeAfter.type.name === 'prosConsBlock') {
            targetNode = $from.nodeAfter;
            targetPos = $from.pos;
          } else if ($from.nodeBefore && $from.nodeBefore.type.name === 'prosConsBlock') {
            targetNode = $from.nodeBefore;
            targetPos = $from.pos - $from.nodeBefore.nodeSize;
          }
        }

        if (!targetNode || targetPos < 0) {
          return false;
        }

        let pros: string[] = [];
        let cons: string[] = [];
        try {
          pros = JSON.parse(targetNode.attrs.pros || '[]');
        } catch {}
        try {
          cons = JSON.parse(targetNode.attrs.cons || '[]');
        } catch {}

        if (!Array.isArray(pros)) pros = [];
        if (!Array.isArray(cons)) cons = [];

        const maxLen = Math.max(pros.length, cons.length) || 1;

        const { schema } = state;
        const tableType = schema.nodes.table;
        const tableRowType = schema.nodes.tableRow;
        const tableCellType = schema.nodes.tableCell;
        const pType = schema.nodes.paragraph;

        if (!tableType || !tableRowType || !tableCellType || !pType) {
          return false;
        }

        const createCell = (text: string) => {
          const p = text ? pType.create(null, schema.text(text)) : pType.create();
          return tableCellType.create(null, p);
        };

        const rows = [];
        for (let i = 0; i < maxLen; i++) {
          const pro = pros[i] || '';
          const con = cons[i] || '';
          rows.push(
            tableRowType.create(null, [
              createCell(pro),
              createCell(con),
            ])
          );
        }

        const tableNode = tableType.create(null, rows);

        if (dispatch) {
          const transaction = tr.replaceWith(targetPos, targetPos + targetNode.nodeSize, tableNode);
          dispatch(transaction.scrollIntoView());
        }

        return true;
      },
    };
  },
});

function ProsConsNodeView({ node, updateAttributes, editor, getPos }: any) {
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
      <div className="bg-[var(--surface-3)] px-4 py-2 text-sm font-semibold text-[var(--ink)] border-b border-[var(--line)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>Pros &amp; Cons Builder</span>
        </div>
        <button
          type="button"
          onClick={() => {
            const pos = typeof getPos === 'function' ? getPos() : undefined;
            if (editor) {
              (editor.chain().focus() as any).convertProsConsToTable(pos).run();
            }
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[var(--ink)] bg-[var(--surface)] hover:bg-[var(--line)] border border-[var(--line)] rounded shadow-sm transition-colors cursor-pointer"
          title="Convert to standard editable table"
        >
          <Table className="w-3.5 h-3.5 text-[var(--muted)]" />
          <span>Edit as Table</span>
        </button>
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
