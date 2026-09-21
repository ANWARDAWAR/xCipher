import { siteConfig } from "@/lib/seo";

export const revalidate = 86400; // Cache for 24 hours

export async function GET() {
  const expiresDate = new Date();
  expiresDate.setFullYear(expiresDate.getFullYear() + 1);

  const content = `Contact: mailto:editor@xsypher.com
Contact: mailto:privacy@xsypher.com
Expires: ${expiresDate.toISOString()}
Preferred-Languages: en
Canonical: ${siteConfig.url}/.well-known/security.txt
Policy: ${siteConfig.url}/page/privacy-policy`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "s-maxage=86400, stale-while-revalidate",
    },
  });
}
