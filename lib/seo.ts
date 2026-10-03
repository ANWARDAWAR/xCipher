import { getImgSrc } from "@/lib/utils";
import { getArticleAuthor, type ArticleAuthorSource } from "@/lib/personas";

export const siteConfig = {
  name: "xSypher",
  description: "xSypher is an independent technology publication covering AI, cybersecurity, gadgets, software, programming, startups, gaming and the tech business.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://xsypher.com",
  twitter: "@xSypherTech",
  locale: "en_US",
  publisher: "xSypher Media",
  logoUrl: new URL('/xsypher-logo-full.png', process.env.NEXT_PUBLIC_SITE_URL || 'https://xsypher.com').href,
};

export function constructMetadata({
  title = siteConfig.name,
  description = siteConfig.description,
  image,
  noIndex = false,
  canonical,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
}: {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  canonical?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
} = {}) {
  const url = canonical ? `${siteConfig.url}${canonical}` : siteConfig.url;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      images: image ? [{ url: image }] : undefined,
      locale: siteConfig.locale,
      type,
      ...(type === "article" && {
        publishedTime,
        modifiedTime,
        authors,
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
      creator: siteConfig.twitter,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
      },
    },
    metadataBase: new URL(siteConfig.url),
  };
}

interface NewsArticleSource extends ArticleAuthorSource {
  title: string;
  slug: string;
  deck?: string | null;
  seoTitle?: string | null;
  seoDesc?: string | null;
  img?: string | null;
  featuredImageCaption?: string | null;
  featuredImageCredit?: string | null;
  publishedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function generateNewsArticleJsonLd(article: NewsArticleSource) {
  const author = getArticleAuthor(article);
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.seoTitle || article.title,
    "description": article.seoDesc || article.deck,
    "image": article.img ? [{
      "@type": "ImageObject",
      "url": getImgSrc(article.img, 1200, 630),
      ...(article.featuredImageCaption ? { caption: article.featuredImageCaption } : {}),
      ...(article.featuredImageCredit ? { creditText: article.featuredImageCredit } : {}),
    }] : undefined,
    "datePublished": article.publishedAt ? new Date(article.publishedAt).toISOString() : new Date(article.createdAt).toISOString(),
    "dateModified": new Date(article.updatedAt).toISOString(),
    "author": article.isAnonymous ? {
      "@type": "Organization",
      "name": author.name,
      "url": siteConfig.url,
    } : [{
      "@type": "Person",
      "name": author.name,
      ...(author.slug ? { url: `${siteConfig.url}/author/${author.slug}` } : {}),
    }],
    "publisher": {
      "@type": "Organization",
      "name": siteConfig.publisher,
      ...(siteConfig.logoUrl ? {
        "logo": {
          "@type": "ImageObject",
          "url": siteConfig.logoUrl
        }
      } : {})
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/article/${article.slug}`
    }
  };
}
