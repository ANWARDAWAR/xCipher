import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

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
    <div className="slash-commands bg-white border border-gray-200 shadow-lg rounded-md overflow-hidden max-h-60 overflow-y-auto w-64" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 9999 }}>
      {props.items.length > 0 ? (
        props.items.map((item: any, index: number) => (
          <button
            className={`flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${index === selectedIndex ? 'bg-gray-100 font-bold' : ''}`}
            style={{ 
              display: "block", 
              width: "100%", 
              padding: "8px 12px", 
              textAlign: "left", 
              background: index === selectedIndex ? "var(--surface-2)" : "transparent",
              border: "none",
              color: "var(--ink)",
              cursor: "pointer"
            }}
            key={index}
            onClick={() => selectItem(index)}
          >
            {item.title}
          </button>
        ))
      ) : (
        <div className="p-2 text-sm text-gray-500" style={{ padding: "8px 12px", color: "var(--ink-muted)" }}>
          No result
        </div>
      )}
    </div>
  )
})

SlashCommandList.displayName = 'SlashCommandList'

export const getSuggestionItems = ({ query }: { query: string }) => {
  return [
    {
      title: 'Heading 2',
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
      },
    },
    {
      title: 'Heading 3',
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
      },
    },
    {
      title: 'Bullet List',
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run()
      },
    },
    {
      title: 'Numbered List',
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run()
      },
    },
    {
      title: 'Key Takeaway',
      command: ({ editor, range }: any) => {
        (editor.chain().focus().deleteRange(range) as any).setCallout({ type: 'takeaway' }).run()
      },
    },
    {
      title: 'Code Block',
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
      },
    },
    {
      title: 'Divider',
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run()
      },
    },
  ].filter(item => item.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10)
}
