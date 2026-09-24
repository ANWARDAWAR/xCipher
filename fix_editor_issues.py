import re

with open('components/editorial/EditorToolbar.tsx', 'r') as f:
    content = f.read()

# 1. Fix Sticky Toolbar layout
old_toolbar_start = """  return (
    <div 
      className="sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--line)] py-2 md:mb-8 flex md:flex-wrap items-center gap-1 mx-auto w-full overflow-x-auto overflow-y-hidden md:max-w-3xl px-2 md:px-0 shadow-md md:shadow-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      role="toolbar" 
      aria-label="Formatting"
    >
      {/* Group 1: History */}"""

new_toolbar_start = """  return (
    <div 
      className="sticky top-[-1px] z-40 bg-[var(--surface)] border-b border-[var(--line)] py-2 md:mb-8 mx-auto w-full md:max-w-3xl px-2 md:px-0 shadow-md md:shadow-none"
      role="toolbar" 
      aria-label="Formatting"
    >
      <div className="flex md:flex-wrap items-center gap-1 w-full overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Group 1: History */}"""

content = content.replace(old_toolbar_start, new_toolbar_start)

# Close the new inner div before InsertMediaDialog
old_toolbar_end = """      <InsertMediaDialog
        key={mediaSession}"""

new_toolbar_end = """      </div>
      <InsertMediaDialog
        key={mediaSession}"""

content = content.replace(old_toolbar_end, new_toolbar_end)

# 2. Fix Add URL Bug (Use proper HTML)
old_link = "editor.chain().focus().insertContent('[' + url + '](' + url + ')').run();"
new_link = "editor.chain().focus().insertContent('<a href=\"' + url + '\" target=\"_blank\">' + url + '</a> ').run();"
content = content.replace(old_link, new_link)

with open('components/editorial/EditorToolbar.tsx', 'w') as f:
    f.write(content)


# 3. Add CSS for Table Borders, Code Block, and Spacing
css_to_append = """
/* Fix Interline Spacing */
.tiptap p:empty {
  display: none;
}
.tiptap p {
  margin-top: 0.5em !important;
  margin-bottom: 0.5em !important;
}

/* Professional Table Styling */
.tiptap table, .prose table {
  border-collapse: collapse !important;
  border: 1px solid var(--line) !important;
  width: 100% !important;
}
.tiptap th, .tiptap td, .prose th, .prose td {
  border: 1px solid var(--line) !important;
  padding: 8px 12px !important;
}
.tiptap th, .prose th {
  background-color: var(--surface-2) !important;
  font-weight: 600 !important;
}

/* Professional Code Block Styling */
.tiptap pre, .prose pre {
  position: relative !important;
  border: 1px solid var(--line-2) !important;
  border-radius: var(--r-md) !important;
  margin-top: 1.5em !important;
}
.tiptap pre::before, .prose pre::before {
  content: "Code Block";
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.2rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  background-color: var(--surface-2);
  border-bottom-left-radius: var(--r-md);
  opacity: 0.7;
  pointer-events: none;
}
"""

with open('app/globals.css', 'a') as f:
    f.write(css_to_append)

print("Tasks applied.")
