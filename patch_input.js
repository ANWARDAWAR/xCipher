const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'app/globals.css');
let content = fs.readFileSync(file, 'utf8');

const newInput = `.ed-rail-input {
  width: 100%;
  min-height: 36px;
  padding: 10px 12px;
  background: var(--surface-3);
  border: 1px solid transparent;
  border-bottom: 2px solid var(--line-2);
  border-radius: var(--r-sm) var(--r-sm) 0 0;
  color: var(--ink);
  font: 400 13.5px/1.4 var(--f-ui);
  transition: all .25s ease;
}

.ed-rail-input::placeholder { color: var(--faint); }

.ed-rail-input:hover:not(:disabled) {
  background: var(--line);
  border-bottom-color: var(--muted);
}

.ed-rail-input:focus-visible {
  outline: none;
  background: var(--surface);
  border-bottom-color: var(--accent);
  box-shadow: 0 6px 12px -4px var(--accent-soft);
}`;

content = content.replace(
  /\.ed-rail-input \{[\s\S]*?\.ed-rail-input:focus-visible \{[\s\S]*?\}/,
  newInput
);

fs.writeFileSync(file, content);
console.log('Patched ed-rail-input');
