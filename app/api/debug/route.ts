import { NextRequest, NextResponse } from "next/server";

export function GET(req: NextRequest) {
  const env = process.env;
  const secureCookies = env.NODE_ENV === "production" &&
    !(env.NEXTAUTH_URL?.includes("localhost") || env.AUTH_URL?.includes("localhost"));

  return NextResponse.json({
    nodeEnv: env.NODE_ENV,
    nextAuthUrl: env.NEXTAUTH_URL,
    authUrl: env.AUTH_URL,
    secureCookies,
    cookies: req.cookies.getAll(),
  });
}
