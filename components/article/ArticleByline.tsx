import Image from "next/image";
import Link from "next/link";
import { getArticleAuthor, type ArticleAuthorSource } from "@/lib/personas";

export default function ArticleByline({ article, size = 24, showRole = false }: {
  article: ArticleAuthorSource;
  size?: number;
  showRole?: boolean;
}) {
  const author = getArticleAuthor(article);
  const avatar = author.avatar ? (
    <Image src={author.avatar} alt={author.name} width={size} height={size} sizes={`${size}px`} className="rounded-full object-cover shrink-0" />
  ) : (
    <span style={{ width: size, height: size }} className="rounded-full bg-[var(--surface-3)] inline-flex items-center justify-center shrink-0 font-bold">{author.name.charAt(0)}</span>
  );

  return (
    <span className="inline-flex items-center gap-2 align-middle" itemProp="author" itemScope itemType={`https://schema.org/${article.isAnonymous ? "Organization" : "Person"}`}>
      {author.slug ? <Link href={`/author/${author.slug}`} className="shrink-0">{avatar}</Link> : avatar}
      <span className="inline-flex flex-col">
        {author.slug ? (
          <Link href={`/author/${author.slug}`} className="font-bold hover:text-[var(--accent)] transition-colors" itemProp="name">{author.name}</Link>
        ) : <span className="font-bold" itemProp="name">{author.name}</span>}
        {showRole && <span className="text-xs text-[var(--muted)]">{author.role}</span>}
      </span>
    </span>
  );
}
