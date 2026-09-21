const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components/editorial/ArticleEditor.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add activeAction state
content = content.replace(
  /  const \[slugManuallyEdited, setSlugManuallyEdited\] = useState\(Boolean\(initialData\?\.slug\)\);/,
  `  const [activeAction, setActiveAction] = useState<string | null>(null);\n  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(initialData?.slug));`
);

// Update save handlers to use activeAction
content = content.replace(
  /onClick=\{\(\) => startTransition\(async \(\) => \{/g,
  `onClick={() => startTransition(async () => {`
);

// We need to pass the action name into the startTransition block.
// The easiest way is to modify the buttons directly.
// Button 1: Save Draft
content = content.replace(
  /              onClick=\{\(\) => startTransition\(async \(\) => \{\n                showToast\("Saving Draft\.\.\.", "info", "premium"\);\n                try \{\n                  await handleSave\(currentFormStatus\);\n                  showToast\("Draft saved successfully\.", "success", "premium"\);\n                \} catch \(err: any\) \{\n                  showToast\(err\.message, "error", "premium"\);\n                \}\n              \}\)\}/g,
  `              onClick={() => startTransition(async () => {
                setActiveAction("save");
                showToast("Saving Draft...", "info", "premium");
                try {
                  await handleSave(currentFormStatus);
                  showToast("Draft saved successfully.", "success", "premium");
                } catch (err: any) {
                  showToast(err.message, "error", "premium");
                } finally {
                  setActiveAction(null);
                }
              })}`
);

// Button 2: Update Live
content = content.replace(
  /              onClick=\{\(\) => startTransition\(async \(\) => \{\n                showToast\("Updating Live\.\.\.", "info", "premium"\);\n                try \{\n                  await handleSave\("PUBLISHED"\);\n                  showToast\("Live story updated successfully\.", "success", "premium"\);\n                \} catch \(err: any\) \{\n                  showToast\(err\.message, "error", "premium"\);\n                \}\n              \}\)\}/g,
  `              onClick={() => startTransition(async () => {
                setActiveAction("update");
                showToast("Updating Live...", "info", "premium");
                try {
                  await handleSave("PUBLISHED");
                  showToast("Live story updated successfully.", "success", "premium");
                } catch (err: any) {
                  showToast(err.message, "error", "premium");
                } finally {
                  setActiveAction(null);
                }
              })}`
);

// Button 3: Publish / Submit
content = content.replace(
  /                onClick=\{\(\) => startTransition\(async \(\) => \{\n                  showToast\(canPublish \? "Publishing\.\.\." : "Submitting\.\.\.", "info", "premium"\);\n                  try \{\n                    await handleSave\(canPublish \? "PUBLISHED" : "SUBMITTED"\);\n                    showToast\(canPublish \? "Published successfully!" : "Submitted for review!", "success", "premium"\);\n                  \} catch \(err: any\) \{\n                    showToast\(err\.message, "error", "premium"\);\n                  \}\n                \}\)\}/g,
  `                onClick={() => startTransition(async () => {
                  setActiveAction(canPublish ? "publish" : "submit");
                  showToast(canPublish ? "Publishing..." : "Submitting...", "info", "premium");
                  try {
                    await handleSave(canPublish ? "PUBLISHED" : "SUBMITTED");
                    showToast(canPublish ? "Published successfully!" : "Submitted for review!", "success", "premium");
                  } catch (err: any) {
                    showToast(err.message, "error", "premium");
                  } finally {
                    setActiveAction(null);
                  }
                })}`
);

// Now update the button rendering to check activeAction
// Save Draft button
content = content.replace(
  /\{busy && <Loader2 className="h-3\.5 w-3\.5 animate-spin" aria-hidden="true" \/>\}\n              <span>\{busy \? "Saving\\\\u2026" : "Save Draft"\}<\/span>/,
  `{activeAction === "save" && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              <span>{activeAction === "save" ? "Saving\\u2026" : "Save Draft"}</span>`
);

// Update Live button
content = content.replace(
  /\{busy\n                \? <Loader2 className="h-3\.5 w-3\.5 animate-spin" aria-hidden="true" \/>\n                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2\.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"\/><\/svg>\}\n              <span>\{busy \? "Updating\\\\u2026" : "Update Live"\}<\/span>/,
  `{activeAction === "update"
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>}
              <span>{activeAction === "update" ? "Updating\\u2026" : "Update Live"}</span>`
);

// Publish / Submit button
content = content.replace(
  /\{busy\n                  \? <Loader2 className="h-3\.5 w-3\.5 animate-spin" aria-hidden="true" \/>\n                  : canPublish\n                    \? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2\.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"\/><\/svg>\n                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2\.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 2L11 13"\/><path d="M22 2l-7 20-4-9-9-4 20-7z"\/><\/svg>\}\n                <span>\{busy\n                  \? \(canPublish \? "Publishing\\\\u2026" : "Submitting\\\\u2026"\)\n                  : \(canPublish \? "Publish Story" : "Submit for Review"\)\}<\/span>/,
  `{activeAction === "publish" || activeAction === "submit"
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  : canPublish
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>}
                <span>{activeAction === "publish" || activeAction === "submit"
                  ? (canPublish ? "Publishing\\u2026" : "Submitting\\u2026")
                  : (canPublish ? "Publish Story" : "Submit for Review")}</span>`
);

fs.writeFileSync(file, content);
console.log('Patched ArticleEditor.tsx buttons');
