"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";
import {
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/app/actions/notifications";

interface Props {
  items: NotificationItem[];
  unreadCount: number;
}

// `now` is passed in rather than read from the clock, so the value is stable
// for a whole render pass. Reading Date.now() per item means two notifications
// created in the same second can disagree, and on a client component it risks a
// hydration mismatch between the server's clock and the browser's.
function relativeTime(date: Date | string, now: number): string {
  const diffMs = now - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diffMs / 86400000);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationBell({ items, unreadCount }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  // Close on outside click and on Escape. Escape also returns focus to the
  // trigger, otherwise a keyboard user is dropped at the top of the document.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Move focus into the panel when it opens, so the list is reachable by
  // keyboard without tabbing through everything behind it.
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  const handleToggle = () => {
    setOpen((wasOpen) => {
      if (!wasOpen) setNow(Date.now());
      return !wasOpen;
    });
  };

  const handleOpenItem = (item: NotificationItem) => {
    if (!item.isRead) {
      startTransition(async () => {
        await markNotificationRead(item.id);
        router.refresh();
      });
    }
    setOpen(false);
  };

  const handleMarkAll = () => {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  };

  // Captured when the panel opens rather than read during render: one clock
  // reading for the whole list, so two notifications a second apart cannot
  // disagree, and no Date.now() runs while rendering -- which on a client
  // component risks a server/client hydration mismatch.
  const [now, setNow] = useState(0);

  const label =
    unreadCount > 0
      ? `Notifications, ${unreadCount} unread`
      : "Notifications, none unread";

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-muted hover:text-ink hover:bg-surface-2 border border-transparent hover:border-line transition-colors cursor-pointer"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="w-4 h-4" aria-hidden="true" />
        {unreadCount > 0 && (
          // Count is rendered as text, not just a dot, so the number is
          // available without relying on colour alone.
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[10px] font-bold leading-4 text-center tabular-nums"
            aria-hidden="true"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-surface border border-line rounded-xl shadow-2 z-50 focus:outline-none"
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={isPending}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3 h-3" aria-hidden="true" />
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted">
              Nothing yet. Review decisions and publications will appear here.
            </p>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-line">
              {items.map((item) => {
                const body = (
                  <>
                    <span
                      className={`block text-xs leading-relaxed ${
                        item.isRead ? "text-muted" : "text-ink font-medium"
                      }`}
                    >
                      {item.message}
                    </span>
                    <span className="block text-[10px] text-faint mt-1">
                      {relativeTime(item.createdAt, now)}
                      {!item.isRead && (
                        // Unread is carried by weight and by this word, not by
                        // the accent dot alone.
                        <span className="text-accent font-semibold"> · Unread</span>
                      )}
                    </span>
                  </>
                );

                return (
                  <li key={item.id}>
                    {item.link ? (
                      <Link
                        href={item.link}
                        onClick={() => handleOpenItem(item)}
                        className="block px-4 py-3 hover:bg-surface-2 transition-colors"
                      >
                        {body}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenItem(item)}
                        className="block w-full text-left px-4 py-3 hover:bg-surface-2 transition-colors cursor-pointer"
                      >
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
