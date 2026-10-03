import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { Plugin } from '@tiptap/pm/state';
import { useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { BLOCK_LABELS, editorialBlockSchema, newEditorialBlock, parseEditorialBlock, socialPost, type BlockKind, type EditorialBlock as BlockData } from '@/lib/editorial-blocks';
import EditorialBlockViewer from '@/components/article/EditorialBlockViewer';
import ImageDropzone from '../ImageDropzone';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    editorialBlock: { insertEditorialBlock: (kind: BlockKind) => ReturnType };
  }
}

export const EditorialBlock = Node.create({
  name: 'editorialBlock', group: 'block', atom: true, draggable: true,
  addAttributes() {
    return { data: {
      default: newEditorialBlock('verdict'),
      parseHTML: element => {
        try { return JSON.parse(element.getAttribute('data-editorial-block') || '{}'); }
        catch { return {}; }
      },
      renderHTML: attrs => ({ 'data-editorial-block': JSON.stringify(attrs.data) }),
    } };
  },
  parseHTML() { return [{ tag: 'div[data-type="editorial-block"]' }]; },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'editorial-block' })]; },
  addNodeView() { return ReactNodeViewRenderer(EditorialNodeView); },
  addProseMirrorPlugins() {
    return [new Plugin({
      props: {
        handlePaste: (view, event) => {
          const parsed = parseComparisonPaste(event);
          if (!parsed) return false;

          const nodeType = view.state.schema.nodes.editorialBlock;
          if (!nodeType) return false;

          const node = nodeType.create({ data: parsed });
          const transaction = view.state.tr.replaceSelectionWith(node);
          view.dispatch(transaction);
          return true;
        },
      },
    })];
  },
  addCommands() { return { insertEditorialBlock: kind => ({ commands }) => commands.insertContent([{ type: this.name, attrs: { data: newEditorialBlock(kind) } }, { type: 'paragraph' }]) }; },
});

type ComparisonRow = NonNullable<Extract<BlockData, { kind: 'comparison' }>['rows']>[number];

function cleanCell(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseSpecsText(rawText: string): Record<string, { category: string; value: string }> {
  const KNOWN_CATEGORIES = new Set(['NETWORK', 'LAUNCH', 'BODY', 'DISPLAY', 'PLATFORM', 'MEMORY', 'MAIN CAMERA', 'SELFIE CAMERA', 'CAMERA', 'SOUND', 'COMMS', 'FEATURES', 'BATTERY', 'MISC']);
  const KNOWN_SPECS = new Set(['5G', '4G', '3G', '2G', '1G', 'HDR', 'OS', 'CPU', 'GPU', 'NPU', 'SIM', 'RAM', 'ROM', 'NFC', 'GPS', 'USB', 'WLAN']);
  const HEADERS = new Set(['category', 'spec name', 'value', 'specification sheet', 'specification']);
  const specs: Record<string, { category: string; value: string }> = Object.create(null);
  let currentCategory = 'General';
  let currentSpec: string | null = null;

  for (const rawLine of rawText.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    if (HEADERS.has(line.toLowerCase())) continue;

    // Preserve leading/trailing tabs: an empty category or value is still a cell.
    // TSV rows take precedence even when a vertical spec is awaiting a value.
    if (rawLine.includes('\t')) {
      const cols = rawLine.split('\t').map(cell => cell.trim());
      // The standalone guard above cannot match a complete TSV header row.
      if (cols[0].toLowerCase() === 'category'
        || HEADERS.has(cols[cols.length >= 3 ? 1 : 0].toLowerCase())) continue;
      if (cols.length >= 3) {
        if (cols[0]) currentCategory = cols[0].toUpperCase();
        if (cols[1]) specs[cols[1]] = { category: currentCategory, value: cols[2] || 'N/A' };
      } else if (cols.length === 2) {
        if (cols[0]) specs[cols[0]] = { category: currentCategory, value: cols[1] || 'N/A' };
      }
      currentSpec = null;
      continue;
    }

    const isCategory = KNOWN_CATEGORIES.has(line)
      || (line === line.toUpperCase() && line.length < 25 && !KNOWN_SPECS.has(line));
    if (isCategory) {
      currentCategory = line;
      currentSpec = null;
      continue;
    }

    if (currentSpec === null) {
      currentSpec = line;
    } else {
      specs[currentSpec] = { category: currentCategory, value: line };
      currentSpec = null;
    }
  }

  return specs;
}

function comparisonRow(_category: string, spec: string, first: string, second: string): ComparisonRow | null {
  const values = [spec, first, second].map(cleanCell);
  if (!values[0] || !values[1]) return null;
  return { spec: values[0], first: values[1], second: values[2], winner: 'none' };
}

function parseComparisonRows(rows: string[][]): Extract<BlockData, { kind: 'comparison' }> | null {
  const normalized = rows
    .map(row => row.map(cleanCell))
    .filter(row => row.filter(Boolean).length >= 2);
  if (normalized.length < 2) return null;

  const firstRow = normalized[0];
  const headerText = firstRow.join(' ').toLowerCase();
  const hasHeader = /\b(category|specification|spec|device|model|phone)\b/.test(headerText);
  const headers = hasHeader ? firstRow : [];
  const dataRows = hasHeader ? normalized.slice(1) : normalized;
  if (dataRows.length === 0) return null;

  const columnCount = Math.max(...dataRows.map(row => row.length));
  if (columnCount < 2 || columnCount > 4) return null;

  const first = headers[2] || (columnCount >= 3 ? 'Device A' : 'Device');
  const second = headers[3] || (columnCount >= 4 ? 'Device B' : '');
  const parsedRows: ComparisonRow[] = [];
  let category = '';

  for (const row of dataRows) {
    if (columnCount >= 4) {
      category = row[0] || category;
      const parsed = comparisonRow(category, row[1], row[2], row[3] || '');
      if (parsed) parsedRows.push(parsed);
    } else if (columnCount === 3) {
      const categoryColumn = headers.length > 0 && /\b(category|section|group)\b/.test(headers[0].toLowerCase());
      const parsed = categoryColumn
        ? comparisonRow(row[0], row[1], row[2], '')
        : comparisonRow('', row[0], row[1], row[2]);
      if (parsed) parsedRows.push(parsed);
    } else {
      const parsed = comparisonRow('', row[0], row[1], '');
      if (parsed) parsedRows.push(parsed);
    }
  }

  if (parsedRows.length === 0) return null;
  return {
    kind: 'comparison',
    title: 'Device comparison',
    first,
    second: second || 'Device B',
    rows: parsedRows.slice(0, 100),
  };
}

function parseComparisonPaste(event: ClipboardEvent): Extract<BlockData, { kind: 'comparison' }> | null {
  const html = event.clipboardData?.getData('text/html') || '';
  const text = event.clipboardData?.getData('text/plain') || '';
  let rows: string[][] = [];

  if (html && typeof DOMParser !== 'undefined') {
    const document = new DOMParser().parseFromString(html, 'text/html');
    const table = document.querySelector('table');
    if (table) {
      const grid: string[][] = [];
      rows = Array.from(table.querySelectorAll('tr')).map((tr, rowIndex) => {
        const cells = Array.from(tr.querySelectorAll(':scope > th, :scope > td'));
        const values = grid[rowIndex] || [];
        grid[rowIndex] = values;
        let column = 0;
        for (const cell of cells) {
          while (values[column] !== undefined) column += 1;
          const value = cleanCell(cell.textContent || '');
          const rowSpan = Number(cell.getAttribute('rowspan') || 1);
          const colSpan = Number(cell.getAttribute('colspan') || 1);
          for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
            const target = grid[rowIndex + rowOffset] || (grid[rowIndex + rowOffset] = []);
            for (let colOffset = 0; colOffset < colSpan; colOffset += 1) {
              target[column + colOffset] = value;
            }
          }
          values[column] = value;
          column += colSpan;
        }
        return values;
      });
    }
  }

  if (rows.length === 0) {
    rows = text.split(/\r?\n/)
      .map(line => line.split(/\t|\s+\|\s+|\|/).map(cleanCell))
      .filter(row => row.filter(Boolean).length >= 2);
  }

  const parsed = parseComparisonRows(rows);
  if (!parsed || !/\b(network|display|dimension|cpu|processor|memory|storage|battery|camera|os|price|weight|technology)\b/i.test(text || rows.flat().join(' '))) {
    return null;
  }
  return parsed;
}

function Field({ label, value, onChange, multiline = false, options }: { label: string; value: string | number; onChange: (value: string) => void; multiline?: boolean; options?: readonly string[] }) {
  return <label className="block-field"><span>{label}</span>{options
    ? <select value={value} onChange={event => onChange(event.target.value)}>{options.map(option => <option key={option}>{option}</option>)}</select>
    : multiline ? <textarea rows={3} value={value} onChange={event => onChange(event.target.value)} />
      : <input type={typeof value === 'number' ? 'number' : 'text'} step={typeof value === 'number' ? '0.1' : undefined} min={typeof value === 'number' ? 0 : undefined} max={typeof value === 'number' ? 10 : undefined} value={value} onChange={event => onChange(event.target.value)} />}</label>;
}

type Photo = Extract<BlockData, { kind: 'gallery' }>['images'][number];
function PhotoFields({ photo, update }: { photo: Photo; update: (photo: Photo) => void }) {
  const upload = async (file: File) => {
    const body = new FormData(); body.append('file', file);
    const response = await fetch('/api/upload', { method: 'POST', body });
    const result = await response.json();
    return response.ok ? result : { ok: false, error: result.error || 'Upload failed' };
  };

  return <div className="block-field-grid">
    <Field label="Image URL" value={photo.src} onChange={src => update({ ...photo, src })} />
    <Field label="Alternative text" value={photo.alt} onChange={alt => update({ ...photo, alt })} />
    <Field label="Caption" value={photo.caption} onChange={caption => update({ ...photo, caption })} />
    <Field label="Photo credit" value={photo.credit} onChange={credit => update({ ...photo, credit })} />
    <div className="block-upload">
      {/^https?:\/\//i.test(photo.src) ? (
        <div className="editor-image-preview">
          {/* Native img keeps the editor preview independent of Next image-host configuration. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.src} alt={photo.alt || 'Uploaded image'} className="object-cover w-full h-full rounded-lg" />
          <button type="button" className="editor-image-preview-remove" onClick={() => update({ ...photo, src: '' })} aria-label="Replace uploaded image">
            <Trash2 size={14} /> Replace
          </button>
        </div>
      ) : (
        <ImageDropzone onUpload={upload} onUploaded={src => update({ ...photo, src, alt: photo.alt.trim() || 'Uploaded image' })} label="Upload an image" />
      )}
    </div>
  </div>;
}

function BlockFields({ data, update }: { data: BlockData; update: (data: BlockData) => void }) {
  switch (data.kind) {
    case 'verdict': return <>
      <div className="block-field-grid"><Field label="Product name" value={data.product} onChange={product => update({ ...data, product })} /><Field label="Score out of 10" value={data.score} onChange={score => update({ ...data, score: Number(score) })} /></div>
      <Field label="Badge" value={data.badge} options={['Final verdict', 'Editor’s choice', 'Recommended', 'Best value']} onChange={badge => update({ ...data, badge: badge as typeof data.badge })} />
      <Field label="Your verdict" multiline value={data.summary} onChange={summary => update({ ...data, summary })} />
    </>;
    case 'social': return <><Field label="Full X post or TikTok video URL" value={data.url} onChange={url => {
      const parsed = socialPost(url);
      update({ ...data, url, provider: parsed?.provider, postId: parsed?.id });
    }} /><Field label="Caption" value={data.caption} onChange={caption => update({ ...data, caption })} /></>;
    case 'toc': return <Field label="Title" value={data.title} onChange={title => update({ ...data, title })} />;
    case 'slider': return <>
      <Field label="Comparison title" value={data.title} onChange={title => update({ ...data, title })} />
      <Field label="Left label" value={data.beforeLabel} onChange={beforeLabel => update({ ...data, beforeLabel })} /><PhotoFields photo={data.before} update={before => update({ ...data, before })} />
      <Field label="Right label" value={data.afterLabel} onChange={afterLabel => update({ ...data, afterLabel })} /><PhotoFields photo={data.after} update={after => update({ ...data, after })} />
    </>;
    case 'gallery': return <>
      <div className="block-field-grid"><Field label="Gallery title" value={data.title} onChange={title => update({ ...data, title })} /><Field label="Layout" value={data.layout} options={['two', 'three', 'masonry']} onChange={layout => update({ ...data, layout: layout as typeof data.layout })} /></div>
      {data.images.map((photo, i) => <fieldset className="block-row" key={i}><legend>Image {i + 1}</legend>
        <PhotoFields photo={photo} update={next => update({ ...data, images: data.images.map((item, n) => n === i ? next : item) })} />
        <div className="block-row-actions">
          <button type="button" disabled={i === 0} onClick={() => { const images = [...data.images]; [images[i - 1], images[i]] = [images[i], images[i - 1]]; update({ ...data, images }); }} aria-label="Move image up"><ArrowUp size={14} /></button>
          <button type="button" disabled={i === data.images.length - 1} onClick={() => { const images = [...data.images]; [images[i], images[i + 1]] = [images[i + 1], images[i]]; update({ ...data, images }); }} aria-label="Move image down"><ArrowDown size={14} /></button>
          <button type="button" onClick={() => update({ ...data, images: data.images.filter((_, n) => n !== i) })}>Remove image</button>
        </div>
      </fieldset>)}
      <button type="button" className="block-add" disabled={data.images.length >= 24} onClick={() => update({ ...data, images: [...data.images, { src: '', alt: '', caption: '', credit: '' }] })}><Plus size={14} /> Add image</button>
    </>;
    case 'affiliate': return <>
      <Field label="Product name" value={data.product} onChange={product => update({ ...data, product })} />
      {data.offers.map((offer, i) => <fieldset className="block-row" key={i}><legend>Retailer {i + 1}</legend><div className="block-field-grid">
        {(['retailer', 'price', 'url', 'logo'] as const).map(key => <Field key={key} label={{ retailer: 'Retailer name', price: 'Price (include currency)', url: 'Affiliate URL', logo: 'Logo URL (optional)' }[key]} value={offer[key]} onChange={value => update({ ...data, offers: data.offers.map((item, n) => n === i ? { ...item, [key]: value } : item) })} />)}
      </div><button type="button" onClick={() => update({ ...data, offers: data.offers.filter((_, n) => n !== i) })}>Remove retailer</button></fieldset>)}
      <button type="button" className="block-add" disabled={data.offers.length >= 12} onClick={() => update({ ...data, offers: [...data.offers, { retailer: '', price: '', url: '', logo: '' }] })}><Plus size={14} /> Add retailer</button>
      <Field label="Affiliate disclosure" multiline value={data.disclosure} onChange={disclosure => update({ ...data, disclosure })} />
    </>;
    case 'comparison': return <ComparisonFields data={data} update={update} />;
  }
}

function ComparisonFields({ data, update }: {
  data: Extract<BlockData, { kind: 'comparison' }>;
  update: (data: BlockData) => void;
}) {
  const [bulkFirst, setBulkFirst] = useState('');
  const [bulkSecond, setBulkSecond] = useState('');
  const emptyPhoto = { src: '', alt: '', caption: '', credit: '' };

  const mergeAndGenerate = () => {
    const mapA = parseSpecsText(bulkFirst);
    const mapB = parseSpecsText(bulkSecond);
    console.log('Parsed Maps:', { mapA, mapB });
    const uniqueSpecs = Array.from(new Set([...Object.keys(mapA), ...Object.keys(mapB)]));
    const mergedRows: ComparisonRow[] = uniqueSpecs.map(spec => {
      const a = mapA[spec];
      const b = mapB[spec];
      return {
        category: a?.category || b?.category || 'General',
        spec,
        first: a?.value || 'N/A',
        second: b?.value || 'N/A',
        winner: 'none',
      };
    });

    update({ ...data, rows: mergedRows });
    if (mergedRows.length === 0) {
      alert('Could not parse any specs. Please check the pasted format.');
      return;
    }
    setBulkFirst('');
    setBulkSecond('');
  };

  return <>
    <Field label="Comparison Title" value={data.title || ''} onChange={title => update({ ...data, title })} />
    
    <fieldset className="block-row">
      <legend>Device A Section</legend>
      <div className="block-field-grid">
        <Field label="Device A Name" value={data.first || ''} onChange={first => update({ ...data, first })} />
        <Field label="Device A Affiliate / Buy Link" value={data.firstLink || ''} onChange={firstLink => update({ ...data, firstLink })} />
      </div>
      <PhotoFields photo={data.firstImage || emptyPhoto} update={photo => update({ ...data, firstImage: photo })} />
      
      <label className="block-field" style={{ marginTop: '1rem' }}>
        <span>Paste Device A Specs Table Here</span>
        <textarea value={bulkFirst} onChange={event => setBulkFirst(event.target.value)} rows={4} placeholder="Category&#9;Specification&#9;Value" />
      </label>
    </fieldset>

    <fieldset className="block-row">
      <legend>Device B Section</legend>
      <div className="block-field-grid">
        <Field label="Device B Name" value={data.second || ''} onChange={second => update({ ...data, second })} />
        <Field label="Device B Affiliate / Buy Link" value={data.secondLink || ''} onChange={secondLink => update({ ...data, secondLink })} />
      </div>
      <PhotoFields photo={data.secondImage || emptyPhoto} update={photo => update({ ...data, secondImage: photo })} />
      
      <label className="block-field" style={{ marginTop: '1rem' }}>
        <span>Paste Device B Specs Table Here</span>
        <textarea value={bulkSecond} onChange={event => setBulkSecond(event.target.value)} rows={4} placeholder="Category&#9;Specification&#9;Value" />
      </label>
    </fieldset>

    <div className="block-row" style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
      <button type="button" className="block-add" onClick={mergeAndGenerate} disabled={!bulkFirst.trim() && !bulkSecond.trim()} style={{ fontSize: '1rem', padding: '0.75rem 2rem', fontWeight: 'bold' }}>
        Merge &amp; Generate Comparison Table
      </button>
    </div>

    {data.rows && data.rows.length > 0 && <fieldset className="block-row" style={{ marginTop: '1rem' }}>
      <legend>Merged Specifications</legend>
      {data.rows.map((row, i) => <fieldset className="block-row" key={i}>
        <div className="block-field-grid">
          <Field label="Category" value={row.category || ''} onChange={category => update({ ...data, rows: (data.rows || []).map((item, n) => n === i ? { ...item, category } : item) })} />
          <Field label="Spec Name" value={row.spec || ''} onChange={spec => update({ ...data, rows: (data.rows || []).map((item, n) => n === i ? { ...item, spec } : item) })} />
          <Field label={`${data.first || 'Device A'} Value`} value={row.firstValue || row.first || ''} onChange={firstValue => update({ ...data, rows: (data.rows || []).map((item, n) => n === i ? { ...item, firstValue } : item) })} />
          <Field label={`${data.second || 'Device B'} Value`} value={row.secondValue || row.second || ''} onChange={secondValue => update({ ...data, rows: (data.rows || []).map((item, n) => n === i ? { ...item, secondValue } : item) })} />
        </div>
        <button type="button" onClick={() => update({ ...data, rows: (data.rows || []).filter((_, n) => n !== i) })}>Remove row</button>
      </fieldset>)}
      <button type="button" className="block-add" onClick={() => update({ ...data, rows: [...(data.rows || []), { category: '', spec: '', firstValue: '', secondValue: '', winner: 'none' }] })}><Plus size={14} /> Add manual row</button>
    </fieldset>}
  </>;
}

function EditorialNodeView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const valid = parseEditorialBlock(node.attrs.data);
  const [editing, setEditing] = useState(!valid);
  const [showErrors, setShowErrors] = useState(false);
  // An imported malformed node stays removable without crashing the editor.
  const raw = node.attrs.data as BlockData;
  const known = raw && typeof raw === 'object' && Object.hasOwn(BLOCK_LABELS, raw.kind);
  const data = known ? raw : newEditorialBlock('verdict');
  const result = editorialBlockSchema.safeParse(data);
  const editable = result.success || result.error.issues.every(issue => issue.code !== 'invalid_type');
  return <NodeViewWrapper className={`editorial-node ${selected ? 'is-selected' : ''}`} contentEditable={false}>
    <div className="editorial-node-bar"><span data-drag-handle>⠿ &nbsp; {BLOCK_LABELS[data.kind]}</span><div>
      <button type="button" onClick={() => { if (editing && !result.success) { setShowErrors(true); return; } setEditing(!editing); }}><Pencil size={13} />{editing ? 'Done' : 'Edit'}</button>
      <button type="button" onClick={deleteNode} aria-label={`Delete ${BLOCK_LABELS[data.kind]}`}><Trash2 size={14} /></button>
    </div></div>
    {editing && <div className="editorial-node-fields">{editable ? <BlockFields data={data} update={next => updateAttributes({ data: next })} /> : <p>This imported block contains invalid data. Remove it and insert a new block.</p>}
      {showErrors && !result.success && <ul className="block-errors" role="alert">{result.error.issues.map((issue, i) => <li key={i}>{issue.path.join(' → ')}: {issue.message}</li>)}</ul>}
    </div>}
    {valid ? <EditorialBlockViewer block={valid} preview /> : !editing && <p className="block-empty">Complete this block to show its preview.</p>}
  </NodeViewWrapper>;
}
