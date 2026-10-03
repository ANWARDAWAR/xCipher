"use client";

import { useEffect, useRef, useState } from 'react';

interface TocItem { id: string; text: string; level: number }

export default function TableOfContents({ containerSelector = '.prose', title = 'In this article' }: { containerSelector?: string; title?: string }) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const root = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = root.current?.closest(containerSelector) || document.querySelector(containerSelector);
    if (!container) return;
    let frame = 0;
    const update = () => {
      const seen = new Set<string>();
      const next = Array.from(container.querySelectorAll('h2, h3, h4')).filter(el => !el.closest('[data-toc], [contenteditable="false"]')).map((el, index) => {
        const base = el.textContent?.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || `section-${index + 1}`;
        let id = base;
        let suffix = 2;
        while (seen.has(id)) id = `${base}-${suffix++}`;
        seen.add(id);
        if (el.id !== id) el.id = id;
        return { id, text: el.textContent || '', level: Number(el.tagName[1]) };
      }).filter(item => item.text.trim());
      setItems(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    update();
    const observer = new MutationObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); });
    observer.observe(container, { childList: true, subtree: true, characterData: true });
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [containerSelector]);

  useEffect(() => {
    if (items.length === 0) return;

    const handleScroll = () => {
      const container = root.current?.closest(containerSelector) || document.querySelector(containerSelector);
      if (!container) return;

      const headingElements = Array.from(container.querySelectorAll('h2, h3, h4')).filter(el => !el.closest('[data-toc], [contenteditable="false"]'));
      let currentActiveId = '';

      for (const heading of headingElements) {
        const rect = heading.getBoundingClientRect();
        // 120px offset to account for sticky header or padding
        if (rect.top <= 150) {
          currentActiveId = heading.id;
        } else {
          break;
        }
      }

      if (!currentActiveId && headingElements.length > 0) {
        const firstRect = headingElements[0].getBoundingClientRect();
        if (firstRect.top > 150 && firstRect.top < window.innerHeight) {
          currentActiveId = headingElements[0].id;
        }
      }

      if (currentActiveId !== activeId) {
        setActiveId(currentActiveId);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [items, containerSelector, activeId]);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (activeId && navRef.current) {
      const activeElement = navRef.current.querySelector(`a[href="#${activeId}"]`) as HTMLElement;
      if (activeElement) {
        const nav = navRef.current;
        const navTop = nav.scrollTop;
        const navBottom = navTop + nav.clientHeight;
        // offsetTop is relative to the nav container because we'll add 'relative' to it
        const elTop = activeElement.offsetTop;
        const elBottom = elTop + activeElement.clientHeight;

        // If the element is outside the visible area of the scroller, scroll it into view (center it)
        if (elTop < navTop || elBottom > navBottom) {
          nav.scrollTo({
            top: elTop - nav.clientHeight / 2 + activeElement.clientHeight / 2,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [activeId]);

  return <div ref={root} data-toc className="article-toc bg-[var(--surface-2)] border border-[var(--line)] p-4 rounded-xl my-4">
    <div className="text-xs font-bold uppercase tracking-widest text-[var(--ink)] mb-3">{title}</div>
    {items.length ? <nav ref={navRef} aria-label={title} className="relative flex flex-col max-h-[65vh] overflow-y-auto no-scrollbar">{items.map(item => <a key={item.id} href={`#${item.id}`} className={`block relative text-sm transition-all duration-300 py-1.5 pr-2 border-l-[3px] rounded-r-lg ${item.id === activeId ? 'text-[var(--accent)] font-semibold border-[var(--accent)] bg-red-500/10 dark:bg-red-500/15 backdrop-blur-sm' : 'text-[var(--muted)] hover:text-[var(--ink)] border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-[var(--surface-3)]/50'} ${item.level === 3 ? 'pl-6' : item.level === 4 ? 'pl-8' : 'pl-3'}`} onClick={event => {
      event.preventDefault();
      const container = root.current?.closest(containerSelector) || document.querySelector(containerSelector);
      const target = Array.from(container?.querySelectorAll('h2, h3, h4') || []).find(el => el.id === item.id);
      target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    }}>{(item.level === 3 || item.level === 4) && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-2 -translate-y-[1px]"></span>}{item.text}</a>)}</nav> : <p className="text-xs text-[var(--muted)]">Add section headings to build an outline.</p>}
  </div>;
}
