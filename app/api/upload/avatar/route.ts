import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadAvatar } from "@/app/actions/upload-avatar";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Sign in to upload images." }, { status: 401 });
    }

    const formData = await req.formData();
    const result = await uploadAvatar(formData);
    
    return NextResponse.json(result);
  } catch (e) {
    console.error("[api/upload/avatar] Image upload failed:", e);
    return NextResponse.json({ ok: false, error: "The avatar could not be uploaded. Please try again." }, { status: 500 });
  }
}
