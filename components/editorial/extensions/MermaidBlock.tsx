import { Node, mergeAttributes, textblockTypeInputRule, nodePasteRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MermaidNodeView } from './MermaidNodeView';

export interface MermaidBlockOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mermaidBlock: {
      setMermaidBlock: (attributes?: { graphDefinition: string }) => ReturnType;
      convertSelectionToMermaid: () => ReturnType;
    };
  }
}

export const MermaidBlock = Node.create<MermaidBlockOptions>({
  name: 'mermaidBlock',
  group: 'block',
  content: 'inline*',
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      graphDefinition: {
        default: 'graph TD\n  A-->B;',
        parseHTML: element => element.getAttribute('data-graph-definition'),
        renderHTML: attributes => {
          return {
            'data-graph-definition': attributes.graphDefinition,
          };
        },
      },
      containerWidth: {
        default: '100%',
        parseHTML: element => element.getAttribute('data-container-width'),
        renderHTML: attributes => {
          return {
            'data-container-width': attributes.containerWidth,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="mermaid-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'mermaid-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidNodeView);
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: /^```mermaid\n$/,
        type: this.type,
        getAttributes: () => ({
          graphDefinition: 'graph TD\n  A-->B;',
        }),
      }),
    ];
  },

  addPasteRules() {
    return [
      nodePasteRule({
        find: /```mermaid\n([\s\S]+?)```/g,
        type: this.type,
        getAttributes: (match) => {
          return {
            graphDefinition: match[1] ? match[1].trim() : 'graph TD\n  A-->B;',
          };
        },
      }),
    ];
  },

  addCommands() {
    return {
      setMermaidBlock:
        attributes =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
      convertSelectionToMermaid:
        () =>
        ({ state, chain }) => {
          const { selection } = state;
          const text = state.doc.textBetween(selection.from, selection.to, '\n');
          
          if (!text) {
            return false;
          }

          return chain()
            .deleteSelection()
            .insertContent({
              type: this.name,
              attrs: { graphDefinition: text },
            })
            .run();
        },
    };
  },
});
