import type { Metadata } from "next";
import { db } from "@/lib/db";
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
  };
}

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  let results: any[] = [];
  
  if (q) {
    results = await db.article.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { deck: { contains: q, mode: "insensitive" } },
          { author: { contains: q, mode: "insensitive" } },
          { tags: { has: q } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: { category: true },
    });
  }

  return (
    <div className="wrap">
      <section className="cat-hero" style={{ marginBottom: 0 }}>
        <span className="kicker">Search</span>
        <h1>{q ? `Results for "${q}"` : "Search xCipher"}</h1>
        <p>{q ? `Found ${results.length} stories matching your query.` : "Enter a search term to find stories, topics, and authors."}</p>
      </section>
      
      <div className="cat-body">
        <div>
          {results.length > 0 ? (
            <div className="day-group">
              <div className="day-label" style={{ marginBottom: "16px" }}>Stories</div>
              {results.map(a => <StoryRow key={a.id} article={a} />)}
            </div>
          ) : (
            q ? (
              <p className="muted" style={{ padding: "40px 0" }}>No results found for &apos;{q}&apos;. Try different keywords.</p>
            ) : null
          )}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
