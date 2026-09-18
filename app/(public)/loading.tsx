// Instant feedback while a route's queries run.
//
// Without a loading.tsx, Next holds the previous page on screen until the
// server component resolves, so a category click looked like nothing had
// happened -- and in development the build indicator sat in the corner, which
// is what read as "rendering". /page/about felt fast only because it reads a
// hardcoded object and never touches the database.
//
// This is a layout skeleton rather than a spinner: it reserves the same shape
// the article list will occupy, so the page does not jump when content lands.
export default function Loading() {
  return (
    <div className="wrap feed-grid" aria-busy="true" aria-live="polite">
      <div>
        <span className="sr-only">Loading stories…</span>
        {Array.from({ length: 6 }).map((_, i) => (
          <article className="sk-row" key={i} aria-hidden="true">
            <div className="sk sk-thumb" />
            <div className="sk-lines">
              <div className="sk sk-kicker" />
              <div className="sk sk-title" />
              <div className="sk sk-title sk-short" />
              <div className="sk sk-meta" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
