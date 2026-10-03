"use client";

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, House, Image, Menu, Plus, Settings, X } from 'lucide-react';
import './mobile-console.css';

export default function AdminShell({ brand, actions, sidebar, avatar, displayName, canCreate, children }: {
  brand: ReactNode; actions: ReactNode; sidebar: ReactNode; avatar: ReactNode; displayName: string; canCreate: boolean; children: ReactNode;
}) {
  const pathname = usePathname() || '/admin';
  const drawer = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const shell = useRef<HTMLDivElement>(null);
  const writing = pathname.startsWith('/admin/editor');
  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => {
      const mobile = window.matchMedia('(max-width: 767px)').matches;
      const typing = document.activeElement?.matches('input, textarea, [contenteditable="true"]');
      setKeyboardOpen(Boolean(mobile && typing && viewport && window.innerHeight - viewport.height > 120));
      shell.current?.style.setProperty('--console-height', `${mobile && viewport ? viewport.height : window.innerHeight}px`);
    };
    update();
    viewport?.addEventListener('resize', update);
    window.addEventListener('resize', update);
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    return () => { viewport?.removeEventListener('resize', update); window.removeEventListener('resize', update); document.removeEventListener('focusin', update); document.removeEventListener('focusout', update); };
  }, []);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const close = () => { if (desktop.matches) drawer.current?.close(); };
    desktop.addEventListener('change', close);
    return () => desktop.removeEventListener('change', close);
  }, []);
  const tabs = [{ href: '/admin', label: 'Home', icon: House }, { href: '/admin/articles', label: 'Articles', icon: FileText }, { href: '/admin/media', label: 'Media', icon: Image }, { href: '/admin/settings', label: 'Settings', icon: Settings }];
  return <div ref={shell} className="console open mobile-console" id="console" aria-label="xSypher editorial console" data-keyboard-open={keyboardOpen} data-writing={writing}>
    <a href="#csMain" className="skip-link">Skip to content</a>
    <header className="cs-top sticky top-0 backdrop-blur-md">
      <button ref={trigger} type="button" className="console-menu-trigger md:hidden" onClick={() => drawer.current?.showModal()} aria-label="Open newsroom navigation" aria-haspopup="dialog"><Menu size={20} /></button>
      {brand}<span className="cs-tag hidden md:inline-flex">Editorial Console</span><span className="spacer" />
      <div className="console-top-actions">{actions}</div>
      <Link href="/admin/settings" className="console-app-avatar md:hidden" aria-label={`Account settings for ${displayName}`}>{avatar}</Link>
    </header>
    <div className="cs-body">
      <div className="console-desktop-sidebar hidden md:flex">{sidebar}</div>
      <main className="cs-main" id="csMain" tabIndex={-1}>{children}</main>
    </div>
    <dialog ref={drawer} className="console-navigation-sheet" aria-label="Newsroom navigation" onClose={() => trigger.current?.focus()} onClick={event => { if (event.target === event.currentTarget) drawer.current?.close(); }}>
      <div className="console-sheet-heading"><div><span>XSYPHER</span><h2>Your newsroom</h2></div><button type="button" onClick={() => drawer.current?.close()} aria-label="Close navigation"><X size={20} /></button></div>
      <div onClick={event => { if ((event.target as HTMLElement).closest('a')) drawer.current?.close(); }}>{sidebar}</div>
      <div className="console-sheet-actions">{actions}</div>
    </dialog>
    <nav className="console-bottom-nav fixed bottom-0 w-full md:hidden" aria-label="Primary navigation">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = href === '/admin' ? pathname === href : href === '/admin/articles' ? pathname.startsWith(href) || writing || pathname.startsWith('/admin/review') : pathname.startsWith(href);
        return <Link key={href} href={href} aria-current={active ? 'page' : undefined}><Icon size={20} strokeWidth={active ? 2.2 : 1.7} /><span>{label}</span></Link>;
      })}
    </nav>
    {canCreate && !writing && <Link href="/admin/editor" className="console-fab md:hidden" aria-label="Create a new story"><Plus size={23} /><span>New story</span></Link>}
  </div>;
}
