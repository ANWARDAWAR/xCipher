"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { X } from 'lucide-react';

const subscribe = (callback: () => void) => {
  const media = window.matchMedia('(min-width: 1024px)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
};
const snapshot = () => window.matchMedia('(min-width: 1024px)').matches;

export default function PublishingPanel({ open, close, children }: { open: boolean; close: () => void; children: ReactNode }) {
  const desktop = useSyncExternalStore(subscribe, snapshot, () => false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (desktop || !dialog.current) return;
    if (open && !dialog.current.open) dialog.current.showModal();
    if (!open && dialog.current.open) dialog.current.close();
  }, [desktop, open]);
  if (desktop) return <aside className="studio-inspector studio-desktop-inspector" aria-label="Publishing details">{children}</aside>;
  return <dialog ref={dialog} className="studio-publishing-sheet" aria-labelledby="publishing-sheet-title" onClose={close} onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div className="publishing-sheet-handle" aria-hidden="true" />
    <header className="publishing-sheet-heading"><div><span>DOCUMENT SETTINGS</span><h2 id="publishing-sheet-title">Publishing details</h2></div><button type="button" onClick={close} aria-label="Close publishing details"><X size={20} /></button></header>
    <div className="publishing-sheet-content">{children}</div>
  </dialog>;
}
