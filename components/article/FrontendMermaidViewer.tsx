"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from 'next-themes';

interface Props {
  graphDefinition: string;
  containerWidth?: string;
}

/** Decode HTML entities that the sanitizer injects into attribute values.
 *  e.g. `A--&gt;B` becomes `A-->B`, `&amp;` becomes `&`, etc. */
function decodeHtmlEntities(str: string): string {
  if (typeof document === 'undefined') return str;
  const el = document.createElement('textarea');
  el.innerHTML = str;
  return el.value;
}

export default function FrontendMermaidViewer({ graphDefinition, containerWidth = '100%' }: Props) {
  const decoded = decodeHtmlEntities(graphDefinition);
  const [svgContent, setSvgContent] = useState('');
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const isDark = theme === 'dark';

    const renderMermaid = async () => {
      try {
        const { default: mermaid } = await import('mermaid');
        if (cancelled) return;

        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            primaryColor: isDark ? '#1a1a1a' : '#f2f2f2',
            primaryBorderColor: isDark ? '#2d2d2d' : '#e6e6e6',
            primaryTextColor: isDark ? '#ffffff' : '#111111',
            lineColor: isDark ? '#e0e0e0' : '#333333',
            edgeLabelBackground: 'transparent',
          },
          themeCSS: `
            .node rect, .node circle, .node ellipse, .node polygon, .node path, .cluster rect { 
              filter: none !important; 
              box-shadow: none !important; 
            }
            .edgeLabel rect {
              fill: transparent !important;
            }
            .edgeLabel text {
              fill: var(--ink, #111111) !important;
              font-weight: 500 !important;
            }
            .edgePath path, .flowchart-link {
              stroke: var(--ink, #333333) !important;
            }
          `,
          fontFamily: 'inherit',
          flowchart: {
            htmlLabels: false,
            padding: 20
          }
        });

        const id = `mermaid-frontend-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, decoded);
        if (!cancelled) {
          setSvgContent(svg);
        }
      } catch (err) {
        if (!cancelled) {
          setSvgContent(`<div class="text-red-500 text-sm">Diagram rendering failed.</div>`);
        }
      }
    };

    renderMermaid();

    return () => {
      cancelled = true;
    };
  }, [decoded, theme]);

  return (
    <div className="flex justify-center w-full my-8">
      <div
        className="relative"
        style={{
          width: containerWidth || '100%',
          maxWidth: '100%',
          margin: '0 auto',
        }}
      >
        <div
          ref={containerRef}
          className="mermaid-svg-container not-prose overflow-x-auto w-full [&_svg]:!w-full [&_svg]:!h-auto"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
        <style>{`
          .mermaid-svg-container svg {
            width: 100% !important;
            height: auto !important;
          }
        `}</style>
      </div>
    </div>
  );
}
