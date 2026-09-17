"use client";

import { useEffect, useRef } from "react";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import hljs from 'highlight.js/lib/common';

interface Props {
  html?: string | null;
}

export default function ArticleBody({ html }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Rely on robust DOMPurify server sanitization
  const safeHtml = html ? sanitizeArticleHtml(html) : "<p>No content available.</p>";

  // Add copy buttons to code blocks after render
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const codeBlocks = container.querySelectorAll("pre");
    codeBlocks.forEach((pre) => {
      // Skip if already has a copy button
      if (pre.querySelector('.code-copy-btn')) return;

      // Create wrapper for relative positioning
      pre.style.position = 'relative';

      // Detect language from class
      const codeEl = pre.querySelector('code');
      const langMatch = codeEl?.className?.match(/language-([\w-]+)/);
      const language = langMatch?.[1] || '';

      // Highlight every code block, including blocks without an explicit language.
      if (codeEl) {
        codeEl.classList.add('hljs');
        try {
          hljs.highlightElement(codeEl);
        } catch {
          // Fall back to automatic detection for stale/unsupported language names.
          try {
            const highlighted = hljs.highlightAuto(codeEl.textContent || '');
            codeEl.innerHTML = highlighted.value;
          } catch {
            // Keep the original code readable if detection cannot determine a language.
          }
        }
      }

      // Add language badge
      if (language && language !== 'plaintext') {
        const badge = document.createElement('span');
        badge.className = 'code-lang-badge';
        badge.textContent = language;
        pre.appendChild(badge);
        
      }

      // Add copy button
      const copyBtn = document.createElement('button');
      copyBtn.className = 'code-copy-btn';
      copyBtn.type = 'button';
      copyBtn.setAttribute('aria-label', 'Copy code');
      copyBtn.title = 'Copy code';
      copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copy</span>`;

      copyBtn.addEventListener('click', async () => {
        const code = codeEl?.textContent || pre.textContent || '';
        try {
          await navigator.clipboard.writeText(code);
          copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg><span>Copied!</span>`;
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copy</span>`;
            copyBtn.classList.remove('copied');
          }, 2000);
        } catch {
          // Fallback for older browsers
          const textarea = document.createElement('textarea');
          textarea.value = code;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg><span>Copied!</span>`;
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copy</span>`;
            copyBtn.classList.remove('copied');
          }, 2000);
        }
      });

      pre.appendChild(copyBtn);
    });
  }, [safeHtml]);

  return (
    <div
      ref={containerRef}
      className="tiptap-content"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
