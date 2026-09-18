"use client";

import React from "react";

interface SeoPreviewProps {
  title: string;
  description: string;
  slug: string;
  image?: string;
  siteName?: string;
}

export default function SeoPreview({
  title,
  description,
  slug,
  image,
  siteName = "xSypher",
}: SeoPreviewProps) {
  const truncatedTitle = title.length > 60 ? title.substring(0, 60) + "..." : title;
  const truncatedDesc = description.length > 155 ? description.substring(0, 155) + "..." : description;

  const url = `https://xsypher.com/article/${slug}`;

  return (
    <div style={{ marginTop: "16px", padding: "16px", border: "1px solid var(--line)", borderRadius: "var(--r-md)", background: "var(--bg-elevated)" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "var(--ink-main)" }}>Search Engine Preview</h3>
      
      <div style={{ padding: "12px", background: "#ffffff", borderRadius: "8px", border: "1px solid #dfe1e5", fontFamily: "arial, sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
          {image && (
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "1px solid #dfe1e5" }}>
              <img src={image} alt="Site Favicon" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div>
            <div style={{ fontSize: "14px", color: "#202124", lineHeight: "1.3" }}>{siteName}</div>
            <div style={{ fontSize: "12px", color: "#4d5156", lineHeight: "1.3" }}>{url}</div>
          </div>
        </div>
        <h4 style={{ color: "#1a0dab", fontSize: "20px", fontWeight: 400, margin: "4px 0", cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {truncatedTitle || "Your Article Title Will Appear Here"}
        </h4>
        <p style={{ color: "#4d5156", fontSize: "14px", lineHeight: "1.58", margin: 0 }}>
          {truncatedDesc || "Write a compelling description that accurately summarizes the article. This text will appear in search results."}
        </p>
      </div>

      <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 500, color: title.length > 60 ? "var(--error)" : "var(--ink-muted)", marginBottom: "4px" }}>
            Title Length: {title.length} / 60
          </div>
          <div style={{ height: "4px", background: "var(--line)", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ height: "100%", background: title.length > 60 ? "var(--error)" : "var(--accent)", width: `${Math.min((title.length / 60) * 100, 100)}%` }} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 500, color: description.length > 155 ? "var(--error)" : "var(--ink-muted)", marginBottom: "4px" }}>
            Description Length: {description.length} / 155
          </div>
          <div style={{ height: "4px", background: "var(--line)", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ height: "100%", background: description.length > 155 ? "var(--error)" : "var(--accent)", width: `${Math.min((description.length / 155) * 100, 100)}%` }} />
          </div>
        </div>
      </div>
      
      {(!title || !description) && (
        <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--warning)", display: "flex", gap: "6px", alignItems: "flex-start" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Missing SEO metadata. Search engines may generate suboptimal snippets automatically.
        </div>
      )}
    </div>
  );
}
