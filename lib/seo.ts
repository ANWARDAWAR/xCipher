import { getImgSrc } from "@/lib/utils";

export const siteConfig = {
  name: "xSypher",
  description: "xSypher is an independent technology publication covering AI, cybersecurity, gadgets, software, programming, startups, gaming and the tech business.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  twitter: "@xSypherTech",
  locale: "en_US",
  publisher: "xSypher Media",
  logoUrl: undefined, // Conditionally populated or omitted
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

export function generateNewsArticleJsonLd(article: any) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.seoTitle || article.title,
    "description": article.seoDesc || article.deck,
    "image": article.img ? [getImgSrc(article.img, 1200, 630)] : undefined,
    "datePublished": article.publishedAt ? new Date(article.publishedAt).toISOString() : new Date(article.createdAt).toISOString(),
    "dateModified": new Date(article.updatedAt).toISOString(),
    "author": article.authorModel ? [{
      "@type": "Person",
      "name": article.authorModel.name,
      "url": `${siteConfig.url}/author/${article.authorModel.slug}`
    }] : [{
      "@type": "Person",
      "name": article.author || "xSypher Staff"
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
