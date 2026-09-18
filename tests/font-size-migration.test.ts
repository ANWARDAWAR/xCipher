import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ──────────────────────────────────────────────────────────────────────────────
// Reading-size preference across a rebrand
// ──────────────────────────────────────────────────────────────────────────────
//
// The publication has been renamed twice (gridx -> xcipher -> xsypher) and the
// preference lives in localStorage under a brand-prefixed key. A rename the
// reader never asked for should not silently reset the text size they chose,
// so getInitialFs reads the current key first and then each previous one.
//
// The module keeps its selection in a module-level variable, so each case
// re-imports it with a fresh registry to avoid leaking state between tests.
// ──────────────────────────────────────────────────────────────────────────────

const store = new Map<string, string>();

async function loadFresh() {
  vi.resetModules();
  return import("@/lib/fontSize");
}

beforeEach(() => {
  store.clear();
  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("getInitialFs", () => {
  it("prefers the current key", async () => {
    store.set("xsypher-fs", "3");
    const { getInitialFs } = await loadFresh();
    expect(getInitialFs()).toBe(3);
  });

  it("falls back to the xcipher key so a rename does not reset the reader", async () => {
    store.set("xcipher-fs", "2");
    const { getInitialFs } = await loadFresh();
    expect(getInitialFs()).toBe(2);
  });

  it("still honours the oldest gridx key", async () => {
    store.set("gridx-fs", "0");
    const { getInitialFs } = await loadFresh();
    expect(getInitialFs()).toBe(0);
  });

  it("lets the current key win over a stale legacy one", async () => {
    store.set("xsypher-fs", "3");
    store.set("xcipher-fs", "0");
    const { getInitialFs } = await loadFresh();
    expect(getInitialFs()).toBe(3);
  });

  it("defaults when nothing is stored", async () => {
    const { getInitialFs } = await loadFresh();
    expect(getInitialFs()).toBe(1);
  });

  it("ignores an out-of-range value rather than indexing past the scale", async () => {
    store.set("xsypher-fs", "99");
    const { getInitialFs } = await loadFresh();
    expect(getInitialFs()).toBe(1);
  });
});
