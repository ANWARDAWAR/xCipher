import { mergeAttributes, Node } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    figure: {
      setFigure: (options: { src: string; alt?: string; caption?: string; credit?: string; title?: string }) => ReturnType
    }
  }
}

export const Figure = Node.create({
  name: 'figure',
  group: 'block',
  content: 'inline*',
  draggable: true,
  isolating: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.querySelector('img')?.getAttribute('src'),
      },
      alt: {
        default: null,
        parseHTML: element => element.querySelector('img')?.getAttribute('alt'),
      },
      title: {
        default: null,
        parseHTML: element => element.querySelector('img')?.getAttribute('title'),
      },
      credit: {
        default: null,
        parseHTML: element => element.getAttribute('data-credit'),
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure',
        contentElement: 'figcaption',
      },
      {
        tag: 'img',
        getAttrs: (node) => {
          // If we encounter a stray img, turn it into a figure automatically
          const img = node as HTMLElement;
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
          }
        },
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      { 'data-credit': HTMLAttributes.credit, class: 'ed-figure' },
      ['img', { 
        src: HTMLAttributes.src, 
        alt: HTMLAttributes.alt, 
        title: HTMLAttributes.title 
      }],
      ['figcaption', 0],
    ]
  },

  addCommands() {
    return {
      setFigure:
        (options: any) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
            content: options.caption ? [{ type: 'text', text: options.caption }] : [],
          })
        },
    }
  },
})
