import { showToast } from "./utils";

export const FS = [1.0625, 1.125, 1.25, 1.375];
const LABELS = ["Small", "Default", "Large", "Extra large"];

let currentFsIdx = 1;
const listeners = new Set<(idx: number) => void>();

export function getInitialFs(): number {
  if (typeof window === "undefined") return 1;
  // Read order is newest brand first, then each previous one. The publication
  // has been renamed twice (gridx -> xcipher -> xsypher) and a reader's chosen
  // reading size should survive a rename they never asked for.
  const saved =
    localStorage.getItem("xsypher-fs") ??
    localStorage.getItem("xcipher-fs") ??
    localStorage.getItem("gridx-fs");
  if (saved !== null) {
    const idx = parseInt(saved, 10);
    if (!isNaN(idx) && idx >= 0 && idx < FS.length) {
      currentFsIdx = idx;
    }
  }
  return currentFsIdx;
}

export function applyFs(idx: number, showFeedback: boolean = true) {
  if (typeof window === "undefined") return;
  currentFsIdx = idx;
  localStorage.setItem("xsypher-fs", String(idx));
  document.documentElement.style.setProperty("--prose-fs", `${FS[idx]}rem`);
  listeners.forEach((fn) => fn(idx));
  if (showFeedback) {
    showToast(`Text size: ${LABELS[idx]}`);
  }
}

export function stepFs(delta: number) {
  const newIdx = Math.min(FS.length - 1, Math.max(0, currentFsIdx + delta));
  applyFs(newIdx, false);
}

export function subscribeFs(fn: (idx: number) => void) {
  listeners.add(fn);
  fn(currentFsIdx);
  return () => {
    listeners.delete(fn);
  };
}
