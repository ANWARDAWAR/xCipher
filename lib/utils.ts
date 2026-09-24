import { Article } from "./mockData";

const PNGS = new Set([17483873]);

export function getImgSrc(imgId: number | string, w: number = 1200, h: number = 800) {
  if (typeof imgId === 'string' && imgId.startsWith('http')) return imgId;
  const numId = Number(imgId);
  const e = PNGS.has(numId) ? "png" : "jpeg";
  return `https://images.pexels.com/photos/${numId}/pexels-photo-${numId}.${e}?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;
}

export function timeAgo(mins: number) {
  if (mins < 1) return "Just now";
  if (mins < 60) return mins + " minutes ago";
  const h = Math.floor(mins / 60);
  if (h < 24) return h + (h === 1 ? " hour ago" : " hours ago");
  const d = Math.floor(h / 24);
  return d + (d === 1 ? " day ago" : " days ago");
}

export function fullDate(mins: number) {
  return new Date(Date.now() - mins * 60000).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function fmtViews(n: number) {
  return n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? Math.round(n / 1e3) + "K" : n;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export function showToast(msg: string, type?: 'default' | 'success' | 'error' | 'warning' | 'info', variant: 'standard' | 'premium' = 'standard') {
  if (typeof window === "undefined") return;

  const resolved = type ?? inferToastType(msg);
  
const existing = document.getElementById("toast");
  if (existing && existing.parentNode) {
    existing.parentNode.removeChild(existing);
  }
  if (toastTimer) clearTimeout(toastTimer);

  const t = document.createElement("div");
  t.id = "toast";
  t.dataset.type = resolved;

  const assertive = resolved === 'error';
  t.setAttribute("role", assertive ? "alert" : "status");
  t.setAttribute("aria-live", assertive ? "assertive" : "polite");

  const iconColors = {
    error: "text-red-500",
    success: "text-green-500",
    warning: "text-yellow-500",
    info: "text-blue-500",
    default: "text-gray-500",
  };
  const iconColor = iconColors[resolved] || iconColors.default;

  let bgClass = "bg-[#1e1e1e] border-white/20";
  if (resolved === 'error') bgClass = "bg-red-950 border-red-500/50";
  if (resolved === 'success') bgClass = "bg-green-950 border-green-500/50";

  const classes = ["toast", "show", "flex", "items-center", "gap-3", "text-white", "shadow-2xl", "rounded-2xl", "px-6", "py-4", "border", "transition-all", "duration-300"];
  if (variant === "premium") classes.push("toast-premium");
  
  t.className = `${classes.join(' ')} ${bgClass}`;
  const icon = document.createElement("div");
  icon.className = `${iconColor} [&>svg]:w-6 [&>svg]:h-6 shrink-0`;
  icon.innerHTML = TOAST_ICONS[resolved];

  const message = document.createElement("span");
  message.className = "text-base font-medium tracking-tight";
  message.textContent = msg;
  t.append(icon, message);

  document.body.appendChild(t);

  toastTimer = setTimeout(() => {
    if (t.parentNode) {
      t.parentNode.removeChild(t);
    }
  }, 4000);
}

function inferToastType(msg: string): 'default' | 'success' | 'error' | 'warning' | 'info' {
  const m = msg.toLowerCase();
  if (/^error\b|\berror:|failed|could not|unable to|unauthorized|not allowed/.test(m)) {
    return 'error';
  }
  if (/\b(saved|updated|created|deleted|published|restored|merged|copied|sent|approved)\b/.test(m)) {
    return 'success';
  }
  return 'default';
}

const TOAST_ICONS: Record<string, string> = {
  // Each state has a distinct glyph as well as a distinct colour, so the type
  // survives greyscale, colour blindness and printing.
  success: `<svg class="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>`,
  error: `<svg class="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  warning: `<svg class="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info: `<svg class="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  default: `<svg class="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')         // Trim - from start of text
    .replace(/-+$/, '');        // Trim - from end of text
}

export function calculateReadTime(html?: string | null): number {
  if (!html) return 1;
  const text = html.replace(/<[^>]*>?/gm, "").trim();
  if (!text) return 1;
  const words = text.split(/\s+/).length;
  const wpm = 200;
  return Math.max(1, Math.ceil(words / wpm));
}

export function deriveIsFeatured(placement: string | null): boolean {
  return !!placement;
}
