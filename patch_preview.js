const fs = require('fs');
const file = '/home/lord/Music/GRID-X html/components/editorial/ArticleEditor.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldPreview = `  const handlePreview = async () => {
    const currentTitle = watch("title") || getValues("title");
    if (!currentTitle || !currentTitle.trim()) {
      showToast("Please enter an article title first to preview");
      document.getElementById("edTitle")?.focus();
      return;
    }

    // Save the current state before previewing to ensure the DB has the latest content.
    // We use the current status so we don't accidentally unpublish a live article.
    const currentStatus = watch("status") || getValues("status") || "DRAFT";
    showToast("Saving before preview...");
    const saved = await handleSave(currentStatus);
    if (saved && saved.id) {
      window.open(\`/preview/\${saved.id}\`, "_blank");
    }
  };`;

const newPreview = `  const handlePreview = async () => {
    const currentTitle = watch("title") || getValues("title");
    if (!currentTitle || !currentTitle.trim()) {
      showToast("Please enter an article title first to preview");
      document.getElementById("edTitle")?.focus();
      return;
    }

    // Save the current state before previewing to ensure the DB has the latest content.
    // We use the current status so we don't accidentally unpublish a live article.
    const currentStatus = watch("status") || getValues("status") || "DRAFT";
    showToast("Saving before preview...");
    try {
      const saved = await handleSave(currentStatus);
      if (saved && saved.id) {
        window.open(\`/preview/\${saved.id}\`, "_blank");
      }
    } catch (err: any) {
      showToast(err.message || "Preview failed", "error");
    }
  };`;

content = content.replace(oldPreview, newPreview);
fs.writeFileSync(file, content, 'utf8');
