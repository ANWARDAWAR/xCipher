export const siteConfig = {
  name: "xSypher",
  description: "xSypher is an independent technology publication covering AI, cybersecurity, gadgets, software, programming, startups, gaming and the tech business.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  twitter: "@xSypherTech",
  locale: "en_US",
  publisher: "xSypher Media",
  logoUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/logo.png`, // Assuming a logo exists
};

export function constructMetadata({
  title = siteConfig.name,
  description = siteConfig.description,
  image,
  noIndex = false,
  canonical,
}: {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  canonical?: string;
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
      type: "website",
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
    "image": article.img ? [article.img] : undefined,
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
      "logo": {
        "@type": "ImageObject",
        "url": siteConfig.logoUrl
      }
    },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${siteConfig.url}/article/${article.slug}`
      }
  };
}

/**
 * Serializes a JSON-LD object for safe injection into a <script> tag.
 *
 * A plain JSON.stringify output is NOT safe to drop into
 * dangerouslySetInnerHTML: an article title containing `</script>` closes the
 * script element early and whatever follows is parsed as live HTML -- a
 * stored-XSS hole authored through the CMS. Escaping every "<" as its JSON
 * unicode escape keeps the parsed output byte-identical (it is the same code
 * point inside a string literal) while making a premature close tag
 * impossible.
 * U+2028/U+2029 are escaped for the same reason: they are valid in JSON
 * strings but were historically treated as line terminators by JS parsers.
 */
export function stringifyJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
