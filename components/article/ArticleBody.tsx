"use client";

import { useEffect, useRef } from "react";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import hljs from 'highlight.js/lib/common';
import CodeBlockEnhancer from "./CodeBlockEnhancer";
import parse, { DOMNode, Element } from 'html-react-parser';
import DynamicChart from './DynamicChart';

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

    });

    // Make tables fully responsive on mobile
    const tables = container.querySelectorAll("table");
    tables.forEach((table) => {
      // 1. Prevent Column Squeezing (ensure table expands)
      table.classList.add('min-w-full', 'table-auto');
      
      // 2. Typography & Cell Adjustments
      const cells = table.querySelectorAll('th, td');
      cells.forEach(cell => cell.classList.add('min-w-[150px]'));
      const ths = table.querySelectorAll('th');
      ths.forEach(th => th.classList.add('whitespace-nowrap'));

      // 3. Implement Horizontal Scrolling Wrapper
      if (table.parentElement && !table.parentElement.classList.contains('overflow-x-auto')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'overflow-x-auto max-w-full';
        wrapper.style.setProperty('-webkit-overflow-scrolling', 'touch');
        
        table.parentElement.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });
  }, [safeHtml]);

  const options = {
    replace: (domNode: DOMNode) => {
      if (domNode instanceof Element && domNode.attribs && domNode.attribs['data-type'] === 'interactive-chart') {
        const configAttr = domNode.attribs['data-config'];
        const chartTypeAttr = domNode.attribs['data-chart-type'];
        
        if (configAttr) {
          try {
            const config = JSON.parse(configAttr);
            return <DynamicChart config={config} chartType={chartTypeAttr || 'bar'} animateOnce={true} />;
          } catch (e) {
            console.error("Failed to parse chart config", e);
          }
        }
      }
    }
  };

  return (
    <>
      <div ref={containerRef} className="tiptap-content overflow-x-hidden break-words [overflow-wrap:anywhere]">
        {parse(safeHtml, options)}
      </div>
      <CodeBlockEnhancer />
    </>
  );
}
