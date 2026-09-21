import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

interface SlashCommandItem {
  title: string
  description: string
  icon: string
  command: (props: { editor: any; range: any }) => void
}

export const SlashCommandList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) {
      props.command(item)
    }
  }

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }
      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }
      if (event.key === 'Enter') {
        enterHandler()
        return true
      }
      return false
    },
  }))

  return (
    <div 
      className="slash-commands" 
      role="listbox"
      aria-label="Insert block"
      style={{ 
        background: "var(--surface)", 
        border: "1px solid var(--line)", 
        borderRadius: "var(--r-md)", 
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)", 
        zIndex: 9999,
        maxHeight: '320px',
        overflowY: 'auto',
        width: '280px',
        padding: '4px',
      }}
    >
      {props.items.length > 0 ? (
        props.items.map((item: SlashCommandItem, index: number) => (
          <button
            role="option"
            aria-selected={index === selectedIndex}
            style={{ 
              display: "flex", 
              alignItems: "center",
              gap: "10px",
              width: "100%", 
              padding: "8px 10px", 
              textAlign: "left", 
              background: index === selectedIndex ? "var(--surface-2)" : "transparent",
              border: "none",
              borderRadius: "var(--r-sm)",
              color: "var(--ink)",
              cursor: "pointer",
              transition: "background .1s",
            }}
            key={index}
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <span style={{ 
              width: '32px', 
              height: '32px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'var(--surface-3)',
              borderRadius: 'var(--r-sm)',
              fontSize: '16px',
              flexShrink: 0,
            }}>
              {item.icon}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--f-ui)' }}>
                {item.title}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: '1.3', marginTop: '1px' }}>
                {item.description}
              </div>
            </div>
          </button>
        ))
      ) : (
        <div style={{ padding: "12px", color: "var(--muted)", fontSize: "13px", textAlign: "center" }}>
          No matching commands
        </div>
      )}
    </div>
  )
})

SlashCommandList.displayName = 'SlashCommandList'

export const getSuggestionItems = ({ query }: { query: string }): SlashCommandItem[] => {
  const items: SlashCommandItem[] = [
    {
      title: 'Heading 1',
      description: 'Major section heading',
      icon: 'H1',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
      },
    },
    {
      title: 'Heading 2',
      description: 'Section heading',
      icon: 'H2',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
      },
    },
    {
      title: 'Heading 3',
      description: 'Subsection heading',
      icon: 'H3',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
      },
    },
    {
      title: 'Heading 4',
      description: 'Minor section heading',
      icon: 'H4',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 4 }).run()
      },
    },
    {
      title: 'Paragraph',
      description: 'Plain text paragraph',
      icon: '¶',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setParagraph().run()
      },
    },
    {
      title: 'Bullet List',
      description: 'Unordered list of items',
      icon: '•',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run()
      },
    },
    {
      title: 'Numbered List',
      description: 'Ordered list of items',
      icon: '1.',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run()
      },
    },
    {
      title: 'Blockquote',
      description: 'Quote or citation',
      icon: '❝',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run()
      },
    },
    {
      title: 'Info Callout',
      description: 'Highlighted information box',
      icon: 'ℹ️',
      command: ({ editor, range }) => {
        (editor.chain().focus().deleteRange(range) as any).setCallout({ type: 'info' }).run()
      },
    },
    {
      title: 'Key Takeaway',
      description: 'Summarize key points',
      icon: '💡',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).insertContent({
          type: 'callout',
          attrs: { type: 'takeaway' },
          content: [
            {
              type: 'heading',
              attrs: { level: 3 },
              content: [{ type: 'text', text: 'Key Takeaways' }]
            },
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph' }]
                }
              ]
            }
          ]
        }).run()
      },
    },
    {
      title: 'Warning',
      description: 'Important caution or warning',
      icon: '⚠️',
      command: ({ editor, range }) => {
        (editor.chain().focus().deleteRange(range) as any).setCallout({ type: 'warning' }).run()
      },
    },
    {
      title: 'Code Block',
      description: 'Syntax-highlighted code',
      icon: '</>',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
      },
    },
    {
      title: 'Image',
      description: 'Insert an image with caption',
      icon: '🖼️',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run()
        const url = window.prompt("Image URL (e.g. https://images.pexels.com/...)")
        if (!url) return
        const alt = window.prompt("Alt Text (for accessibility/SEO):") || ""
        const caption = window.prompt("Caption (optional):") || ""
        const credit = window.prompt("Image Credit (optional):") || "";
        (editor.chain().focus() as any).setFigure({ src: url, alt, caption, credit }).run()
      },
    },
    {
      title: 'Table',
      description: '3×3 table with header row',
      icon: '📊',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
      },
    },
    {
      title: 'Divider',
      description: 'Horizontal separator line',
      icon: '—',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run()
      },
    },
  ]

  // Filter by matching anywhere in title (not just prefix)
  const q = query.toLowerCase()
  return items
    .filter(item => item.title.toLowerCase().includes(q))
    .slice(0, 12)
}
