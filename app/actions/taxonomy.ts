"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

function canManageTaxonomy(role?: string) {
  return ["OWNER", "ADMIN", "EDITOR"].includes(role || "");
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getCategories() {
  return db.category.findMany({
    orderBy: { name: "asc" }
  });
}

export async function getTags() {
  return db.tag.findMany({
    orderBy: { name: "asc" }
  });
}

export async function createCategory(data: { name: string, description?: string }) {
  const user = await getCurrentUser();
  if (!canManageTaxonomy(user?.role)) return { success: false, error: "Unauthorized" };
  
  if (!data.name || !data.name.trim()) return { success: false, error: "Name is required" };
  const slug = slugify(data.name);

  try {
    const existing = await db.category.findUnique({ where: { slug } });
    if (existing) return { success: false, error: "Category already exists" };

    const category = await db.category.create({
      data: {
        name: data.name.trim(),
        slug,
        description: data.description || null,
      }
    });
    revalidatePath("/admin/taxonomy");
    return { success: true, category };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createTag(data: { name: string, description?: string }) {
  const user = await getCurrentUser();
  if (!canManageTaxonomy(user?.role)) return { success: false, error: "Unauthorized" };
  
  if (!data.name || !data.name.trim()) return { success: false, error: "Name is required" };
  const slug = slugify(data.name);

  try {
    const existing = await db.tag.findUnique({ where: { slug } });
    if (existing) return { success: false, error: "Tag already exists" };

    const tag = await db.tag.create({
      data: {
        name: data.name.trim(),
        slug,
        description: data.description || null,
      }
    });
    revalidatePath("/admin/taxonomy");
    return { success: true, tag };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
