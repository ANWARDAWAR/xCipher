interface Props {
  html?: string | null;
}

import { sanitizeArticleHtml } from "@/lib/sanitize";

export default function ArticleBody({ html }: Props) {
  // Rely on robust DOMPurify server sanitization
  const safeHtml = html ? sanitizeArticleHtml(html) : "<p>No content available.</p>";

  return (
    <div
      className="tiptap-content"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
