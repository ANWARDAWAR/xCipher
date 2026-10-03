import Link from "next/link";
import ArticleByline from "./ArticleByline";
import { SocialIcon } from "@/components/author/AuthorProfileView";
import { getArticleAuthor, type ArticleAuthorSource } from "@/lib/personas";
import { parseAuthorSocialLinks } from "@/lib/entity-schema";
import { sanitizeBioHtml } from "@/lib/sanitize";

export default function AuthorBox({ article }: { article: ArticleAuthorSource }) {
  const author = getArticleAuthor(article);
  const socials = parseAuthorSocialLinks(author.socialLinks, true);

  return (
    <section className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 sm:p-7 shadow-sm flex flex-col mt-4 mb-8" aria-label="About the author">
      <div className="mb-3"><ArticleByline article={article} size={64} showRole /></div>
      {article.isAnonymous ? (
        <p className="text-sm text-[var(--muted)] leading-relaxed max-w-2xl">{author.overview || author.bio}</p>
      ) : (
        <div className="text-sm text-[var(--muted)] leading-relaxed max-w-2xl" dangerouslySetInnerHTML={{ __html: sanitizeBioHtml(author.overview || author.bio) }} />
      )}
      {!article.isAnonymous && (socials.length > 0 || author.slug) && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--line)]/50">
          <div className="flex items-center gap-1.5">
            {socials.map((social, index) => (
              <Link key={index} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={`${author.name} on ${social.platform}`} className="inline-flex items-center justify-center w-8 h-8 rounded-full text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors">
                <SocialIcon platform={social.platform} />
              </Link>
            ))}
          </div>
          {author.slug && <Link href={`/author/${author.slug}`} className="text-xs font-semibold hover:text-[var(--accent)] transition-colors">View all articles →</Link>}
        </div>
      )}
    </section>
  );
}
