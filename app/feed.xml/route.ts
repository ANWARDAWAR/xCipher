import { db } from "@/lib/db";

export const revalidate = 3600;

export async function GET() {
  try {
    const articles = await db.article.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: {
          lte: new Date(),
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 20,
      include: {
        authorModel: true,
      },
    });

    const siteUrl = "https://www.xsypher.com";
    
    const escapeXml = (unsafe: string) => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    const rssItems = articles
      .map((article) => {
        const url = `${siteUrl}/${article.slug}`;
        const title = escapeXml(article.title);
        const description = escapeXml(article.deck || "");
        const pubDate = article.publishedAt 
          ? new Date(article.publishedAt).toUTCString()
          : new Date(article.createdAt).toUTCString();
        const author = escapeXml(article.authorModel?.name || article.author || "xSypher Editorial");

        return `
    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
      <author>${author}</author>
    </item>`;
      })
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>xSypher - Advanced Tech &amp; Security Insights</title>
    <link>${siteUrl}</link>
    <description>Original reporting, hands-on reviews and analysis shaping modern life.</description>
    <language>en-us</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${rssItems}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "Cache-Control": "s-maxage=3600, stale-while-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    return new Response("Error generating feed", { status: 500 });
  }
}
