export interface EditorialPersona {
  name: string;
  bio: string;
  overview?: string;
  avatar: string;
}

const devDesk: EditorialPersona = {
  name: "xSypher Dev Desk",
  bio: "Software architecture and development insights from the xSypher team.",
  avatar: "/icon.svg",
};

export const EDITORIAL_PERSONAS: Readonly<Record<string, EditorialPersona>> = {
  ai: {
    name: "xSypher AI Desk",
    bio: "The official artificial intelligence and machine learning editorial desk at xSypher.",
    avatar: "/icon.svg",
  },
  cybersecurity: {
    name: "xSypher CyberOps",
    bio: "xSypher's dedicated threat intelligence and cybersecurity research team.",
    avatar: "/icon.svg",
  },
  software: devDesk,
  programming: devDesk,
  default: {
    name: "xSypher Editorial",
    bio: "The independent editorial board at xSypher.",
    avatar: "/icon.svg",
  },
};

/** Unmapped subcategories inherit their parent desk. */
export function getPersonaForCategory(slug?: string | null, parentSlug?: string | null): EditorialPersona {
  for (const value of [slug, parentSlug]) {
    const key = value?.trim().toLowerCase();
    if (key && Object.hasOwn(EDITORIAL_PERSONAS, key)) return EDITORIAL_PERSONAS[key];
  }
  return EDITORIAL_PERSONAS.default;
}

export interface ArticleAuthorSource {
  isAnonymous?: boolean;
  category?: { slug?: string | null; parent?: { slug?: string | null } | null } | null;
  cat?: string;
  author?: string | null;
  authorId?: string | null;
  role?: string | null;
  authorModel?: {
    name?: string | null;
    slug?: string | null;
    avatar?: string | null;
    role?: string | null;
    bio?: string | null;
    overview?: string | null;
    socialLinks?: unknown;
  } | null;
}

/** The only identity public components and metadata should render. */
export function getArticleAuthor(article: ArticleAuthorSource) {
  if (article.isAnonymous) {
    return {
      ...getPersonaForCategory(article.category?.slug ?? article.cat, article.category?.parent?.slug),
      slug: null,
      role: "Editorial Desk",
      socialLinks: undefined,
    };
  }
  const author = article.authorModel;
  return {
    name: author?.name || article.author || "xSypher Staff",
    avatar: author?.avatar || null,
    bio: author?.bio || author?.overview || "Contributing writer at xSypher.",
    overview: author?.overview || author?.bio || "Contributing writer at xSypher.",
    slug: author?.slug || null,
    role: author?.role || article.role || "Contributing writer",
    socialLinks: author?.socialLinks,
  };
}

/** Remove private attribution before a row crosses a public client boundary. */
export function maskPublicArticle<T extends ArticleAuthorSource>(article: T) {
  return {
    ...article,
    author: article.isAnonymous ? getArticleAuthor(article).name : article.author,
    role: article.isAnonymous ? "Editorial Desk" : article.role,
    authorId: article.isAnonymous ? null : article.authorId,
    authorModel: article.isAnonymous ? null : article.authorModel,
  };
}
