"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { stepFs, getInitialFs, applyFs } from "@/lib/fontSize";

import { showToast } from "@/lib/utils";

interface ArticleSidebarProps {
  title?: string;
}

export default function ArticleSidebar({ title }: ArticleSidebarProps) {
  const [shareUrl, setShareUrl] = useState("");
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setShareUrl(window.location.href);
    const initialFs = getInitialFs();
    applyFs(initialFs, false);
  }, []);

  const handleCopy = () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => showToast("Link copied to clipboard"))
        .catch(() => showToast("Failed to copy link"));
    } else {
      showToast("Copy not supported in this browser");
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title || "");

  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}${encodedTitle ? `&text=${encodedTitle}` : ""}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

  return (
    <aside className="rail" aria-label="Article tools">
      <button
        className="icon-btn"
        onClick={handleCopy}
        data-copy="copy"
        title="Copy Link"
        aria-label="Copy Link"
      >
        <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </svg>
      </button>
      <a
        className="icon-btn"
        href={shareUrl ? twitterUrl : "#"}
        target="_blank"
        rel="noopener noreferrer"
        title="Share on X"
        aria-label="Share on X"
      >
        <svg className="ic" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.9 2H22l-6.8 7.8L23.3 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L1 2h6.5l4.4 5.9L18.9 2zm-1.1 18h1.7L7.1 3.9H5.3L17.8 20z" />
        </svg>
      </a>
      <a
        className="icon-btn"
        href={shareUrl ? facebookUrl : "#"}
        target="_blank"
        rel="noopener noreferrer"
        title="Share on Facebook"
        aria-label="Share on Facebook"
      >
        <svg className="ic" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.7c0-.9.3-1.6 1.6-1.6h1.6V4.2c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.6H7.5V14h2.8v8h3.2z" />
        </svg>
      </a>
      <a
        className="icon-btn"
        href={shareUrl ? linkedInUrl : "#"}
        target="_blank"
        rel="noopener noreferrer"
        title="Share on LinkedIn"
        aria-label="Share on LinkedIn"
      >
        <svg className="ic" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zm7.5 0h3.8v2.2h.1c.5-1 1.8-2.2 3.8-2.2 4 0 4.8 2.7 4.8 6.1V24h-4v-8.5c0-2-.4-3.5-2.1-3.5-1.7 0-2.4 1.2-2.4 3.4V24h-4V8z" />
        </svg>
      </a>
      <div className="r-div"></div>
      <button
        className="icon-btn"
        id="fsDown"
        onClick={() => stepFs(-1)}
        title="Smaller text"
        aria-label="Smaller text"
      >
        <span style={{ font: "700 13px var(--f-ui)" }}>A−</span>
      </button>
      <button
        className="icon-btn"
        id="fsUp"
        onClick={() => stepFs(1)}
        title="Larger text"
        aria-label="Larger text"
      >
        <span style={{ font: "700 15px var(--f-ui)" }}>A+</span>
      </button>
      <div className="r-div"></div>
      <button
        className="icon-btn"
        id="railTheme"
        onClick={toggleTheme}
        title="Toggle reading theme"
        aria-label="Toggle reading theme"
      >
        <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />
        </svg>
      </button>
      <button
        className="icon-btn"
        id="printBtn"
        onClick={() => window.print()}
        title="Print article"
        aria-label="Print article"
      >
        <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="7" />
        </svg>
      </button>
    </aside>
  );
}
