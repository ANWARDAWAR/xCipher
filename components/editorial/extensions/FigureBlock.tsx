import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { InsertMediaDialog } from '../InsertMediaDialog';

export default function FigureBlock({ node, updateAttributes, deleteNode, selected, editor, getPos }: NodeViewProps) {
  const [editing, setEditing] = useState(false);

  return (
    <NodeViewWrapper className={`editorial-node ${selected ? 'is-selected' : ''}`}>
      <div className="editorial-node-bar" contentEditable={false}>
        <span data-drag-handle>⠿ &nbsp; Single Image</span>
        <div>
          <button type="button" onClick={() => setEditing(true)}><Pencil size={13} /> Edit</button>
          <button type="button" onClick={deleteNode} aria-label="Delete image"><Trash2 size={14} /></button>
        </div>
      </div>
      
      <figure className="ed-figure" data-credit={node.attrs.credit}>
        <img src={node.attrs.src} alt={node.attrs.alt} title={node.attrs.title} />
        <figcaption>
          <NodeViewContent className="inline" />
          {node.attrs.credit && (
            <span className="credit block text-[10px] uppercase tracking-wider mt-1 text-[var(--muted)]" contentEditable={false}>
              Image Credit: {node.attrs.credit}
            </span>
          )}
        </figcaption>
      </figure>

      <InsertMediaDialog 
        kind="image"
        initialImage={{
          src: node.attrs.src,
          alt: node.attrs.alt,
          credit: node.attrs.credit,
          caption: node.textContent,
        }}
        open={editing}
        onClose={() => setEditing(false)}
        onInsertImage={(v) => {
          updateAttributes({ src: v.src, alt: v.alt, caption: v.caption, credit: v.credit });
          if (typeof getPos === "function") {
            editor.commands.command(({ tr }) => {
              const position = getPos();
              if (position === undefined) return false;
              const currentNode = tr.doc.nodeAt(position);
              if (!currentNode || currentNode.type.name !== "figure") return false;

              const contentStart = position + 1;
              tr.replaceWith(
                contentStart,
                contentStart + currentNode.content.size,
                v.caption ? editor.schema.text(v.caption) : [],
              );
              return true;
            });
          }
          setEditing(false);
        }}
        onInsertVideo={() => {}}
      />
    </NodeViewWrapper>
  );
}
