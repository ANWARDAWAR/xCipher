// @vitest-environment jsdom
import React, { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdUnit, { AdSenseScript } from "@/components/common/AdUnit";

vi.mock("next/script", () => ({
  default: ({ src }: { src: string }) => React.createElement("span", { "data-script": src }),
}));

let container: HTMLDivElement;
let root: Root;
let onResize: () => void;
let width = 728;
const push = vi.fn();

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT_ID", "ca-pub-test");
  vi.stubEnv("NEXT_PUBLIC_ADSENSE_SLOT_ID", "1234567890");
  localStorage.clear();
  push.mockReset();
  window.adsbygoogle = { push };
  width = 728;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({ width }) as DOMRect);
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: () => void) { onResize = callback; }
    observe() {}
    disconnect() {}
  });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  localStorage.clear();
  delete window.adsbygoogle;
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("AdSense placements", () => {
  it("waits for cookie acceptance before loading the script and requesting an ad", async () => {
    await act(async () => root.render(<><AdSenseScript /><AdUnit location="top" /></>));
    expect(container.querySelector("ins")).toBeNull();
    expect(container.querySelector("[data-script]")).toBeNull();
    expect(push).not.toHaveBeenCalled();
    await act(async () => {
      localStorage.setItem("xsypher-cookie-consent", "accepted");
      window.dispatchEvent(new Event("xsypher-cookie-consent-change"));
    });
    expect(container.querySelector("[data-script]")?.getAttribute("data-script")).toContain("client=ca-pub-test");
    expect(container.querySelector("ins")?.getAttribute("data-ad-slot")).toBe("1234567890");
    expect(push).toHaveBeenCalledOnce();
  });

  it("keeps declined, disabled, and unconfigured placements inactive", async () => {
    localStorage.setItem("xsypher-cookie-consent", "declined");
    await act(async () => root.render(<><AdSenseScript /><AdUnit location="top" /></>));
    expect(container.textContent).toBe("");
    localStorage.setItem("xsypher-cookie-consent", "accepted");
    await act(async () => root.render(<AdUnit location="top" isActive={false} />));
    expect(container.querySelector("ins")).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_SLOT_ID", "");
    await act(async () => root.render(<AdUnit location="top" />));
    expect(container.querySelector("ins")).toBeNull();
    expect(push).not.toHaveBeenCalled();
  });

  it("initializes once in Strict Mode and gives changed slot IDs a fresh element", async () => {
    localStorage.setItem("xsypher-cookie-consent", "accepted");
    await act(async () => root.render(<StrictMode><AdUnit location="top" slotId="111" /></StrictMode>));
    const original = container.querySelector("ins");
    expect(push).toHaveBeenCalledOnce();
    await act(async () => { onResize(); });
    expect(push).toHaveBeenCalledOnce();
    await act(async () => root.render(<StrictMode><AdUnit location="top" slotId="222" /></StrictMode>));
    expect(container.querySelector("ins")).not.toBe(original);
    expect(container.querySelector("ins")?.getAttribute("data-ad-slot")).toBe("222");
    expect(push).toHaveBeenCalledTimes(2);
  });

  it("defers zero-width ads and tolerates an unavailable ad service", async () => {
    localStorage.setItem("xsypher-cookie-consent", "accepted");
    width = 0;
    await act(async () => root.render(<AdUnit location="sidebar" />));
    expect(push).not.toHaveBeenCalled();
    width = 300;
    push.mockImplementationOnce(() => { throw new Error("Blocked"); });
    await act(async () => { onResize(); });
    expect(container.querySelector("ins")).not.toBeNull();
    await act(async () => { onResize(); });
    expect(push).toHaveBeenCalledTimes(2);
  });
});
