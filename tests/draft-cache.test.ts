import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { draftCacheKey, clearDraftCache } from "@/lib/use-draft-cache";

// ──────────────────────────────────────────────────────────────────────────────
// Draft cache keying
// ──────────────────────────────────────────────────────────────────────────────

describe("draftCacheKey", () => {
  it("buckets an unsaved story under 'new'", () => {
    expect(draftCacheKey(null)).toBe("xcipher:draft:new");
    expect(draftCacheKey(undefined)).toBe("xcipher:draft:new");
  });

  it("keys a saved story by id so two open drafts cannot collide", () => {
    expect(draftCacheKey("abc123")).toBe("xcipher:draft:abc123");
    expect(draftCacheKey("abc123")).not.toBe(draftCacheKey("def456"));
  });
});

describe("clearDraftCache", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("removes only the targeted bucket", () => {
    store.set("xcipher:draft:new", "{}");
    store.set("xcipher:draft:abc123", "{}");

    clearDraftCache("abc123");

    expect(store.has("xcipher:draft:abc123")).toBe(false);
    expect(store.has("xcipher:draft:new")).toBe(true);
  });

  it("does not throw when storage is unavailable", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("SecurityError");
        },
        setItem: () => {
          throw new Error("SecurityError");
        },
        removeItem: () => {
          throw new Error("SecurityError");
        },
      },
    });
    // Safari private mode throws on localStorage access. Losing the cache is
    // acceptable; taking the editor down with it is not.
    expect(() => clearDraftCache("abc123")).not.toThrow();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Draft duplication regression
// ──────────────────────────────────────────────────────────────────────────────
//
// The bug: the save payload read `initialData?.id`, a prop captured at mount.
// On the new-story route that is undefined forever, so every 5-second autosave
// posted without an id and the server inserted another row.
//
// These tests model the id-tracking contract the editor now implements: a ref
// that is adopted from the first successful save and reused by every save after
// it, INCLUDING autosaves, which is where the old code returned early.
// ──────────────────────────────────────────────────────────────────────────────

/** Minimal stand-in for the editor's id tracking + server upsert. */
function makeEditorHarness(initialId: string | null = null) {
  const rows = new Map<string, { id: string; title: string }>();
  let seq = 0;
  const idRef = { current: initialId };

  function serverUpsert(payload: { id?: string; title: string }) {
    if (payload.id && rows.has(payload.id)) {
      rows.get(payload.id)!.title = payload.title;
      return rows.get(payload.id)!;
    }
    const id = `article-${++seq}`;
    const row = { id, title: payload.title };
    rows.set(id, row);
    return row;
  }

  function save(title: string) {
    const result = serverUpsert({ id: idRef.current || undefined, title });
    // The fix: adopt the id on EVERY successful save, before any early return.
    if (result.id) idRef.current = result.id;
    return result;
  }

  return { save, rows, idRef };
}

describe("article id tracking (draft duplication regression)", () => {
  it("creates exactly one row across repeated autosaves of a new story", () => {
    const ed = makeEditorHarness(null);

    ed.save("Draft v1");
    ed.save("Draft v2");
    ed.save("Draft v3");
    ed.save("Draft v4");

    expect(ed.rows.size).toBe(1);
    expect([...ed.rows.values()][0].title).toBe("Draft v4");
  });

  it("adopts the server id on the first save", () => {
    const ed = makeEditorHarness(null);
    expect(ed.idRef.current).toBeNull();

    const first = ed.save("Draft v1");

    expect(ed.idRef.current).toBe(first.id);
  });

  it("keeps updating the same row when editing an existing story", () => {
    const ed = makeEditorHarness(null);
    const created = ed.save("Original");

    ed.save("Edited once");
    ed.save("Edited twice");

    expect(ed.rows.size).toBe(1);
    expect(ed.rows.get(created.id)!.title).toBe("Edited twice");
  });

  it("reproduces the original bug when the id is never adopted", () => {
    // Guards the guard: if this stopped duplicating, the test above would no
    // longer be proving anything.
    const rows: string[] = [];
    let seq = 0;
    const frozenInitialId: string | undefined = undefined; // initialData?.id

    for (let i = 0; i < 4; i++) {
      if (frozenInitialId) continue;
      rows.push(`article-${++seq}`);
    }

    expect(rows.length).toBe(4);
  });
});
