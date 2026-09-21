const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components/editorial/ArticleEditor.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace primary buttons with btn-premium
content = content.replace(
  /className="px-4 py-1\.5 text-sm font-semibold rounded-md bg-\[var\(--accent\)\] text-white hover:bg-\[var\(--accent-deep\)\] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"/g,
  `className="btn-premium px-4 py-1.5 text-sm font-semibold rounded-md disabled:opacity-50 flex items-center gap-2"`
);

// Add glassmorphism to sidebar and inputs
content = content.replace(
  /className="w-full lg:w-80 border-l border-\[var\(--line\)\] bg-\[var\(--surface\)\] flex flex-col overflow-y-auto shrink-0"/g,
  `className="w-full lg:w-80 border-l border-[var(--line)] bg-[var(--surface)]/70 backdrop-blur-md flex flex-col overflow-y-auto shrink-0"`
);

fs.writeFileSync(file, content);
console.log('Patched buttons and glassmorphism');
