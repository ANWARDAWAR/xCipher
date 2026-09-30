import { NodeViewWrapper } from '@tiptap/react';
import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from 'next-themes';

/** Decode HTML entities that the sanitizer injects into attribute values. */
function decodeHtmlEntities(str: string): string {
  if (typeof document === 'undefined') return str;
  const el = document.createElement('textarea');
  el.innerHTML = str;
  return el.value;
}

export const MermaidNodeView = (props: any) => {
  const { node, updateAttributes, selected } = props;
  const graphDefinition = decodeHtmlEntities(node.attrs.graphDefinition);
  const [isEditing, setIsEditing] = useState(false);
  const [svgContent, setSvgContent] = useState('');
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [containerWidth, setContainerWidth] = useState(node.attrs.containerWidth || '100%');
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const resizableRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    if (resizableRef.current) {
      startWidthRef.current = resizableRef.current.offsetWidth;
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const dx = e.clientX - startXRef.current;
      const newWidth = Math.max(200, startWidthRef.current + dx);
      setContainerWidth(`${newWidth}px`);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        updateAttributes({ containerWidth });
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, containerWidth, updateAttributes]);

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
            primaryColor: isDark ? '#1a1a1a' : '#f2f2f2', // var(--surface-2)
            primaryBorderColor: isDark ? '#2d2d2d' : '#e6e6e6', // var(--line)
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

        const id = `mermaid-svg-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, graphDefinition);
        if (!cancelled) {
          setSvgContent(svg);
        }
      } catch (err) {
        if (!cancelled) {
          setSvgContent(`<div class="text-red-500">Syntax error in Mermaid graph</div>`);
        }
      }
    };

    if (!isEditing) {
      renderMermaid();
    }

    return () => {
      cancelled = true;
    };
  }, [graphDefinition, theme, isEditing]);

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    updateAttributes({ graphDefinition: e.target.value.trim() });
    setIsEditing(false);
  };

  return (
    <NodeViewWrapper className={`mermaid-node-wrapper relative my-4 rounded p-4 ${selected ? 'outline outline-1 outline-line' : ''}`}>
      {isEditing ? (
        <textarea
          className="w-full h-32 p-2 bg-background text-foreground border rounded"
          defaultValue={graphDefinition}
          onBlur={handleBlur}
          autoFocus
        />
      ) : (
        <div className="flex justify-center w-full my-8">
          <div 
            ref={resizableRef} 
            className="relative mx-auto" 
            style={{ width: isResizing ? containerWidth : (node.attrs.containerWidth || '100%'), maxWidth: '100%' }}
          >
            <div
              ref={containerRef}
              className="mermaid-svg-container not-prose cursor-pointer overflow-x-auto w-full"
              onDoubleClick={() => setIsEditing(true)}
              dangerouslySetInnerHTML={{ __html: svgContent }}
              spellCheck={false}
            />
            {selected && (
              <div
                className="absolute bottom-0 right-0 w-3 h-3 bg-[var(--line)] cursor-se-resize rounded-sm hover:bg-[var(--accent)] transition-colors"
                onMouseDown={handleMouseDown}
                title="Drag to resize"
              />
            )}
          </div>
        </div>
      )}
      {!isEditing && (
        <button
          className="absolute top-2 right-2 bg-secondary text-secondary-foreground px-2 py-1 text-xs rounded opacity-0 hover:opacity-100 transition-opacity"
          onClick={() => setIsEditing(true)}
        >
          Edit Graph
        </button>
      )}
    </NodeViewWrapper>
  );
};
