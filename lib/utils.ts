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

export function showToast(msg: string, type?: 'default' | 'success' | 'error' | 'warning' | 'info') {
  if (typeof window === "undefined") return;

  // Audit finding: showToast has always accepted a `type`, and not one of the
  // 91 call sites passed it. So 32 messages that begin "Error:" were rendering
  // with a green success tick -- the icon actively contradicted the words.
  //
  // Rather than edit 91 call sites (and rely on nobody forgetting the argument
  // again), the type is inferred from the message when it is not given. An
  // explicit argument still wins.
  const resolved = type ?? inferToastType(msg);

  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);
  }

  // Errors are announced assertively so a screen reader interrupts rather than
  // waiting for a pause; everything else stays polite. role must match, or the
  // announcement is inconsistent between browsers.
  const assertive = resolved === 'error';
  t.setAttribute("role", assertive ? "alert" : "status");
  t.setAttribute("aria-live", assertive ? "assertive" : "polite");

  t.className = resolved !== 'default' ? resolved : '';
  t.innerHTML = `${TOAST_ICONS[resolved]}<span></span>`;

  // textContent, not innerHTML: messages interpolate article titles, which are
  // author-supplied. A headline containing markup would otherwise be injected
  // into the page.
  const span = t.querySelector("span");
  if (span) span.textContent = msg;

  void t.offsetWidth;

  t.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  // Errors linger: they usually carry a reason worth reading, and a failure
  // that vanishes in four seconds is a failure the user never understood.
  toastTimer = setTimeout(() => {
    t?.classList.remove("show");
  }, assertive ? 7000 : 4000);
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


