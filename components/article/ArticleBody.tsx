interface Props {
  html?: string | null;
}

export default function ArticleBody({ html }: Props) {
  // Strip out any potential script tags before rendering
  const safeHtml = html
    ? html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    : "<p>No content available.</p>";

  return (
    <div
      className="tiptap-content"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
