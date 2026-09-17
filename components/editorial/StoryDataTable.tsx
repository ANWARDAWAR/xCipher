"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { fmtViews } from "@/lib/utils";
import DeleteArticleButton from "./DeleteArticleButton";

type Article = any; // We'll type this broadly since Prisma schemas can be large

interface StoryDataTableProps {
  articles: Article[];
  showStatusBadge?: boolean;
  emptyMessage?: string;
  userRole?: string;
}

export default function StoryDataTable({ articles, showStatusBadge = true, emptyMessage = "Nothing here yet.", userRole }: StoryDataTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const categories = useMemo(() => {
    const cats = new Set<string>();
    articles.forEach(a => {
      if (a.category?.name) cats.add(a.category.name);
    });
    return Array.from(cats).sort();
  }, [articles]);

  const statuses = useMemo(() => {
    const s = new Set<string>();
    articles.forEach(a => s.add(a.status));
    return Array.from(s).sort();
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      const matchSearch = search ? a.title.toLowerCase().includes(search.toLowerCase()) || (a.author && a.author.toLowerCase().includes(search.toLowerCase())) : true;
      const matchStatus = statusFilter ? a.status === statusFilter : true;
      const matchCategory = categoryFilter ? a.category?.name === categoryFilter : true;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [articles, search, statusFilter, categoryFilter]);

  return (
    <div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input 
          type="text" 
          placeholder="Search stories..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ed-input"
          style={{ maxWidth: "250px", margin: 0 }}
        />
        {statuses.length > 1 && (
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="ed-input" style={{ width: "auto", margin: 0 }}>
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {categories.length > 1 && (
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="ed-input" style={{ width: "auto", margin: 0 }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      <div className="cs-card" style={{ overflowX: "auto" }}>
        {filteredArticles.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)", color: "var(--ink-muted)" }}>
                <th style={{ padding: "12px", fontWeight: 500 }}>Title</th>
                <th style={{ padding: "12px", fontWeight: 500 }}>Category</th>
                <th style={{ padding: "12px", fontWeight: 500 }}>Author</th>
                {showStatusBadge && <th style={{ padding: "12px", fontWeight: 500 }}>Status</th>}
                <th style={{ padding: "12px", fontWeight: 500 }}>Updated</th>
                <th style={{ padding: "12px", fontWeight: 500 }}>Reads</th>
                <th style={{ padding: "12px", fontWeight: 500, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map(a => (
                <tr key={a.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px", fontWeight: 600 }}>{a.title || "Untitled story"}</td>
                  <td style={{ padding: "12px", color: "var(--ink-muted)" }}>{a.category?.name || "None"}</td>
                  <td style={{ padding: "12px", color: "var(--ink-muted)" }}>{a.authorModel?.name || a.author || "Unknown"}</td>
                  {showStatusBadge && (
                    <td style={{ padding: "12px" }}>
                      <span style={{ 
                        padding: "2px 8px", 
                        borderRadius: "12px", 
                        fontSize: "12px", 
                        fontWeight: 600,
                        background: a.status === "PUBLISHED" ? "rgba(16, 185, 129, 0.15)" : a.status === "DRAFT" ? "rgba(107, 114, 128, 0.15)" : "rgba(245, 158, 11, 0.15)",
                        color: a.status === "PUBLISHED" ? "var(--success)" : a.status === "DRAFT" ? "var(--muted)" : "var(--warning)"
                      }}>
                        {a.status}
                      </span>
                    </td>
                  )}
                  <td style={{ padding: "12px", color: "var(--ink-muted)" }}>{new Date(a.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  <td style={{ padding: "12px", color: "var(--ink-muted)" }}>{fmtViews(a.views || 0)}</td>
                  <td style={{ padding: "12px", textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    {a.status === "PUBLISHED" && (
                      <Link className="act" href={`/article/${a.slug}`} target="_blank">View</Link>
                    )}
                    <Link href={`/admin/editor/${a.id}`} className="act">{a.status === "PUBLISHED" ? "Edit" : "Open"}</Link>
                    {userRole !== "AUTHOR" && (
                      <DeleteArticleButton id={a.id} title={a.title} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--ink-muted)" }}>
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}
