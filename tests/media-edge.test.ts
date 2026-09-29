import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { build } from "esbuild";
import { runInNewContext } from "node:vm";

type Media = typeof import("@/lib/storage") & typeof import("@/lib/cloudinary") &
  typeof import("@/lib/sanitize");

let bundle: string;

beforeAll(async () => {
  // Resolve browser exports and run without Node's Buffer, fs, path or streams.
  // This catches dependency/import failures that Node-only unit tests miss.
  const result = await build({
    stdin: {
      contents: `export * from "./lib/storage";
        export * from "./lib/cloudinary";
        export * from "./lib/sanitize";`,
      resolveDir: process.cwd(),
    },
    bundle: true, write: false, platform: "browser", format: "iife", globalName: "media",
    define: { "process.env.NEXT_PUBLIC_R2_PUBLIC_BASE": '"https://build-time.example.test"' },
  });
  bundle = result.outputFiles[0].text;
});

afterEach(() => vi.restoreAllMocks());

function loadMedia() {
  const env: Record<string, string> = {};
  const httpFetch = vi.fn<typeof fetch>();
  const media = runInNewContext(`${bundle}\nmedia`, {
    process: { env }, console, URL, URLSearchParams, TextEncoder, TextDecoder,
    crypto, Blob, File, FormData, Request, Response, Headers, fetch: httpFetch,
    Uint8Array, ArrayBuffer, setTimeout, clearTimeout,
  }) as Media;
  return { media, env, httpFetch };
}

function bindR2(env: Record<string, string>) {
  Object.assign(env, {
    R2_ACCOUNT_ID: "test-account", R2_ACCESS_KEY_ID: "test-access-key",
    R2_SECRET_ACCESS_KEY: "test-secret", R2_BUCKET: "test-media",
    NEXT_PUBLIC_R2_PUBLIC_BASE: "https://runtime.example.test///",
  });
}

describe("media utilities in a Web API sandbox", () => {
  it("imports without credentials and reads late R2 bindings instead of build-time values", () => {
    const { media, env } = loadMedia();
    expect(media.getR2Config()).toHaveProperty("error");
    expect(() => media.checkCloudinaryEnv()).toThrow("Cloudinary is not configured");
    bindR2(env);
    expect(media.getR2Config()).toMatchObject({ publicBase: "https://runtime.example.test" });
    expect(media.getAllowedMediaDomains()).toContain("runtime.example.test");
    expect(media.getAllowedMediaDomains()).not.toContain("build-time.example.test");
    env.NEXT_PUBLIC_R2_PUBLIC_BASE = "https://new-runtime.example.test";
    expect(media.getR2Config()).toMatchObject({ publicBase: "https://new-runtime.example.test" });
  });

  it("signs and uploads R2 image bytes using Web APIs", async () => {
    const { media, env, httpFetch } = loadMedia();
    bindR2(env);
    httpFetch.mockResolvedValue(new Response(null, { status: 200 }));
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const url = await media.uploadFileToR2(new Blob([bytes], { type: "image/png" }), "test-media", "images/test.png");
    expect(url).toBe("https://runtime.example.test/images/test.png");
    const request = httpFetch.mock.calls[0][0] as Request;
    expect(request.method).toBe("PUT");
    expect(request.headers.get("authorization")).toMatch(/^AWS4-HMAC-SHA256 /);
    expect(request.headers.get("content-type")).toBe("image/png");
    expect(new Uint8Array(await request.arrayBuffer())).toEqual(bytes);
  });

  it("uploads Cloudinary multipart data without its Node SDK", async () => {
    const { media, env, httpFetch } = loadMedia();
    Object.assign(env, {
      CLOUDINARY_CLOUD_NAME: "test-cloud", CLOUDINARY_API_KEY: "test-key",
      CLOUDINARY_API_SECRET: "test-secret",
    });
    httpFetch.mockResolvedValue(Response.json({ secure_url: "https://res.cloudinary.com/test-cloud/image/upload/test.png" }));
    const url = await media.uploadImageToCloudinary(new Blob(["image"], { type: "image/png" }), "xsypher/avatars");
    expect(url).toContain("res.cloudinary.com/test-cloud/");
    const [endpoint, options] = httpFetch.mock.calls[0];
    expect(endpoint).toBe("https://api.cloudinary.com/v1_1/test-cloud/image/upload");
    const form = options?.body as FormData;
    expect(form.get("file")).toBeInstanceOf(Blob);
    expect(form.get("signature")).toMatch(/^[0-9a-f]{40}$/);
    expect(form.get("folder")).toBe("xsypher/avatars");
  });

  it("sanitizes article content and preserves allowed alignment on Edge", () => {
    const { media } = loadMedia();
    const clean = media.sanitizeArticleHtml('<p onclick="bad()" style="text-align:center">Story</p><script>bad()</script>');
    expect(clean).toBe('<p style="text-align:center">Story</p>');
  });
});
