import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ARTICLE_CARD_WITH_TAGS_SELECT } from "@/lib/queries";
import StoryRow from "@/components/article/StoryRow";
import Sidebar from "@/components/layout/Sidebar";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  
  return {
    title: q ? `Search results for "${q}" — xCipher` : "Search — xCipher",
    robots: {
      index: false,
      follow: true,
    }
  };
}

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const cat = typeof params.cat === "string" ? params.cat : "";
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  let results: any[] = [];
  let totalCount = 0;
  
  if (q || cat) {
    const whereClause: any = {
      status: "PUBLISHED",
      ...(cat ? { category: { slug: cat } } : {}),
      ...(q ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { deck: { contains: q, mode: "insensitive" } },
          { contentHtml: { contains: q, mode: "insensitive" } },
          { author: { contains: q, mode: "insensitive" } },
          { authorModel: { name: { contains: q, mode: "insensitive" } } },
          { legacyTags: { has: q } },
          { tags: { some: { name: { contains: q, mode: "insensitive" } } } },
          { category: { name: { contains: q, mode: "insensitive" } } }
        ]
      } : {}),
    };

    const [items, count] = await Promise.all([
      db.article.findMany({
        where: whereClause,
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
        select: ARTICLE_CARD_WITH_TAGS_SELECT,
      }),
      db.article.count({ where: whereClause })
    ]);

    results = items;
    totalCount = count;
  }

  const hasNextPage = skip + limit < totalCount;
  const hasPrevPage = page > 1;

  return (
    <div className="wrap">
      <section className="cat-hero" style={{ marginBottom: 0 }}>
        <span className="kicker">Search</span>
        <h1>{q ? `Results for "${q}"` : cat ? `Results in category` : "Search xCipher"}</h1>
        <p>{q || cat ? `Found ${totalCount} stories.` : "Enter a search term to find stories, topics, and authors."}</p>
        
        <form action="/search" method="GET" style={{ display: 'flex', gap: '8px', marginTop: '24px', maxWidth: '600px' }}>
          <input 
            type="search" 
            name="q" 
            defaultValue={q} 
            placeholder="Search for articles, tags, authors..." 
            className="ed-input" 
            style={{ flexGrow: 1 }}
          />
          <button type="submit" className="btn-cs primary">Search</button>
        </form>
      </section>
      
      <div className="cat-body">
        <div>
          {results.length > 0 ? (
            <div className="day-group">
              <div className="day-label" style={{ marginBottom: "16px" }}>Stories</div>
              {results.map(a => <StoryRow key={a.id} article={a} />)}
              
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px", padding: "16px 0", borderTop: "1px solid var(--line)" }}>
                {hasPrevPage ? (
                  <a href={`/search?q=${encodeURIComponent(q)}&cat=${encodeURIComponent(cat)}&page=${page - 1}`} className="btn-cs">← Previous Page</a>
                ) : <span />}
                {hasNextPage && (
                  <a href={`/search?q=${encodeURIComponent(q)}&cat=${encodeURIComponent(cat)}&page=${page + 1}`} className="btn-cs primary">Next Page →</a>
                )}
              </div>
            </div>
          ) : (
            (q || cat) ? (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>No results found</h3>
                <p className="muted">We couldn't find any stories matching your criteria. Try adjusting your keywords or removing filters.</p>
              </div>
            ) : null
          )}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
