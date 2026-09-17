import { Node, mergeAttributes } from '@tiptap/core'

export interface CalloutOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (options?: { type?: 'info' | 'takeaway' | 'quote' | 'warning' }) => ReturnType
      toggleCallout: (options?: { type?: 'info' | 'takeaway' | 'quote' | 'warning' }) => ReturnType
    }
  }
}

export const Callout = Node.create<CalloutOptions>({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: element => element.getAttribute('data-callout-type'),
        renderHTML: attributes => {
          return {
            'data-callout-type': attributes.type,
            class: `callout callout-${attributes.type}`,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'aside[data-callout-type]' },
      { tag: 'div.callout' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['aside', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setCallout:
        (options) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, options)
        },
      toggleCallout:
        (options) =>
        ({ commands }) => {
          return commands.toggleNode(this.name, 'paragraph', options)
        },
    }
  },
})
