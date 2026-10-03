import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState } from 'react';
import { Plus, X, BarChart3, Table } from 'lucide-react';
import { calculateXSypherScore, isNAScore, type ScoreItem, BENCHMARK_TABS } from '@/lib/scoringEngine';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    scoreBreakdown: {
      insertScoreBreakdown: () => ReturnType;
      convertTableToScoreBreakdown: () => ReturnType;
      convertScoreBreakdownToTable: (pos?: number) => ReturnType;
    };
  }
}

const DEFAULT_BENCHMARK_ITEMS: ScoreItem[] = [
  // Camera Tab
  { tab: 'Camera', subCategory: 'Photo', metric: 'Main Lens', rawValue: '200MP f/1.7', score: 165, topScore: 168, weight: 1.2 },
  { tab: 'Camera', subCategory: 'Photo', metric: 'Ultrawide', rawValue: '50MP 120°', score: 154, topScore: 160, weight: 1.0 },
  { tab: 'Camera', subCategory: 'Photo', metric: 'Telephoto', rawValue: '50MP 5x Opt', score: 158, topScore: 162, weight: 1.0 },
  { tab: 'Camera', subCategory: 'Photo', metric: 'Bokeh', rawValue: 'f/1.4 Sim', score: 148, topScore: 152, weight: 0.8 },
  { tab: 'Camera', subCategory: 'Video', metric: 'Exposure', rawValue: '4K 60fps HDR', score: 156, topScore: 160, weight: 1.2 },
  { tab: 'Camera', subCategory: 'Video', metric: 'Stabilization', rawValue: 'OIS + EIS', score: 162, topScore: 164, weight: 1.0 },
  { tab: 'Camera', subCategory: 'Video', metric: 'Autofocus', rawValue: 'Dual Pixel PDAF', score: 159, topScore: 161, weight: 1.0 },

  // Battery Tab
  { tab: 'Battery', subCategory: 'Endurance', metric: 'Active Web', rawValue: '19h 45m', score: 172, topScore: 180, weight: 1.2 },
  { tab: 'Battery', subCategory: 'Endurance', metric: 'Video Playback', rawValue: '23h 10m', score: 168, topScore: 175, weight: 1.0 },
  { tab: 'Battery', subCategory: 'Charging', metric: 'Wired Fill', rawValue: '120W (19m)', score: 178, topScore: 185, weight: 1.0 },
  { tab: 'Battery', subCategory: 'Charging', metric: 'Wireless Fill', rawValue: '50W (42m)', score: 165, topScore: 170, weight: 0.8 },

  // Display Tab
  { tab: 'Display', subCategory: 'Readability', metric: 'Peak Sunlight', rawValue: '4500 nits', score: 165, topScore: 170, weight: 1.2 },
  { tab: 'Display', subCategory: 'Readability', metric: 'PWM Frequency', rawValue: '3840Hz', score: 160, topScore: 165, weight: 1.0 },
  { tab: 'Display', subCategory: 'Color', metric: 'DCI-P3 Gamut', rawValue: '100% Coverage', score: 158, topScore: 162, weight: 1.0 },
];

export const ScoreBreakdownBlock = Node.create({
  name: 'scoreBreakdownBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      items: {
        default: JSON.stringify(DEFAULT_BENCHMARK_ITEMS),
        parseHTML: (element) => element.getAttribute('data-items') || element.getAttribute('data-scores') || element.getAttribute('data-categories'),
        renderHTML: (attributes) => ({
          'data-items': attributes.items,
          'data-scores': attributes.items,
        }),
      },
      overallScore: {
        default: 165,
        parseHTML: (element) => Number(element.getAttribute('data-overall-score') || 0),
        renderHTML: (attributes) => ({
          'data-overall-score': attributes.overallScore,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="score-breakdown-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'score-breakdown-block' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ScoreBreakdownNodeView);
  },

  addCommands() {
    return {
      insertScoreBreakdown: () => ({ commands }) => {
        const computed = calculateXSypherScore(DEFAULT_BENCHMARK_ITEMS);
        return commands.insertContent({
          type: this.name,
          attrs: {
            items: JSON.stringify(DEFAULT_BENCHMARK_ITEMS),
            overallScore: computed.overallScore,
          },
        });
      },

      convertTableToScoreBreakdown: () => ({ state, dispatch, tr }) => {
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

        const items: ScoreItem[] = [];
        let currentTab = 'Camera';
        let currentSubCategory = 'General';

        tableNode.forEach((rowNode: any) => {
          if (rowNode.type.name !== 'tableRow') return;

          const cells: string[] = [];
          rowNode.forEach((cellNode: any) => {
            if (cellNode.type.name === 'tableCell' || cellNode.type.name === 'tableHeader') {
              cells.push(cellNode.textContent.trim());
            }
          });

          if (cells.length === 0) return;

          // Expect 7 columns: [Category | Sub-Category | Metric | Raw Value | Device Score | Top Score | Weight]
          // Or 6 columns fallback: [Category | Sub-Category | Metric | Device Score | Top Score | Weight]
          // Or 5 columns fallback: [Sub-Category | Metric | Device Score | Top Score | Weight]
          // Or 2-3 columns fallback
          let rawTab = '';
          let rawSubCategory = '';
          let rawMetric = '';
          let rawRawValue = '';
          let rawScoreStr = '';
          let rawTopScoreStr = '';
          let rawWeightStr = '';

          if (cells.length >= 7) {
            rawTab = cells[0];
            rawSubCategory = cells[1];
            rawMetric = cells[2];
            rawRawValue = cells[3];
            rawScoreStr = cells[4];
            rawTopScoreStr = cells[5];
            rawWeightStr = cells[6];
          } else if (cells.length === 6) {
            rawTab = cells[0];
            rawSubCategory = cells[1];
            rawMetric = cells[2];
            rawRawValue = '';
            rawScoreStr = cells[3];
            rawTopScoreStr = cells[4];
            rawWeightStr = cells[5];
          } else if (cells.length === 5) {
            rawTab = '';
            rawSubCategory = cells[0];
            rawMetric = cells[1];
            rawScoreStr = cells[2];
            rawTopScoreStr = cells[3];
            rawWeightStr = cells[4];
          } else if (cells.length === 3) {
            rawTab = '';
            rawSubCategory = cells[0];
            rawMetric = cells[1];
            rawScoreStr = cells[2];
          } else if (cells.length === 2) {
            rawTab = '';
            rawSubCategory = '';
            rawMetric = cells[0];
            rawScoreStr = cells[1];
          }

          // Skip completely empty rows
          if (!rawTab && !rawSubCategory && !rawMetric && !rawScoreStr && !rawRawValue) return;

          // Skip recognized header rows
          const isHeaderRow =
            (rawTab.toLowerCase().includes('tab') || rawTab.toLowerCase().includes('cat') || rawSubCategory.toLowerCase().includes('sub') || rawSubCategory.toLowerCase().includes('group')) &&
            (rawMetric.toLowerCase().includes('metric') || rawMetric.toLowerCase().includes('name') || rawMetric.toLowerCase().includes('spec')) &&
            (rawScoreStr.toLowerCase().includes('score') || rawScoreStr.toLowerCase().includes('val') || rawRawValue.toLowerCase().includes('raw') || rawRawValue.toLowerCase().includes('unit'));
          if (isHeaderRow) return;

          // Smart multi-level inheritance
          if (rawTab.trim() !== '') {
            currentTab = rawTab.trim();
          }
          if (rawSubCategory.trim() !== '') {
            currentSubCategory = rawSubCategory.trim();
          }

          const isScoreNA = isNAScore(rawScoreStr);
          const parsedScore = parseFloat(rawScoreStr);
          const finalScore = isScoreNA ? 'N/A' : (isNaN(parsedScore) ? 0 : parsedScore);

          const isTopScoreNA = rawTopScoreStr.trim() !== '' && isNAScore(rawTopScoreStr);
          const parsedTop = parseFloat(rawTopScoreStr);
          const finalTopScore = isTopScoreNA
            ? 'N/A'
            : (isNaN(parsedTop) ? (isScoreNA ? 'N/A' : finalScore) : parsedTop);

          const parsedWeight = parseFloat(rawWeightStr);
          const finalWeight = isNaN(parsedWeight) || parsedWeight <= 0 ? 1.0 : parsedWeight;

          const isUseCase =
            currentSubCategory.toLowerCase().includes('use case') ||
            currentSubCategory.toLowerCase().includes('usecase') ||
            currentTab.toLowerCase().includes('use case');

          const cleanRawValue = rawRawValue.trim();

          items.push({
            tab: currentTab,
            subCategory: currentSubCategory,
            group: currentSubCategory,
            metric: rawMetric.trim() || 'Metric',
            ...(cleanRawValue !== '' ? { rawValue: cleanRawValue } : {}),
            score: finalScore,
            topScore: isTopScoreNA || isScoreNA ? finalTopScore : Math.max(Number(finalTopScore) || 0, Number(finalScore) || 0),
            weight: finalWeight,
            isUseCase,
            ...(isScoreNA ? { isNA: true } : {}),
          });
        });

        if (items.length === 0) {
          items.push({
            tab: 'Camera',
            subCategory: 'General',
            group: 'General',
            metric: 'Performance',
            score: 100,
            topScore: 100,
            weight: 1.0,
          });
        }

        const scoreType = state.schema.nodes.scoreBreakdownBlock;
        if (!scoreType) return false;

        const breakdown = calculateXSypherScore(items);

        const newNode = scoreType.create({
          items: JSON.stringify(items),
          overallScore: breakdown.overallScore,
        });

        if (dispatch) {
          const transaction = tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newNode);
          dispatch(transaction.scrollIntoView());
        }

        return true;
      },

      convertScoreBreakdownToTable: (pos?: number) => ({ state, dispatch, tr }) => {
        let targetNode: any = null;
        let targetPos = -1;

        if (typeof pos === 'number' && pos >= 0) {
          const nodeAtPos = state.doc.nodeAt(pos);
          if (nodeAtPos && nodeAtPos.type.name === 'scoreBreakdownBlock') {
            targetNode = nodeAtPos;
            targetPos = pos;
          }
        }

        if (!targetNode) {
          const selNode = (state.selection as any).node;
          if (selNode && selNode.type.name === 'scoreBreakdownBlock') {
            targetNode = selNode;
            targetPos = state.selection.from;
          }
        }

        if (!targetNode) {
          const { $from } = state.selection;
          for (let d = $from.depth; d >= 0; d--) {
            if ($from.node(d).type.name === 'scoreBreakdownBlock') {
              targetNode = $from.node(d);
              targetPos = $from.before(d);
              break;
            }
          }
        }

        if (!targetNode) {
          const { $from } = state.selection;
          if ($from.nodeAfter && $from.nodeAfter.type.name === 'scoreBreakdownBlock') {
            targetNode = $from.nodeAfter;
            targetPos = $from.pos;
          } else if ($from.nodeBefore && $from.nodeBefore.type.name === 'scoreBreakdownBlock') {
            targetNode = $from.nodeBefore;
            targetPos = $from.pos - $from.nodeBefore.nodeSize;
          }
        }

        if (!targetNode || targetPos < 0) {
          return false;
        }

        let rawItems: any[] = [];
        try {
          rawItems = JSON.parse(targetNode.attrs.items || targetNode.attrs.categories || '[]');
        } catch {
          rawItems = [];
        }

        if (!Array.isArray(rawItems) || rawItems.length === 0) {
          rawItems = [
            {
              tab: 'Camera',
              subCategory: 'General',
              metric: 'Performance',
              score: 100,
              topScore: 100,
              weight: 1.0,
            },
          ];
        }

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

        const hasRawValues = rawItems.some((it: any) => it.rawValue !== undefined && it.rawValue !== '');

        const rows = rawItems.map((item: any) => {
          const tab = item.tab || 'Camera';
          const sub = item.subCategory || item.group || (item.isUseCase ? 'Use Cases' : 'General');
          const met = item.metric || item.label || 'Metric';
          const rawVal = item.rawValue || '';
          const scr = String(item.score ?? 0);
          const top = String(item.topScore ?? item.score ?? 0);
          const wgt = String(item.weight ?? 1.0);

          if (hasRawValues) {
            return tableRowType.create(null, [
              createCell(tab),
              createCell(sub),
              createCell(met),
              createCell(rawVal),
              createCell(scr),
              createCell(top),
              createCell(wgt),
            ]);
          }

          return tableRowType.create(null, [
            createCell(tab),
            createCell(sub),
            createCell(met),
            createCell(scr),
            createCell(top),
            createCell(wgt),
          ]);
        });

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

function ScoreBreakdownNodeView({ node, updateAttributes, editor, getPos }: any) {
  const rawData = JSON.parse(node.attrs.items || node.attrs.categories || '[]');
  const items: ScoreItem[] = Array.isArray(rawData) ? rawData : [];

  const [activeTabFilter, setActiveTabFilter] = useState<string>('All');
  const [newTab, setNewTab] = useState('');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [newMetric, setNewMetric] = useState('');
  const [newRawValue, setNewRawValue] = useState('');
  const [newScore, setNewScore] = useState<string | number>(150);
  const [newTopScore, setNewTopScore] = useState<string | number>(160);
  const [newWeight, setNewWeight] = useState(1.0);

  const breakdown = calculateXSypherScore(items);

  const syncItems = (nextItems: ScoreItem[]) => {
    const computed = calculateXSypherScore(nextItems);
    updateAttributes({
      items: JSON.stringify(nextItems),
      overallScore: computed.overallScore,
    });
  };

  const addItem = () => {
    if (newMetric.trim()) {
      const lastItem = items.length > 0 ? items[items.length - 1] : null;
      const inheritedTab = lastItem?.tab || (activeTabFilter !== 'All' ? activeTabFilter : 'Camera');
      const inheritedSub = lastItem?.subCategory || lastItem?.group || 'General';

      const finalTab = newTab.trim() !== '' ? newTab.trim() : inheritedTab;
      const finalSub = newSubCategory.trim() !== '' ? newSubCategory.trim() : inheritedSub;
      const isUseCase = finalSub.toLowerCase().includes('use case') || finalSub.toLowerCase().includes('usecase');
      const isScoreNA = isNAScore(newScore);

      const next = [
        ...items,
        {
          tab: finalTab,
          subCategory: finalSub,
          group: finalSub,
          metric: newMetric.trim(),
          ...(newRawValue.trim() !== '' ? { rawValue: newRawValue.trim() } : {}),
          score: isScoreNA ? 'N/A' : (Number(newScore) || 0),
          topScore: isNAScore(newTopScore) ? 'N/A' : Math.max(Number(newTopScore) || 0, Number(newScore) || 0),
          weight: Number(newWeight) || 1.0,
          isUseCase,
          ...(isScoreNA ? { isNA: true } : {}),
        },
      ];

      syncItems(next);
      setNewTab('');
      setNewSubCategory('');
      setNewMetric('');
      setNewRawValue('');
      setNewScore(150);
      setNewTopScore(160);
      setNewWeight(1.0);
    }
  };

  const removeItem = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    syncItems(next);
  };

  const updateItem = (index: number, field: keyof ScoreItem, val: any) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: val };
    if (field === 'subCategory') {
      next[index].group = val;
    }
    syncItems(next);
  };

  const displayedItems = activeTabFilter === 'All'
    ? items
    : items.filter((it) => (it.tab || 'Camera').toLowerCase() === activeTabFilter.toLowerCase());

  return (
    <NodeViewWrapper className="my-6 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] overflow-hidden font-sans">
      {/* Header Strip */}
      <div className="bg-[var(--surface-3)] px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-500 border-b border-[var(--line)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-red-500" />
          <span>7-Column Hybrid Benchmark Dashboard (0-200 Scale)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[var(--muted)]">
            Score: <strong className="text-[var(--ink)] text-sm">{breakdown.overallScore}</strong> / {breakdown.scaleMax}
          </span>
          <button
            type="button"
            onClick={() => {
              const pos = typeof getPos === 'function' ? getPos() : undefined;
              if (editor) {
                (editor.chain().focus() as any).convertScoreBreakdownToTable(pos).run();
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[var(--ink)] bg-[var(--surface)] hover:bg-[var(--line)] border border-[var(--line)] rounded shadow-sm transition-colors cursor-pointer"
            title="Convert to standard 7-column table"
          >
            <Table className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span>Edit as Table</span>
          </button>
        </div>
      </div>

      {/* Tab Filter Strip inside NodeView */}
      <div className="px-4 py-2 bg-[var(--surface)] border-b border-[var(--line)] flex items-center gap-1 overflow-x-auto text-xs">
        <span className="text-[var(--muted)] font-medium mr-2">Filter View:</span>
        <button
          type="button"
          onClick={() => setActiveTabFilter('All')}
          className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
            activeTabFilter === 'All' ? 'bg-red-600 text-white font-bold' : 'text-[var(--muted)] hover:text-[var(--ink)]'
          }`}
        >
          All ({items.length})
        </button>
        {BENCHMARK_TABS.map((tab) => {
          const count = items.filter((it) => (it.tab || 'Camera').toLowerCase() === tab.toLowerCase()).length;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTabFilter(tab)}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                activeTabFilter === tab ? 'bg-red-600 text-white font-bold' : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              {tab} {count > 0 ? `(${count})` : ''}
            </button>
          );
        })}
      </div>

      {/* Editor Content Area */}
      <div className="p-4 flex flex-col gap-3">
        {/* Table column header labels */}
        <div className="grid grid-cols-12 gap-1.5 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider px-2">
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Sub-Cat</div>
          <div className="col-span-3">Metric Name</div>
          <div className="col-span-2">Raw Value</div>
          <div className="col-span-1">Score</div>
          <div className="col-span-1">Top</div>
          <div className="col-span-1"></div>
        </div>

        {/* Existing Metric Rows */}
        {displayedItems.map((item) => {
          const i = items.indexOf(item);
          const isSameAsPrev = i > 0 && item.tab === items[i - 1].tab && item.subCategory === items[i - 1].subCategory;

          return (
            <div key={i} className="grid grid-cols-12 gap-1.5 items-center bg-[var(--surface)] p-2 rounded-md border border-[var(--line)]">
              <div className="col-span-2">
                <input
                  type="text"
                  value={item.tab || ''}
                  onChange={(e) => updateItem(i, 'tab', e.target.value)}
                  placeholder="Category"
                  className={`w-full bg-transparent text-xs font-bold focus:outline-none ${isSameAsPrev ? 'opacity-40 focus:opacity-100' : 'text-[var(--ink)]'}`}
                />
              </div>
              <div className="col-span-2 border-l border-[var(--line)] pl-1.5">
                <input
                  type="text"
                  value={item.subCategory || item.group || ''}
                  onChange={(e) => updateItem(i, 'subCategory', e.target.value)}
                  placeholder="Sub-Category"
                  className={`w-full bg-transparent text-xs font-semibold focus:outline-none ${isSameAsPrev ? 'opacity-40 focus:opacity-100' : 'text-[var(--ink)]'}`}
                />
              </div>
              <div className="col-span-3 border-l border-[var(--line)] pl-1.5">
                <input
                  type="text"
                  value={item.metric}
                  onChange={(e) => updateItem(i, 'metric', e.target.value)}
                  placeholder="Metric"
                  className="w-full bg-transparent text-xs font-medium text-[var(--ink)] focus:outline-none"
                />
              </div>
              <div className="col-span-2 border-l border-[var(--line)] pl-1.5">
                <input
                  type="text"
                  value={item.rawValue || ''}
                  onChange={(e) => updateItem(i, 'rawValue', e.target.value)}
                  placeholder="e.g. 18h 30m"
                  className="w-full bg-transparent text-xs font-medium text-neutral-400 focus:outline-none"
                />
              </div>
              <div className="col-span-1 border-l border-[var(--line)] pl-1.5">
                <input
                  type="text"
                  value={String(item.score)}
                  onChange={(e) => updateItem(i, 'score', e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-red-600 dark:text-red-400 focus:outline-none"
                />
              </div>
              <div className="col-span-1 border-l border-[var(--line)] pl-1.5">
                <input
                  type="text"
                  value={String(item.topScore ?? item.score)}
                  onChange={(e) => updateItem(i, 'topScore', e.target.value)}
                  className="w-full bg-transparent text-xs font-medium text-[var(--muted)] focus:outline-none"
                />
              </div>
              <div className="col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="text-[var(--muted)] hover:text-red-500 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add New Row */}
        <div className="grid grid-cols-12 gap-1.5 items-center mt-2 border-t border-[var(--line)] pt-3">
          <div className="col-span-2">
            <input
              type="text"
              value={newTab}
              onChange={(e) => setNewTab(e.target.value)}
              placeholder={items.length > 0 ? `(Inherit: ${items[items.length - 1].tab || 'Camera'})` : 'Category'}
              className="w-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-md px-2 py-1 text-xs focus:outline-none"
            />
          </div>
          <div className="col-span-2">
            <input
              type="text"
              value={newSubCategory}
              onChange={(e) => setNewSubCategory(e.target.value)}
              placeholder={items.length > 0 ? `(Inherit: ${items[items.length - 1].subCategory || 'General'})` : 'Sub-Cat'}
              className="w-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-md px-2 py-1 text-xs focus:outline-none"
            />
          </div>
          <div className="col-span-3">
            <input
              type="text"
              value={newMetric}
              onChange={(e) => setNewMetric(e.target.value)}
              placeholder="e.g. Video Playback"
              className="w-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-md px-2 py-1 text-xs focus:outline-none"
            />
          </div>
          <div className="col-span-2">
            <input
              type="text"
              value={newRawValue}
              onChange={(e) => setNewRawValue(e.target.value)}
              placeholder="e.g. 18h 30m"
              className="w-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-md px-2 py-1 text-xs focus:outline-none"
            />
          </div>
          <div className="col-span-1">
            <input
              type="text"
              value={String(newScore)}
              onChange={(e) => setNewScore(e.target.value)}
              placeholder="Score"
              className="w-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-md px-1.5 py-1 text-xs focus:outline-none"
            />
          </div>
          <div className="col-span-1">
            <input
              type="text"
              value={String(newTopScore)}
              onChange={(e) => setNewTopScore(e.target.value)}
              placeholder="Top"
              className="w-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-md px-1.5 py-1 text-xs focus:outline-none"
            />
          </div>
          <div className="col-span-1 flex justify-end">
            <button
              type="button"
              onClick={addItem}
              className="bg-[var(--surface-3)] hover:bg-[var(--line)] text-[var(--ink)] p-1.5 rounded-md border border-[var(--line)] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
