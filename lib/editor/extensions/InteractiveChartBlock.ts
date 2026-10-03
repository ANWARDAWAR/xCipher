import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    interactiveChartBlock: {
      setInteractiveChart: () => ReturnType;
    };
  }
}

export const InteractiveChartBlock = Node.create({
  name: 'interactiveChartBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      data: {
        default: '[]',
        parseHTML: (element) => element.getAttribute('data-chart-data'),
        renderHTML: (attributes) => ({
          'data-chart-data': attributes.data,
        }),
      },
      config: {
        default: '{}',
        parseHTML: (element) => element.getAttribute('data-chart-config'),
        renderHTML: (attributes) => ({
          'data-chart-config': attributes.config,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="smart-interactive-chart"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'smart-interactive-chart' }, HTMLAttributes)];
  },

  addCommands() {
    return {
      setInteractiveChart: () => ({ state, dispatch, tr }: any) => {
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

        const data: any[] = [];
        const config: Record<string, { prefix: string; suffix: string }> = {};
        
        let headers: string[] = [];

        tableNode.forEach((rowNode: any, rowIndex: number) => {
          if (rowNode.type.name !== 'tableRow') return;

          const cells: string[] = [];
          rowNode.forEach((cellNode: any) => {
            if (cellNode.type.name === 'tableCell' || cellNode.type.name === 'tableHeader') {
              cells.push(cellNode.textContent.trim());
            }
          });

          if (cells.length === 0) return;

          if (rowIndex === 0) {
            headers = cells;
            for (let i = 1; i < headers.length; i++) {
              config[headers[i]] = { prefix: '', suffix: '' };
            }
          } else {
            const rowData: any = { name: cells[0] };
            for (let i = 1; i < cells.length; i++) {
              const header = headers[i];
              if (!header) continue;
              
              const cellValue = cells[i] || '';
              // Regex to extract prefix, number, and suffix
              const match = cellValue.match(/^([^\d.-]*)([\d,.]+)([^\d]*)$/);
              
              if (match && match[2]) {
                const prefix = match[1].trim();
                const numStr = match[2].replace(/,/g, '');
                const suffix = match[3].trim();
                const numericValue = parseFloat(numStr);
                
                rowData[header] = isNaN(numericValue) ? 0 : numericValue;
                
                if (prefix && !config[header].prefix) config[header].prefix = prefix;
                if (suffix && !config[header].suffix) config[header].suffix = suffix;
              } else {
                rowData[header] = cellValue;
              }
            }
            data.push(rowData);
          }
        });

        const chartType = state.schema.nodes.interactiveChartBlock;
        if (!chartType) return false;

        const newNode = chartType.create({
          data: JSON.stringify(data),
          config: JSON.stringify(config),
        });

        if (dispatch) {
          const transaction = tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newNode);
          dispatch(transaction.scrollIntoView());
        }

        return true;
      },
    };
  },
});
