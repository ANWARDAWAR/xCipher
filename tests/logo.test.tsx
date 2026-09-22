import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Logo, { LogoIcon } from "@/components/common/Logo";

describe("Logo Component", () => {
  it("renders default brand variant with aligned SVG and text", () => {
    const html = renderToStaticMarkup(<Logo />);
    expect(html).toContain("xsypher-logo");
    expect(html).toContain("xsypher-logo-icon");
    expect(html).toContain('viewBox="0.85 0.85 24.78 24.78"');
    expect(html).toContain("wm-x font-kremlin font-normal tracking-wide");
    expect(html).toContain("Sypher");
  });

  it("renders sans variant with UI typography", () => {
    const html = renderToStaticMarkup(<Logo variant="sans" />);
    expect(html).toContain("xsypher-logo");
    expect(html).toContain("font-[var(--f-ui)]");
    expect(html).toContain('stroke="#f04552"');
    expect(html).toContain("Sypher");
  });

  it("supports hiding text when showText is false", () => {
    const html = renderToStaticMarkup(<Logo showText={false} />);
    expect(html).toContain("xsypher-logo-icon");
    expect(html).not.toContain("Sypher");
  });

  it("renders as Next.js link when href is provided", () => {
    const html = renderToStaticMarkup(
      <Logo href="/" ariaLabel="xSypher — home" className="text-[26px]" />
    );
    expect(html).toContain('href="/"');
    expect(html).toContain('aria-label="xSypher — home"');
    expect(html).toContain("text-[26px]");
  });

  it("accepts custom accentColor and propagates to cross and text", () => {
    const html = renderToStaticMarkup(
      <Logo variant="sans" accentColor="#ff0000" />
    );
    expect(html).toContain('stroke="#ff0000"');
    expect(html).toContain('style="color:#ff0000"');
  });

  it("renders standalone LogoIcon with normalized viewBox", () => {
    const html = renderToStaticMarkup(<LogoIcon className="w-6 h-6" />);
    expect(html).toContain('viewBox="0.85 0.85 24.78 24.78"');
    expect(html).toContain("w-6 h-6");
  });
});
