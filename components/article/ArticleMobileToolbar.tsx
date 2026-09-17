"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { stepFs } from "@/lib/fontSize";
import { subscribeSpeech, toggleSpeech } from "@/lib/speech";
import { showToast } from "@/lib/utils";

export default function ArticleMobileToolbar() {
  const [speaking, setSpeaking] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    document.body.classList.add("is-article");
    const unsubscribe = subscribeSpeech((state) => {
      setSpeaking(state);
    });
    return () => {
      unsubscribe();
      document.body.classList.remove("is-article");
    };
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

  return (
    <div className="art-tools-m" role="toolbar" aria-label="Article tools">
      <button onClick={handleCopy} data-copy="copy" aria-label="Copy article link">
        <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </svg>Copy
      </button>
      <button
        id="mListen"
        className={speaking ? "on" : ""}
        onClick={toggleSpeech}
        aria-label={speaking ? "Stop narration" : "Listen to article"}
      >
        <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M11 5 6 9H3v6h3l5 4V5z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        </svg>{speaking ? "Stop" : "Listen"}
      </button>
      <button id="mFsDown" onClick={() => stepFs(-1)} aria-label="Smaller text">
        <span style={{ font: "700 14px var(--f-ui)" }}>A−</span>Text
      </button>
      <button id="mFsUp" onClick={() => stepFs(1)} aria-label="Larger text">
        <span style={{ font: "700 16px var(--f-ui)" }}>A+</span>Text
      </button>
      <button id="mTheme" onClick={toggleTheme} aria-label="Toggle theme">
        <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />
        </svg>Theme
      </button>
    </div>
  );
}
