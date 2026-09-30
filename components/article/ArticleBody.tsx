"use client";

import { useEffect, useRef } from "react";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import dynamic from "next/dynamic";
import CodeBlockEnhancer from "./CodeBlockEnhancer";
import parse, { DOMNode, Element } from 'html-react-parser';

const DynamicChart = dynamic(() => import('./DynamicChart'), { ssr: false });
const FrontendMermaidViewer = dynamic(() => import('./FrontendMermaidViewer'), { ssr: false });
import ProsConsViewer from './ProsConsViewer';
import SpecSheetViewer from './SpecSheetViewer';
import ScoreBreakdownViewer from './ScoreBreakdownViewer';

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

    let cancelled = false;

    async function highlightBlocks() {
      const codeBlocks = container?.querySelectorAll("pre") || [];
      if (!codeBlocks.length) return;

      const { default: hljs } = await import('highlight.js/lib/common');
      if (cancelled) return;

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
    }

    highlightBlocks();

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

    return () => {
      cancelled = true;
    };
  }, [safeHtml]);

  const options = {
    replace: (domNode: DOMNode) => {
      if (domNode instanceof Element && domNode.attribs) {
        if (domNode.attribs['data-type'] === 'interactive-chart') {
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
        
        if (domNode.attribs['data-type'] === 'mermaid-block') {
          const graphDef = domNode.attribs['data-graph-definition'];
          const containerWidth = domNode.attribs['data-container-width'] || '100%';
          if (graphDef) {
            return <FrontendMermaidViewer graphDefinition={graphDef} containerWidth={containerWidth} />;
          }
        }
        
        if (domNode.attribs['data-type'] === 'pros-cons-block') {
          const prosAttr = domNode.attribs['data-pros'];
          const consAttr = domNode.attribs['data-cons'];
          try {
            const pros = prosAttr ? JSON.parse(prosAttr) : [];
            const cons = consAttr ? JSON.parse(consAttr) : [];
            return <ProsConsViewer pros={pros} cons={cons} />;
          } catch (e) {
            console.error("Failed to parse pros/cons", e);
          }
        }

        if (domNode.attribs['data-type'] === 'spec-sheet-block') {
          const itemsAttr = domNode.attribs['data-items'] || domNode.attribs['data-specs'];
          try {
            const rawItems = itemsAttr ? JSON.parse(itemsAttr) : [];
            const items = rawItems.map((item: any) => ({
              category: item.category || '',
              key: item.key || item.label || '',
              value: item.value || '',
            }));
            return <SpecSheetViewer items={items} />;
          } catch (e) {
            console.error("Failed to parse spec sheet", e);
          }
        }

        if (domNode.attribs['data-type'] === 'score-breakdown-block') {
          const categoriesAttr = domNode.attribs['data-categories'] || domNode.attribs['data-scores'];
          const overallScoreAttr = domNode.attribs['data-overall-score'] || domNode.attribs['data-total-score'];
          try {
            const rawCategories = categoriesAttr ? JSON.parse(categoriesAttr) : [];
            const categories = rawCategories.map((c: any) => ({
              label: c.label || c.name || '',
              score: typeof c.score === 'number' ? c.score : Number(c.score || 0),
            }));
            const overallScore = overallScoreAttr ? Number(overallScoreAttr) : 0;
            return <ScoreBreakdownViewer categories={categories} overallScore={overallScore} />;
          } catch (e) {
            console.error("Failed to parse score breakdown", e);
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
