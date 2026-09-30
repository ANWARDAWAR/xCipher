import { NextRequest, NextResponse } from "next/server";
import { subscribeNewsletter } from "@/app/actions/newsletter";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let email = "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      email = body.email;
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      email = formData.get("email") as string;
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (req.headers.get("accept")?.includes("application/json")) {
        return NextResponse.json({ success: false, message: "Valid email is required" }, { status: 400 });
      }
      return NextResponse.redirect(new URL("/page/newsletters?error=invalid_email", req.url), 303);
    }

    const result = await subscribeNewsletter(email, "NEWSLETTER_PAGE");

    if (req.headers.get("accept")?.includes("application/json")) {
      return NextResponse.json(result);
    }

    // Standard form submission fallback
    if (result.success || (result as any).code === "ALREADY_SUBSCRIBED") {
      return NextResponse.redirect(new URL("/page/newsletters?subscribed=true", req.url), 303);
    } else {
      return NextResponse.redirect(new URL(`/page/newsletters?error=${encodeURIComponent(result.error || "failed")}`, req.url), 303);
    }
  } catch (error) {
    console.error("[api/subscribe] Error:", error);
    if (req.headers.get("accept")?.includes("application/json")) {
      return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
    return NextResponse.redirect(new URL("/page/newsletters?error=internal_error", req.url), 303);
  }
}
