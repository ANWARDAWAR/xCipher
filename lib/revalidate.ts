import { revalidatePath as nextRevalidatePath, revalidateTag as nextRevalidateTag } from "next/cache";

export async function revalidatePath(path: string, type?: "layout" | "page") {
  try {
    if (type) {
      await nextRevalidatePath(path, type);
    } else {
      await nextRevalidatePath(path);
    }
  } catch (e) {
    console.warn(`[revalidate] Ignored error revalidating path ${path}:`, e);
  }
}

export async function revalidateTag(tag: string, profile: "max" | { expire: number } = "max") {
  try {
    await nextRevalidateTag(tag, profile);
  } catch (e) {
    console.warn(`[revalidate] Ignored error revalidating tag ${tag}:`, e);
  }
}
