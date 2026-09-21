const fs = require('fs');
const file = '/home/lord/Music/GRID-X html/components/editorial/ArticleEditor.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix handleSave validation throws instead of showToast + return null
content = content.replace(
  /showToast\("Pre-flight Check Failed: Title is required\."\);\s*return null;/g,
  'throw new Error("Pre-flight Check Failed: Title is required.");'
);
content = content.replace(
  /showToast\("Pre-flight Check Failed: A descriptive deck is required\."\);\s*return null;/g,
  'throw new Error("Pre-flight Check Failed: A descriptive deck is required.");'
);
content = content.replace(
  /showToast\("Pre-flight Check Failed: Article must be at least 50 words\."\);\s*return null;/g,
  'throw new Error("Pre-flight Check Failed: Article must be at least 50 words.");'
);

// Fix upsertArticle error handling to throw instead of return null for manual save
content = content.replace(
  /setAutosaveStatus\("error"\);\s*showToast\("Save failed: " \+ \(result\.error \|\| "Unknown error"\), "error"\);\s*\}\s*return null;/g,
  'setAutosaveStatus("error");\n          throw new Error("Save failed: " + (result.error || "Unknown error"));\n        }'
);

// Fix the catch block in handleSave to throw for manual saves
content = content.replace(
  /\} else \{\s*showToast\([\s\S]*?"Couldn't reach the server[\s\S]*?\);\s*console\.error\("Save error:", error\);\s*\}\s*return null;/g,
  '} else {\n        console.error("Save error:", error);\n        throw error;\n      }'
);

// Remove the `if (!wasNew)` restriction on router.refresh()
content = content.replace(
  /if \(\!wasNew\) startRefresh\(\(\) => router\.refresh\(\)\);/g,
  'startRefresh(() => router.refresh());'
);

fs.writeFileSync(file, content, 'utf8');
console.log("Patched ArticleEditor.tsx");
