"use client";

import { useEffect, useRef } from "react";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import dynamic from "next/dynamic";
import CodeBlockEnhancer from "./CodeBlockEnhancer";
import parse, { DOMNode, Element, domToReact } from 'html-react-parser';

const DynamicChart = dynamic(() => import('./DynamicChart'), { ssr: false });
const FrontendMermaidViewer = dynamic(() => import('./FrontendMermaidViewer'), { ssr: false });
const InteractiveChartViewer = dynamic(() => import('./InteractiveChartViewer'), { ssr: false });
import ProsConsViewer from './ProsConsViewer';
import SpecSheetViewer from './SpecSheetViewer';
import ScoreBreakdownViewer from './ScoreBreakdownViewer';
import EditorialBlockViewer from './EditorialBlockViewer';
import SingleImageViewer from './SingleImageViewer';
import { parseEditorialBlock } from '@/lib/editorial-blocks';

function textContent(nodes: DOMNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return node.data;
      if (node instanceof Element) return textContent(node.children as DOMNode[]);
      return "";
    })
    .join("")
    .trim();
}

interface Props {
  html?: string | null;
  globalLeaderboard?: Record<string, { topScore: number, deviceName: string }>;
  deviceName?: string;
}

export default function ArticleBody({ html, globalLeaderboard, deviceName }: Props) {
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

    // Make tables fully responsive and sleek on mobile
    const tables = container.querySelectorAll("table");
    tables.forEach((table) => {
      // Clean up any old border/padding styles potentially injected by editors
      table.removeAttribute('border');
      
      // 1. Implement Horizontal Scrolling Wrapper
      if (table.parentElement && !table.parentElement.classList.contains('overflow-x-auto')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'w-full overflow-x-auto no-scrollbar scroll-smooth';
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
        if (domNode.attribs['data-type'] === 'editorial-block') {
          const block = parseEditorialBlock(domNode.attribs['data-editorial-block']);
          return block ? <EditorialBlockViewer block={block} /> : <></>;
        }
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

        if (domNode.attribs['data-type'] === 'smart-interactive-chart') {
          const dataAttr = domNode.attribs['data-chart-data'];
          const configAttr = domNode.attribs['data-chart-config'];

          if (dataAttr && configAttr) {
            try {
              const data = JSON.parse(dataAttr);
              const config = JSON.parse(configAttr);
              return <InteractiveChartViewer data={data} config={config} />;
            } catch (e) {
              console.error("Failed to parse smart chart config", e);
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
          const itemsAttr = domNode.attribs['data-items'] || domNode.attribs['data-scores'] || domNode.attribs['data-categories'];
          const overallScoreAttr = domNode.attribs['data-overall-score'] || domNode.attribs['data-total-score'];
          try {
            const raw = itemsAttr ? JSON.parse(itemsAttr) : [];
            const items = Array.isArray(raw) ? raw : [];
            const overallScore = overallScoreAttr ? Number(overallScoreAttr) : 0;
            return <ScoreBreakdownViewer items={items} overallScore={overallScore} globalLeaderboard={globalLeaderboard} deviceName={deviceName} />;
          } catch (e) {
            console.error("Failed to parse score breakdown", e);
          }
        }

        if (domNode.name === 'table') {
          return (
            <div className="w-full overflow-x-auto no-scrollbar relative mb-6">
              <table className="w-full min-w-max table-auto text-sm">
                {domToReact(domNode.children as DOMNode[], options)}
              </table>
            </div>
          );
        }

        if (domNode.name === 'figure') {
          const image = domNode.children.find(
            (child): child is Element => child instanceof Element && child.name === 'img' && Boolean(child.attribs.src),
          );
          const figcaption = domNode.children.find(
            (child): child is Element => child instanceof Element && child.name === 'figcaption',
          );
          if (image) {
            return (
              <SingleImageViewer
                src={image.attribs.src}
                alt={image.attribs.alt}
                caption={figcaption ? textContent(figcaption.children as DOMNode[]) : image.attribs.title}
                credit={domNode.attribs['data-credit'] || image.attribs['data-credit']}
              />
            );
          }
        }

        if (domNode.name === 'img' && domNode.attribs.src) {
          return (
            <SingleImageViewer
              src={domNode.attribs.src}
              alt={domNode.attribs.alt}
              caption={domNode.attribs.title}
              credit={domNode.attribs['data-credit']}
            />
          );
        }

        if (domNode.name === 'th') {
          const { class: htmlClass, ...restAttribs } = domNode.attribs;
          return (
            <th {...restAttribs} className={`${htmlClass || ''} whitespace-nowrap`.trim()}>
              {domToReact(domNode.children as DOMNode[], options)}
            </th>
          );
        }
      }
    }
  };

  return (
    <>
      <div ref={containerRef} className="tiptap-content overflow-x-hidden break-words [overflow-wrap:break-word]">
        {parse(safeHtml, options)}
      </div>
      <CodeBlockEnhancer />
    </>
  );
}
