"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/capabilities";
import type { Role } from "@prisma/client";

// Derived from the capability map rather than a hardcoded list, so it cannot
// drift from the page guard or the sidebar link that gate the same feature.
function canManageTaxonomy(role?: string) {
  if (!role) return false;
  return authorize(role as Role, "taxonomy.create");
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
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { articles: true },
      },
    },
  });
}

export async function getTags() {
  return db.tag.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { articles: true },
      },
    },
  });
}

export async function createCategory(data: { name: string; description?: string }) {
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
        description: data.description?.trim() || null,
      },
    });
    revalidatePath("/admin/taxonomy");
    return { success: true, category };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create category";
    return { success: false, error: message };
  }
}

export async function updateCategory(id: string, data: { name: string; description?: string }) {
  const user = await getCurrentUser();
  if (!canManageTaxonomy(user?.role)) return { success: false, error: "Unauthorized" };

  if (!data.name || !data.name.trim()) return { success: false, error: "Name is required" };
  const slug = slugify(data.name);

  try {
    const existing = await db.category.findFirst({
      where: { slug, NOT: { id } },
    });
    if (existing) return { success: false, error: "Another category with this slug already exists" };

    const category = await db.category.update({
      where: { id },
      data: {
        name: data.name.trim(),
        slug,
        description: data.description?.trim() || null,
      },
    });
    revalidatePath("/admin/taxonomy");
    return { success: true, category };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update category";
    return { success: false, error: message };
  }
}

export async function deleteCategory(id: string) {
  const user = await getCurrentUser();
  if (!canManageTaxonomy(user?.role)) return { success: false, error: "Unauthorized" };

  try {
    const category = await db.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    if (!category) return { success: false, error: "Category not found" };

    if (category._count.articles > 0) {
      return {
        success: false,
        error: `Cannot delete category "${category.name}" because it is assigned to ${category._count.articles} article(s). Reassign them first.`,
      };
    }

    await db.category.delete({ where: { id } });
    revalidatePath("/admin/taxonomy");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete category";
    return { success: false, error: message };
  }
}

export async function createTag(data: { name: string; description?: string }) {
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
        description: data.description?.trim() || null,
      },
    });
    revalidatePath("/admin/taxonomy");
    return { success: true, tag };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create tag";
    return { success: false, error: message };
  }
}

export async function updateTag(id: string, data: { name: string; description?: string }) {
  const user = await getCurrentUser();
  if (!canManageTaxonomy(user?.role)) return { success: false, error: "Unauthorized" };

  if (!data.name || !data.name.trim()) return { success: false, error: "Name is required" };
  const slug = slugify(data.name);

  try {
    const existing = await db.tag.findFirst({
      where: { slug, NOT: { id } },
    });
    if (existing) return { success: false, error: "Another tag with this slug already exists" };

    const tag = await db.tag.update({
      where: { id },
      data: {
        name: data.name.trim(),
        slug,
        description: data.description?.trim() || null,
      },
    });
    revalidatePath("/admin/taxonomy");
    return { success: true, tag };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update tag";
    return { success: false, error: message };
  }
}

export async function deleteTag(id: string) {
  const user = await getCurrentUser();
  if (!canManageTaxonomy(user?.role)) return { success: false, error: "Unauthorized" };

  try {
    const tag = await db.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    if (!tag) return { success: false, error: "Tag not found" };

    await db.tag.delete({ where: { id } });
    revalidatePath("/admin/taxonomy");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete tag";
    return { success: false, error: message };
  }
}
