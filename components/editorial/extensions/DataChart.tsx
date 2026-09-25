import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import React from 'react';
import DynamicChart from '@/components/article/DynamicChart';
import { BarChart, PieChart, LayoutTemplate, LineChart as LineChartIcon, ScatterChart as ScatterChartIcon, AlignLeft } from 'lucide-react';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    interactiveChart: {
      convertSelectionToChart: (type?: string) => ReturnType;
    };
  }
}
export const DataChart = Node.create({
  name: 'interactiveChart',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      config: {
        default: '[]',
        parseHTML: (element) => element.getAttribute('data-config'),
        renderHTML: (attributes) => {
          return {
            'data-config': attributes.config,
          };
        },
      },
      chartType: {
        default: 'bar',
        parseHTML: (element) => element.getAttribute('data-chart-type'),
        renderHTML: (attributes) => {
          return {
            'data-chart-type': attributes.chartType,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="interactive-chart"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'interactive-chart' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ChartNodeView);
  },

  addCommands() {
    return {
      convertSelectionToChart:
        (type = 'bar') =>
        ({ state, tr, dispatch, editor }) => {
          let rows: string[][] = [];
          let deleteFrom = state.selection.from;
          let deleteTo = state.selection.to;

          // 1. Try to find a Tiptap table in or around the selection
          let tableNode = null;
          let tablePos = -1;
          const $pos = state.selection.$anchor;
          
          for (let depth = $pos.depth; depth > 0; depth--) {
            const node = $pos.node(depth);
            if (node.type.name === 'table') {
              tableNode = node;
              tablePos = $pos.before(depth);
              break;
            }
          }

          if (!tableNode) {
            state.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
              if (node.type.name === 'table') {
                tableNode = node;
                tablePos = pos;
                return false;
              }
            });
          }

          if (tableNode) {
            tableNode.forEach((rowNode: any) => {
              if (rowNode.type.name === 'tableRow') {
                const row: string[] = [];
                rowNode.forEach((cellNode: any) => {
                  row.push(cellNode.textContent.trim());
                });
                rows.push(row);
              }
            });
            deleteFrom = tablePos;
            deleteTo = tablePos + tableNode.nodeSize;
          } else {
            // 2. Fallback to text parsing (Markdown, TSV, CSV)
            if (state.selection.empty) {
              alert("Selected text could not be parsed as chart data");
              return false;
            }

            const text = state.doc.textBetween(state.selection.from, state.selection.to, '\n');
            if (!text) {
              alert("Selected text could not be parsed as chart data");
              return false;
            }

            const lines = text.trim().split('\n').filter(line => line.trim().length > 0);
            
            if (lines.length < 2) {
              alert("Selected text could not be parsed as chart data");
              return false;
            }

            if (lines[0].includes('|')) {
              rows = lines
                .map(line => line.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0))
                .filter(row => row.length > 0);
              if (rows.length > 1 && rows[1].every(cell => cell.replace(/-/g, '').trim() === '' || cell.includes('---'))) {
                rows.splice(1, 1);
              }
            } else if (lines[0].includes('\t')) {
              rows = lines.map(line => line.split('\t').map(cell => cell.trim()));
            } else if (lines[0].includes(',')) {
              rows = lines.map(line => line.split(',').map(cell => cell.trim()));
            } else {
              // 3. Fallback Regex parser for Unicode progress bars and single-value lines
              const parsedRows: string[][] = [];
              parsedRows.push(['Label', 'Value']);
              
              let foundData = false;
              for (const line of lines) {
                // Remove unicode blocks, symbols
                let clean = line.replace(/[█░▓▒▄▀\[\]\|]/g, ' ').trim();
                
                // Find the first numeric block, optionally with +, -, $, %
                const numMatch = clean.match(/[-+]?\$?\d+(\.\d+)?[%]?/);
                if (numMatch) {
                  const rawNum = numMatch[0];
                  const valMatch = rawNum.match(/\d+(\.\d+)?/);
                  const val = valMatch ? valMatch[0] : '0';
                  
                  let label = clean.replace(rawNum, ''); // Remove the number block
                  label = label.replace(/\([^)]*\)/g, ''); // Remove parenthetical context completely
                  label = label.replace(/[\+\-\%\$:\,]/g, ''); // Remove stray symbols
                  label = label.replace(/\s+/g, ' ').trim();
                  
                  if (label.length > 0) {
                     parsedRows.push([label, val]);
                     foundData = true;
                  }
                }
              }
              if (foundData) {
                rows = parsedRows;
              }
            }
          }

          if (rows.length < 2) {
            alert("Selected text could not be parsed as chart data");
            return false;
          }

          const headers = rows[0];
          const dataRows = rows.slice(1);
          
          if (headers.length < 2) {
            alert("Selected text could not be parsed as chart data");
            return false;
          }

          let hasNumbers = false;
          for (const row of dataRows) {
            for (let i = 1; i < row.length; i++) {
              if (row[i] !== undefined && !isNaN(Number(row[i].replace(/[^0-9.-]+/g, "")))) {
                hasNumbers = true;
                break;
              }
            }
            if (hasNumbers) break;
          }

          if (!hasNumbers) {
            alert("Selected text could not be parsed as chart data");
            return false;
          }

          const config = dataRows.map(row => {
            const obj: Record<string, any> = { name: row[0] };
            for (let i = 1; i < headers.length; i++) {
              const val = Number(row[i]?.replace(/[^0-9.-]+/g, ""));
              obj[headers[i] || `Value ${i}`] = isNaN(val) ? 0 : val;
            }
            return obj;
          });

          if (dispatch) {
            tr.delete(deleteFrom, deleteTo);
            const chartNode = state.schema.nodes.interactiveChart.create({
              config: JSON.stringify(config),
              chartType: type,
            });
            tr.insert(deleteFrom, chartNode);
          }
          
          return true;
        },
    };
  },
});

function ChartNodeView({ node, updateAttributes }: any) {
  const config = JSON.parse(node.attrs.config || '[]');
  const chartType = node.attrs.chartType;

  return (
    <NodeViewWrapper className="my-8 relative group border border-[var(--line)] rounded-lg bg-[var(--surface-2)] p-4">
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-[var(--surface)] p-1 rounded-md border border-[var(--line)] shadow-sm">
        <button 
          type="button"
          onClick={() => updateAttributes({ chartType: 'bar' })}
          className={`p-1.5 rounded-sm ${chartType === 'bar' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]'}`}
          title="Vertical Bar"
        >
          <BarChart className="w-4 h-4" />
        </button>
        <button 
          type="button"
          onClick={() => updateAttributes({ chartType: 'horizontal-bar' })}
          className={`p-1.5 rounded-sm ${chartType === 'horizontal-bar' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]'}`}
          title="Horizontal Bar"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button 
          type="button"
          onClick={() => updateAttributes({ chartType: 'stacked' })}
          className={`p-1.5 rounded-sm ${chartType === 'stacked' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]'}`}
          title="Stacked Bar"
        >
          <LayoutTemplate className="w-4 h-4" />
        </button>
        <button 
          type="button"
          onClick={() => updateAttributes({ chartType: 'pie' })}
          className={`p-1.5 rounded-sm ${chartType === 'pie' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]'}`}
          title="Pie Chart"
        >
          <PieChart className="w-4 h-4" />
        </button>
        <button 
          type="button"
          onClick={() => updateAttributes({ chartType: 'line' })}
          className={`p-1.5 rounded-sm ${chartType === 'line' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]'}`}
          title="Line Chart"
        >
          <LineChartIcon className="w-4 h-4" />
        </button>
        <button 
          type="button"
          onClick={() => updateAttributes({ chartType: 'scatter' })}
          className={`p-1.5 rounded-sm ${chartType === 'scatter' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]'}`}
          title="Scatter Chart"
        >
          <ScatterChartIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="pointer-events-none">
        <DynamicChart config={config} chartType={chartType} animateOnce={false} />
      </div>
      
      <div className="mt-4 pt-2 border-t border-[var(--line)] flex justify-between items-center text-xs text-[var(--muted)]">
        <span>Interactive Chart</span>
        <span>{config.length} Data Points</span>
      </div>
    </NodeViewWrapper>
  );
}
