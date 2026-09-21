const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components/editorial/ArticleEditor.tsx');
let content = fs.readFileSync(file, 'utf8');

// Fix 1: Pass articleId to useDraftCache instead of initialData.id
content = content.replace(
  /useDraftCache\(\{ articleId: initialData\?\.id \? String\(initialData\.id\) : null \}\);/g,
  'useDraftCache({ articleId });'
);

fs.writeFileSync(file, content);
console.log('Patched ArticleEditor.tsx');
