import re

with open('app/globals.css', 'r') as f:
    css = f.read()

# Fix Table Styling
old_table_css = """/* Professional Table Styling */
.tiptap table, .prose table {
  border-collapse: collapse !important;
  border: 1px solid var(--line) !important;
  width: 100% !important;
}"""
new_table_css = """/* Professional Table Styling */
.tiptap table, .prose table {
  border-collapse: collapse !important;
  border: 1px solid var(--line) !important;
  width: auto !important;
  min-width: 100% !important;
  table-layout: auto !important;
}"""
css = css.replace(old_table_css, new_table_css)

# Fix Code Block Label
old_code_css = """/* Professional Code Block Styling */
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
}"""

new_code_css = """/* Professional Code Block Styling */
.tiptap pre, .prose pre {
  position: relative !important;
  border: 1px solid var(--line-2) !important;
  border-radius: var(--r-md) !important;
  margin-top: 1.5em !important;
  padding-top: 2.5rem !important; /* Make room for label */
}
.tiptap pre code::before, .prose pre code::before {
  content: "CODE";
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
  border-top-right-radius: var(--r-md);
  opacity: 0.7;
  pointer-events: none;
}
/* Language Specific Labels */
.tiptap pre code.language-javascript::before, .prose pre code.language-javascript::before { content: "JavaScript"; }
.tiptap pre code.language-js::before, .prose pre code.language-js::before { content: "JavaScript"; }
.tiptap pre code.language-typescript::before, .prose pre code.language-typescript::before { content: "TypeScript"; }
.tiptap pre code.language-ts::before, .prose pre code.language-ts::before { content: "TypeScript"; }
.tiptap pre code.language-python::before, .prose pre code.language-python::before { content: "Python"; }
.tiptap pre code.language-html::before, .prose pre code.language-html::before { content: "HTML"; }
.tiptap pre code.language-css::before, .prose pre code.language-css::before { content: "CSS"; }
.tiptap pre code.language-bash::before, .prose pre code.language-bash::before { content: "Bash"; }
.tiptap pre code.language-sh::before, .prose pre code.language-sh::before { content: "Shell"; }
.tiptap pre code.language-json::before, .prose pre code.language-json::before { content: "JSON"; }
"""
css = css.replace(old_code_css, new_code_css)

with open('app/globals.css', 'w') as f:
    f.write(css)

print("CSS updated.")
