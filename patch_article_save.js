const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components/editorial/ArticleEditor.tsx');
let content = fs.readFileSync(file, 'utf8');

// Fix 2: Rethrow the error in handleSave so the button onClick can catch it
content = content.replace(
  /        showToast\(\n          "Couldn't reach the server\. Your changes are saved in this browser and will sync when you're back online\.",\n          "error"\n        \);\n        console\.error\("Save error:", error\);\n      \}\n      return null;/g,
  `        console.error("Save error:", error);
        throw error;
      }
      return null;`
);

fs.writeFileSync(file, content);
console.log('Patched ArticleEditor.tsx save catch block');
