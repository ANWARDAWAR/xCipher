import Image from "next/image";
import Link from "next/link";
import { getArticleAuthor, type ArticleAuthorSource } from "@/lib/personas";

export default function ArticleByline({ article, size = 24, showRole = false, children }: {
  article: ArticleAuthorSource;
  size?: number;
  showRole?: boolean;
  children?: React.ReactNode;
}) {
  const author = getArticleAuthor(article);
  const isLarge = size >= 64;
  const avatarClasses = `rounded-full object-cover shrink-0 ${isLarge ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-[var(--surface)]' : ''}`;
  const fallbackClasses = `rounded-full bg-[var(--surface-3)] inline-flex items-center justify-center shrink-0 font-bold ${isLarge ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-[var(--surface)]' : ''}`;

  const avatar = author.avatar ? (
    <Image src={author.avatar} alt={author.name} width={size} height={size} sizes={`${size}px`} className={avatarClasses} />
  ) : (
    <span style={{ width: size, height: size }} className={fallbackClasses}>{author.name.charAt(0)}</span>
  );

  return (
    <span className={`inline-flex items-center ${isLarge ? 'gap-4' : 'gap-2'} align-middle`} itemProp="author" itemScope itemType={`https://schema.org/${article.isAnonymous ? "Organization" : "Person"}`}>
      {author.slug ? <Link href={`/author/${author.slug}`} className="shrink-0">{avatar}</Link> : avatar}
      <span className={`inline-flex flex-col ${isLarge ? 'gap-1' : ''}`}>
        {author.slug ? (
          <Link href={`/author/${author.slug}`} className={`font-bold hover:text-[var(--accent)] transition-colors ${isLarge ? 'text-xl' : ''}`} itemProp="name">{author.name}</Link>
        ) : <span className={`font-bold ${isLarge ? 'text-xl' : ''}`} itemProp="name">{author.name}</span>}
        {(showRole || children) && (
          <span className="inline-flex items-center gap-1.5 flex-wrap">
            {showRole && <span className={isLarge ? 'text-xs sm:text-sm text-red-500 font-medium' : 'text-xs text-[var(--muted)]'}>{author.role}</span>}
            {children && <span className={showRole ? "text-xs text-[var(--muted)]" : ""}>{showRole && <span className="dot mr-1.5">·</span>}{children}</span>}
          </span>
        )}
      </span>
    </span>
  );
}
