import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

// ─────────────────────────────────────────────────────────────────────────────
// Dev-only: allow this machine's LAN addresses to load /_next/* resources.
//
// Next.js 16 blocks cross-origin requests to dev resources by default. Opening
// the dev server from a phone on the same Wi-Fi (http://192.168.x.x:3000) counts
// as a different origin than localhost, so the HTML renders but every
// /_next/static/chunks/* request comes back 403. The result is a page that looks
// almost right and is quietly broken: React never hydrates, so anything driven
// by client state does nothing -- the date in the utility bar stays empty, the
// theme toggle and hamburger menu do not respond, and syntax highlighting never
// runs. Nothing logs in the page itself; the refusal is only visible in the dev
// server output and the device's network tab.
//
// Addresses are read from the machine's own interfaces rather than hardcoded,
// because a LAN IP is handed out by DHCP and a pinned value goes stale. Both the
// bare hostname and a wildcard for the /24 are included: the wildcard keeps the
// allowlist valid when the router reassigns a nearby address in the same subnet.
//
// This is ignored in production builds -- `next build` never reads it -- so it
// widens nothing in a deployed environment.
// ─────────────────────────────────────────────────────────────────────────────
function localNetworkOrigins(): string[] {
  const origins = new Set<string>();

  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      // `family` is "IPv4" on Node 18+ but was 4 on older majors; accept both
      // so this does not silently return nothing on a different runtime.
      const isIPv4 = address.family === "IPv4" || (address.family as unknown as number) === 4;
      if (!isIPv4 || address.internal) continue;

      origins.add(address.address);

      // Cover the rest of the subnet so a DHCP reassignment does not require
      // editing this file and restarting.
      const octets = address.address.split(".");
      if (octets.length === 4) origins.add(`${octets[0]}.${octets[1]}.${octets[2]}.*`);
    }
  }

  return [...origins];
}


/**
 * The R2 public host as a remotePatterns entry, or nothing when unconfigured.
 *
 * Derived from NEXT_PUBLIC_R2_PUBLIC_BASE so a deployment pointing at a custom
 * domain, an r2.dev subdomain or a staging bucket all work without editing this
 * file. Returning an empty array when unset keeps the config valid on an
 * install that has not enabled uploads yet.
 */
function r2RemotePattern(): NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE;
  if (!base) return [];
  try {
    const url = new URL(base);
    return [{ protocol: url.protocol.replace(":", "") as "http" | "https", hostname: url.hostname }];
  } catch {
    // Malformed value: skip it rather than failing the build with a stack trace
    // that does not mention the variable.
    return [];
  }
}

const nextConfig: NextConfig = {
  allowedDevOrigins: localNetworkOrigins(),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' data:; frame-src 'self' https://www.youtube-nocookie.com; frame-ancestors 'none'; connect-src 'self' https:;",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      // Cloudinary, for avatars. One host for every account.
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Cloudflare R2, for article images. The public base is per-deployment,
      // so the host is read from the environment rather than hardcoded. Without
      // an entry here next/image refuses the URL with "hostname is not
      // configured" -- an upload that succeeded and then will not render.
      { protocol: "https", hostname: "*.r2.dev" },
      ...r2RemotePattern(),
    ],
  },
};

export default nextConfig;
