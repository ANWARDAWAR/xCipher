import { describe, it, expect, vi } from "vitest";

// ──────────────────────────────────────────────────────────────────────────────
// Autosave overlap guard
// ──────────────────────────────────────────────────────────────────────────────
//
// On a slow connection a save can still be in flight when the next debounce
// fires. Two concurrent upserts for the same article race, and the loser's text
// is silently lost. The editor guards this with an in-flight flag plus a single
// queued "resave" -- the form is always written whole, so one trailing save
// carries everything the skipped attempts would have.
//
// This models that control flow exactly as implemented in runAutosave().
// ──────────────────────────────────────────────────────────────────────────────

function makeAutosaveEngine(save: () => Promise<void>) {
  const inFlight = { current: false };
  const queued = { current: false };

  async function runAutosave(): Promise<void> {
    if (inFlight.current) {
      queued.current = true;
      return;
    }

    inFlight.current = true;
    try {
      await save();
    } finally {
      inFlight.current = false;
    }

    if (queued.current) {
      queued.current = false;
      await runAutosave();
    }
  }

  return { runAutosave, inFlight, queued };
}

/** A deferred promise, so a "request" can be held open mid-test. */
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

describe("autosave overlap guard", () => {
  it("never runs two saves concurrently", async () => {
    let concurrent = 0;
    let maxConcurrent = 0;
    const gate = deferred();

    const engine = makeAutosaveEngine(async () => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await gate.promise;
      concurrent--;
    });

    const first = engine.runAutosave();
    // Three more debounces fire while the first request is still open.
    void engine.runAutosave();
    void engine.runAutosave();
    void engine.runAutosave();

    gate.resolve();
    await first;

    expect(maxConcurrent).toBe(1);
  });

  it("collapses many skipped attempts into exactly one trailing save", async () => {
    const calls: number[] = [];
    let n = 0;
    const gate = deferred();

    const engine = makeAutosaveEngine(async () => {
      calls.push(++n);
      if (calls.length === 1) await gate.promise;
    });

    const first = engine.runAutosave();
    void engine.runAutosave();
    void engine.runAutosave();
    void engine.runAutosave();

    gate.resolve();
    await first;

    // One in-flight save + one trailing save, not four.
    expect(calls.length).toBe(2);
  });

  it("clears the in-flight flag when a save throws", async () => {
    const engine = makeAutosaveEngine(async () => {
      throw new Error("network down");
    });

    await expect(engine.runAutosave()).rejects.toThrow("network down");

    // A transport failure must not wedge the editor into a state where no
    // further autosave can ever start.
    expect(engine.inFlight.current).toBe(false);
  });

  it("runs a fresh save after a previous one settles", async () => {
    let n = 0;
    const engine = makeAutosaveEngine(async () => void n++);

    await engine.runAutosave();
    await engine.runAutosave();

    expect(n).toBe(2);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Sync status labelling
// ──────────────────────────────────────────────────────────────────────────────

type Status = "idle" | "edited" | "saving" | "saved" | "error" | "offline" | "conflict";

function syncStatus(autosaveStatus: Status, lastSaved: Date | null) {
  return autosaveStatus === "saving"
    ? { label: "Saving\u2026", tone: "saving" }
    : autosaveStatus === "saved"
      ? { label: "Saved to cloud", tone: "saved" }
      : autosaveStatus === "offline"
        ? { label: "Offline \u2014 saved locally", tone: "offline" }
        : autosaveStatus === "edited"
          ? { label: "Edited", tone: "edited" }
          : autosaveStatus === "error"
            ? { label: "Not saved", tone: "offline" }
            : lastSaved
              ? { label: "Saved to cloud", tone: "saved" }
              : { label: "", tone: "idle" };
}

describe("sync status indicator", () => {
  it("reports the four required states", () => {
    expect(syncStatus("edited", null).label).toBe("Edited");
    expect(syncStatus("saving", null).label).toBe("Saving\u2026");
    expect(syncStatus("saved", null).label).toBe("Saved to cloud");
    expect(syncStatus("offline", null).label).toBe("Offline \u2014 saved locally");
  });

  it("never tells the writer their work is lost when it is cached", () => {
    // The offline copy is safe in localStorage; the wording must not imply
    // otherwise, and the tone must not read as a hard failure.
    const s = syncStatus("offline", null);
    expect(s.label).toMatch(/saved locally/i);
    expect(s.label).not.toMatch(/error|failed|lost/i);
  });

  it("shows a saved story as saved once idle", () => {
    expect(syncStatus("idle", new Date()).label).toBe("Saved to cloud");
  });

  it("shows nothing for an untouched new story", () => {
    expect(syncStatus("idle", null).label).toBe("");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Unload guard
// ──────────────────────────────────────────────────────────────────────────────

function isUnsynced(opts: {
  pendingDebounce: boolean;
  inFlight: boolean;
  queued: boolean;
  status: Status;
}) {
  return (
    opts.pendingDebounce ||
    opts.inFlight ||
    opts.queued ||
    opts.status === "error" ||
    opts.status === "offline" ||
    opts.status === "edited"
  );
}

describe("beforeunload guard", () => {
  const base = { pendingDebounce: false, inFlight: false, queued: false, status: "saved" as Status };

  it("does not warn when everything is synced", () => {
    expect(isUnsynced(base)).toBe(false);
  });

  it("warns while a save is still on the wire", () => {
    expect(isUnsynced({ ...base, inFlight: true })).toBe(true);
  });

  it("warns when offline, since the server never received the text", () => {
    expect(isUnsynced({ ...base, status: "offline" })).toBe(true);
  });

  it("warns while a debounce is pending", () => {
    expect(isUnsynced({ ...base, pendingDebounce: true })).toBe(true);
  });
});
