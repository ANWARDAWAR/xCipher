import { revalidatePath as nextRevalidatePath, revalidateTag as nextRevalidateTag } from "next/cache";

export function revalidatePath(path: string, type?: "layout" | "page") {
  try {
    if (type) {
      nextRevalidatePath(path, type);
    } else {
      nextRevalidatePath(path);
    }
  } catch (e) {
    console.warn(`[revalidate] Ignored error revalidating path ${path}:`, e);
  }
}

export function revalidateTag(tag: string) {
  try {
    // @ts-ignore
    nextRevalidateTag(tag);
  } catch (e) {
    console.warn(`[revalidate] Ignored error revalidating tag ${tag}:`, e);
  }
}
