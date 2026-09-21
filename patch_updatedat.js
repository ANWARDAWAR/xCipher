const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components/editorial/ArticleEditor.tsx');
let content = fs.readFileSync(file, 'utf8');

// Update lastSavedRef when initialData changes
const useEff = `  useEffect(() => {
    if (initialData?.updatedAt) {
      const serverDate = new Date(initialData.updatedAt);
      if (!lastSavedRef.current || serverDate.getTime() > lastSavedRef.current.getTime()) {
        lastSavedRef.current = serverDate;
        setLastSaved(serverDate);
      }
    }
  }, [initialData?.updatedAt]);`;

content = content.replace(
  /  const adoptArticleId = \(id: string\) => \{/,
  `${useEff}\n\n  const adoptArticleId = (id: string) => {`
);

fs.writeFileSync(file, content);
console.log('Patched ArticleEditor.tsx updatedAt sync');
