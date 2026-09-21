const fs = require('fs');
const file = '/home/lord/Music/GRID-X html/app/actions/article.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: Add slug to the select statement
content = content.replace(
  /select: \{ id: true, authorId: true, updatedAt: true, status: true, publishedAt: true \}/,
  'select: { id: true, authorId: true, updatedAt: true, status: true, publishedAt: true, slug: true }'
);

// Fix 2: Cast finalStatusUpdate as ArticleStatus
content = content.replace(
  /let finalStatusUpdate = undefined;/,
  'let finalStatusUpdate: ArticleStatus | undefined = undefined;'
);

fs.writeFileSync(file, content, 'utf8');
console.log("Patched article.ts");
