const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components/editorial/ArticleEditor.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /        if \(targetStatus === "SUBMITTED"\) \{/,
  `        // Set a fresh timestamp before workflow transitions so autosaves don't conflict
        const postSaveDate = new Date();
        lastSavedRef.current = postSaveDate;
        setLastSaved(postSaveDate);

        if (targetStatus === "SUBMITTED") {`
);

fs.writeFileSync(file, content);
console.log('Patched ArticleEditor.tsx publish date');
