import os

css_to_append = """
/* 1. Fix Interline / Paragraph Spacing on Paste */
.tiptap p {
  margin-top: 0.35em !important;
  margin-bottom: 0.35em !important;
  line-height: 1.6 !important;
}
.tiptap h1, .tiptap h2, .tiptap h3 {
  margin-top: 0.8em !important;
  margin-bottom: 0.3em !important;
}

/* 2. Dynamic Table Sizing & Missing Borders */
.tiptap table, .prose table {
  width: auto !important;
  min-width: 100% !important;
  table-layout: auto !important;
  border-collapse: collapse !important;
  border: 1px solid var(--line) !important;
}
.tiptap th, .tiptap td, .prose th, .prose td {
  border: 1px solid var(--line) !important;
  padding: 8px 12px !important;
  vertical-align: top !important;
  white-space: normal !important;
}

/* 3. Code Block Editor Font Size */
.tiptap pre, .tiptap pre code {
  font-size: 0.95rem !important;
  line-height: 1.5 !important;
}

/* 7. Fix A+ / A- Font Sizer for Normal Body Text */
.prose p, .prose li, .prose blockquote, .story-content p {
  font-size: 1em !important;
  line-height: 1.7 !important;
}
"""

with open('app/globals.css', 'a') as f:
    f.write(css_to_append)

print("CSS appended to globals.css")
