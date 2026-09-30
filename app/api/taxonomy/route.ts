import { NextRequest, NextResponse } from "next/server";
import { getSubcategories, createSubcategory } from "@/app/actions/taxonomy";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const action = data.action;

    if (action === "getSubcategories") {
      const result = await getSubcategories(data.parentId);
      return NextResponse.json(result);
    } else if (action === "createSubcategory") {
      const result = await createSubcategory(data.parentId, data.name);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[api/taxonomy] Error:", error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred." }, { status: 500 });
  }
}
