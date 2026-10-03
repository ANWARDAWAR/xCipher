"use client";

import { Fragment, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Award, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { Tweet } from 'react-tweet';
import { type EditorialBlock, socialPost } from '@/lib/editorial-blocks';
import { optimizeImageUrl } from '@/lib/image-url';
import TableOfContents from './TableOfContents';
import TikTokEmbed from './TikTokEmbed';
import './editorial-blocks.css';

type Gallery = Extract<EditorialBlock, { kind: 'gallery' }>;
function GalleryViewer({ block }: { block: Gallery }) {
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const photo = block.images[index] || block.images[0];
  const move = (delta: number) => setIndex(value => (value + delta + block.images.length) % block.images.length);
  return <section className="publication-block">
    {block.title && <div className="publication-block-heading">{block.title}</div>}
    <div className={`publication-gallery gallery-${block.layout}`}>
      {block.images.map((image, i) => <figure key={i}>
        <button type="button" onClick={() => { setIndex(i); dialog.current?.showModal(); }} aria-label={`Enlarge: ${image.alt}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.src} alt={image.alt} loading="lazy" />
          <span className="gallery-zoom"><ZoomIn size={18} /></span>
        </button>
        {(image.caption || image.credit) && <figcaption>{image.caption}{image.credit && <small>Photo: {image.credit}</small>}</figcaption>}
      </figure>)}
    </div>
    <dialog ref={dialog} className="publication-lightbox" aria-label="Image gallery" onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }} onKeyDown={e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
    }}>
      <button type="button" className="lightbox-close" onClick={() => dialog.current?.close()} aria-label="Close gallery"><X /></button>
      <button type="button" onClick={() => move(-1)} aria-label="Previous image"><ChevronLeft /></button>
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt={photo.alt} />
        <figcaption aria-live="polite">{index + 1} / {block.images.length} · {photo.caption || photo.alt}{photo.credit && ` — ${photo.credit}`}</figcaption>
      </figure>
      <button type="button" onClick={() => move(1)} aria-label="Next image"><ChevronRight /></button>
    </dialog>
  </section>;
}

function ImageSlider({ block }: { block: Extract<EditorialBlock, { kind: 'slider' }> }) {
  const [position, setPosition] = useState(50);
  return <figure className="publication-block">
    <div className="publication-block-heading">{block.title}</div>
    <div className="publication-slider">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={block.after.src} alt={block.after.alt} loading="lazy" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="slider-before" src={block.before.src} alt={block.before.alt} loading="lazy" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }} />
      <span className="slider-label before">{block.beforeLabel}</span><span className="slider-label after">{block.afterLabel}</span>
      <span className="slider-handle" style={{ left: `${position}%` }} aria-hidden="true">↔</span>
      <input type="range" min="0" max="100" value={position} onChange={e => setPosition(Number(e.target.value))} aria-label={`Compare ${block.beforeLabel} with ${block.afterLabel}`} aria-valuetext={`${position}% ${block.beforeLabel}`} />
    </div>
    <figcaption>Drag to compare · {block.beforeLabel} / {block.afterLabel}</figcaption>
    {[block.before, block.after].map((photo, i) => (photo.caption || photo.credit) && <figcaption key={i}>{i === 0 ? block.beforeLabel : block.afterLabel}: {photo.caption}{photo.credit && ` — Photo: ${photo.credit}`}</figcaption>)}
  </figure>;
}

function SocialViewer({ block, preview }: { block: Extract<EditorialBlock, { kind: 'social' }>; preview: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(preview);
  const parsed = socialPost(block.url);
  const post = parsed && block.provider === parsed.provider && block.postId === parsed.id
    ? parsed
    : block.provider && block.postId
      ? { provider: block.provider, id: block.postId, url: block.url }
      : parsed;
  useEffect(() => {
    if (preview || !container.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '200px' });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [preview]);
  if (!post) return null;
  return <figure className="publication-block social-block" ref={container}>
    <div className="publication-block-heading">{post.provider === 'x' ? 'From X' : 'From TikTok'}</div>
    {preview && !visible && <button type="button" onClick={() => setVisible(true)} className="publication-button">Load post preview</button>}
    {visible && (post.provider === 'x'
      ? <div className="social-tweet"><Tweet id={post.id} /></div>
      : <TikTokEmbed videoId={post.id} />)}
    <figcaption>{block.caption} <a href={post.url} target="_blank" rel="noopener noreferrer">View original post ↗</a></figcaption>
  </figure>;
}

export default function EditorialBlockViewer({ block, preview = false }: { block: EditorialBlock; preview?: boolean }) {
  switch (block.kind) {
    case 'gallery': return <GalleryViewer block={block} />;
    case 'slider': return <ImageSlider block={block} />;
    case 'social': return <SocialViewer key={block.url} block={block} preview={preview} />;
    case 'toc': return preview ? <div className="publication-block"><div className="publication-block-heading">{block.title}</div><p>Automatically lists this article’s section headings.</p></div> : <TableOfContents containerSelector=".tiptap-content" title={block.title} />;
    case 'verdict': return <section className="publication-block verdict-block" aria-label="Final verdict">
      <div className="verdict-score"><strong>{block.score.toFixed(1)}</strong><span>OUT OF 10</span></div>
      <div className="verdict-content"><div className="verdict-badge"><Award size={16} />{block.badge}</div><div className="verdict-product">{block.product}</div><p>{block.summary}</p></div>
    </section>;
    case 'affiliate': return <section className="publication-block buying-block" aria-label="Where to buy">
      <div className="publication-block-heading">Where to buy <span>{block.product}</span></div>
      {block.offers.map((offer, i) => <div className="buying-offer" key={i}>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {offer.logo ? <img src={optimizeImageUrl(offer.logo, 320)} alt="" loading="lazy" /> : null}
          <strong>{offer.retailer}</strong>
        </div>
        <span>{offer.price}</span><a className="publication-button" href={offer.url} target="_blank" rel="sponsored noopener noreferrer">View deal <ArrowUpRight size={16} /></a>
      </div>)}
      <p className="affiliate-disclosure">{block.disclosure}</p>
    </section>;
    case 'comparison': return <section className="publication-block comparison-block">
      {block.title && <div className="publication-block-heading">{block.title}</div>}
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          {block.first && <h3 className="text-xl font-bold mb-4 text-center">{block.first}</h3>}
          {block.firstImage?.src && (
            <figure className="mb-4">
              <img src={block.firstImage.src} alt={block.firstImage.alt} className="w-full rounded-xl object-cover" />
              {block.firstImage.caption && <figcaption className="text-sm mt-2 text-[var(--muted)] text-center">{block.firstImage.caption}</figcaption>}
            </figure>
          )}
          {block.firstLink && (
            <a href={block.firstLink} target="_blank" rel="sponsored noopener noreferrer" className="publication-button block text-center w-full bg-[var(--ink)] text-[var(--surface)] p-3 rounded-lg font-medium">
              View Deal <ArrowUpRight size={16} className="inline-block ml-1 mb-1" />
            </a>
          )}
        </div>
        <div>
          {block.second && <h3 className="text-xl font-bold mb-4 text-center">{block.second}</h3>}
          {block.secondImage?.src && (
            <figure className="mb-4">
              <img src={block.secondImage.src} alt={block.secondImage.alt} className="w-full rounded-xl object-cover" />
              {block.secondImage.caption && <figcaption className="text-sm mt-2 text-[var(--muted)] text-center">{block.secondImage.caption}</figcaption>}
            </figure>
          )}
          {block.secondLink && (
            <a href={block.secondLink} target="_blank" rel="sponsored noopener noreferrer" className="publication-button block text-center w-full bg-[var(--ink)] text-[var(--surface)] p-3 rounded-lg font-medium">
              View Deal <ArrowUpRight size={16} className="inline-block ml-1 mb-1" />
            </a>
          )}
        </div>
      </div>

      {block.rows && block.rows.length > 0 && (
        <div className="comparison-scroll">
          <table>
            <caption className="sr-only">{block.first} compared with {block.second}</caption>
            <thead>
              <tr>
                <th scope="col">Specification</th>
                <th scope="col">{block.first || 'Device A'}</th>
                <th scope="col">{block.second || 'Device B'}</th>
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i, arr) => {
                const category = row.category?.trim() || 'General';
                const isNewCategory = i === 0 || category !== (arr[i - 1]?.category?.trim() || 'General');
                const vA = row.firstValue || row.first || '';
                const vB = row.secondValue || row.second || '';
                return (
                  <Fragment key={i}>
                    {isNewCategory && <tr className="category-header-row"><th colSpan={3}>{category}</th></tr>}
                    <tr>
                      <th scope="row" className="spec-name">{row.spec}</th>
                      <td className={`spec-val${row.winner === 'first' ? ' spec-winner' : ''}`} data-device={block.first || 'Device A'}>{vA}{row.winner === 'first' && <span className="sr-only"> (preferred)</span>}</td>
                      <td className={`spec-val${row.winner === 'second' ? ' spec-winner' : ''}`} data-device={block.second || 'Device B'}>{vB}{row.winner === 'second' && <span className="sr-only"> (preferred)</span>}</td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>;
  }
}
