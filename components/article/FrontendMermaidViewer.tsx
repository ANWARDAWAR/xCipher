"use client";

import React, { useEffect, useState, useRef } from 'react';
import mermaid from 'mermaid';
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
    const isDark = theme === 'dark';
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: isDark ? '#1a1a1a' : '#f2f2f2',
        primaryBorderColor: isDark ? '#2d2d2d' : '#e6e6e6',
        primaryTextColor: isDark ? '#ffffff' : '#000000',
        lineColor: isDark ? '#c4c4c4' : '#4a4a4a',
        edgeLabelBackground: 'transparent',
      },
      themeCSS: `
        .node rect, .node circle, .node ellipse, .node polygon, .node path, .cluster rect { 
          filter: none !important; 
          box-shadow: none !important; 
        }
        .edgeLabel rect {
          fill: var(--bg) !important;
        }
      `,
      fontFamily: 'inherit',
      flowchart: {
        htmlLabels: false,
        padding: 20
      }
    });

    const renderMermaid = async () => {
      try {
        const id = `mermaid-frontend-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, decoded);
        setSvgContent(svg);
      } catch (err) {
        setSvgContent(`<div class="text-red-500 text-sm">Diagram rendering failed.</div>`);
      }
    };

    renderMermaid();
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
