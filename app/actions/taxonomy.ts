"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/capabilities";
import type { Role, Prisma } from "@prisma/client";

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

// ---------------------------------------------------------------------------
// Merge
// ---------------------------------------------------------------------------
// Deletion refuses to run while a term still has articles, which is correct --
// it stops a category silently taking its articles' classification with it.
// But it leaves no way out: the only remedy offered is "reassign them first",
// and there is no bulk reassign. So duplicate terms ("AI", "A.I.",
// "Artificial Intelligence") accumulate permanently, splitting archive pages
// and category feeds between spellings.
//
// Merge is that missing exit. Move every article from the source onto the
// target, then delete the now-empty source, as one transaction.

async function logTaxonomyAudit(
  action: string,
  entityType: string,
  entityId: string,
  // Prisma.InputJsonValue rather than Record<string, unknown>: the column is
  // Json, and Prisma will not accept a type whose values it cannot prove are
  // serialisable -- `unknown` could hold a function or a Date. Using Prisma's
  // own input type keeps the check instead of casting it away with `any`,
  // which is what the other audit helpers in this codebase do.
  details: Prisma.InputJsonValue
) {
  try {
    const user = await getCurrentUser();
    await db.auditLog.create({
      data: { userId: user?.id || null, action, entityType, entityId, details },
    });
  } catch (e) {
    // Never fail the merge because the audit write failed -- the merge is the
    // user's intent, the log is a side effect.
    console.error("Failed to log taxonomy audit event:", e);
  }
}

export async function mergeCategories(sourceId: string, targetId: string) {
  const user = await getCurrentUser();
  // Merge is destructive in a way rename is not: it deletes a term and
  // silently relabels every article under it. The capability map already
  // declares taxonomy.merge separately and grants it to OWNER/ADMIN only --
  // EDITOR holds create and rename but not this. Gated on that, not on
  // taxonomy.create, so an editor cannot collapse the site's taxonomy.
  if (!user || !authorize(user.role as Role, "taxonomy.merge")) {
    return { success: false, error: "Unauthorized" };
  }

  if (sourceId === targetId) {
    return { success: false, error: "Cannot merge a category into itself." };
  }

  try {
    const [source, target] = await Promise.all([
      db.category.findUnique({
        where: { id: sourceId },
        include: { _count: { select: { articles: true } } },
      }),
      db.category.findUnique({ where: { id: targetId } }),
    ]);

    if (!source) return { success: false, error: "Source category not found" };
    if (!target) return { success: false, error: "Target category not found" };

    const moved = source._count.articles;

    // One transaction: a partial merge would leave articles split across a
    // category the editor believes no longer exists.
    await db.$transaction([
      db.article.updateMany({
        where: { categoryId: sourceId },
        data: { categoryId: targetId },
      }),
      db.category.delete({ where: { id: sourceId } }),
    ]);

    await logTaxonomyAudit("taxonomy.category.merge", "Category", targetId, {
      sourceId,
      sourceName: source.name,
      sourceSlug: source.slug,
      targetName: target.name,
      articlesMoved: moved,
    });

    revalidatePath("/admin/taxonomy");
    revalidatePath("/admin/articles");
    // The source slug is now a dead URL and the target's listing has grown.
    revalidatePath(`/category/${source.slug}`);
    revalidatePath(`/category/${target.slug}`);

    return {
      success: true,
      movedCount: moved,
      message: `Merged "${source.name}" into "${target.name}". ${moved} article${
        moved === 1 ? "" : "s"
      } reassigned.`,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to merge categories";
    return { success: false, error: message };
  }
}

export async function mergeTags(sourceId: string, targetId: string) {
  const user = await getCurrentUser();
  if (!user || !authorize(user.role as Role, "taxonomy.merge")) {
    return { success: false, error: "Unauthorized" };
  }

  if (sourceId === targetId) {
    return { success: false, error: "Cannot merge a tag into itself." };
  }

  try {
    const [source, target] = await Promise.all([
      db.tag.findUnique({
        where: { id: sourceId },
        include: { articles: { select: { id: true } } },
      }),
      db.tag.findUnique({
        where: { id: targetId },
        include: { articles: { select: { id: true } } },
      }),
    ]);

    if (!source) return { success: false, error: "Source tag not found" };
    if (!target) return { success: false, error: "Target tag not found" };

    // Tags are many-to-many, so unlike categories this is not a field update.
    // An article can already carry both tags; connecting it again would break
    // the join table's unique constraint, so only connect the difference.
    const alreadyTagged = new Set(target.articles.map((a) => a.id));
    const toConnect = source.articles
      .filter((a) => !alreadyTagged.has(a.id))
      .map((a) => ({ id: a.id }));

    await db.$transaction([
      ...(toConnect.length > 0
        ? [
            db.tag.update({
              where: { id: targetId },
              data: { articles: { connect: toConnect } },
            }),
          ]
        : []),
      // Deleting the tag drops its join rows, which is what detaches the
      // articles that were already on both.
      db.tag.delete({ where: { id: sourceId } }),
    ]);

    await logTaxonomyAudit("taxonomy.tag.merge", "Tag", targetId, {
      sourceId,
      sourceName: source.name,
      sourceSlug: source.slug,
      targetName: target.name,
      articlesMoved: toConnect.length,
      articlesAlreadyTagged: source.articles.length - toConnect.length,
    });

    revalidatePath("/admin/taxonomy");
    revalidatePath("/admin/articles");
    revalidatePath(`/tag/${source.slug}`);
    revalidatePath(`/tag/${target.slug}`);

    return {
      success: true,
      movedCount: toConnect.length,
      message: `Merged "${source.name}" into "${target.name}". ${
        toConnect.length
      } article${toConnect.length === 1 ? "" : "s"} reassigned.`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to merge tags";
    return { success: false, error: message };
  }
}
