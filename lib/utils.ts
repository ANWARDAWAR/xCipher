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

export function showToast(msg: string) {
  if (typeof window === "undefined") return;
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.setAttribute("role", "status");
    t.setAttribute("aria-live", "polite");
    document.body.appendChild(t);
  }
  t.innerHTML = `<svg class="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>${msg}`;
  t.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t?.classList.remove("show");
  }, 2600);
}

