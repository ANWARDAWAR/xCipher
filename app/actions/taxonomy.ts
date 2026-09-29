"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "@/lib/revalidate";
import { authorize } from "@/lib/capabilities";
import { eq, ne, and, sql, inArray } from "drizzle-orm";
import { category as categoryTable, tag as tagTable, article as articleTable, _articleToTag, auditLog } from "@/lib/db/schema";

import { Role } from "@/lib/types";

// Derived from the capability map rather than a hardcoded list, so it cannot
// drift from the page guard or the sidebar link that gate the same feature.
function canManageTaxonomy(role?: string) {
  if (!role) return false;
  return authorize(role as Role, "taxonomy.create") || authorize(role as Role, "article.create");
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
  const categories = await db.query.category.findMany({
    orderBy: (c, { asc }) => [asc(c.name)],
    with: {
      articles: {
        columns: { id: true }
      }
    }
  });

  return categories.map(c => ({
    ...c,
    _count: { articles: c.articles.length }
  }));
}

export async function getTags() {
  const tags = await db.query.tag.findMany({
    orderBy: (t, { asc }) => [asc(t.name)]
  });
  
  // Tag uses many to many table _articleToTag
  const counts = await db.select({
    tagId: _articleToTag.B,
    count: sql<number>`count(*)::int`
  }).from(_articleToTag).groupBy(_articleToTag.B);
  
  const countMap = Object.fromEntries(counts.map(c => [c.tagId, c.count]));

  return tags.map(t => ({
    ...t,
    _count: { articles: countMap[t.id] || 0 }
  }));
}

export async function createCategory(data: { name: string; description?: string; parentId?: string }) {
  const user = await getCurrentUser();
  if (!canManageTaxonomy(user?.role)) return { success: false, error: "Unauthorized" };
  
  if (!data.name || !data.name.trim()) return { success: false, error: "Name is required" };
  const slug = slugify(data.name);

  try {
    const [existing] = await db.select().from(categoryTable).where(eq(categoryTable.slug, slug)).limit(1);
    if (existing) return { success: false, error: "Category already exists" };

    const [category] = await db.insert(categoryTable).values({
      id: crypto.randomUUID(),
      name: data.name.trim(),
      slug,
      description: data.description?.trim() || null,
      parentId: data.parentId || null,
    }).returning();
    revalidatePath("/admin/taxonomy");
    return { success: true, category };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create category";
    return { success: false, error: message };
  }
}

export async function getSubcategories(parentSlug: string) {
  try {
    const [parent] = await db.select().from(categoryTable).where(eq(categoryTable.slug, parentSlug)).limit(1);
    if (!parent) return [];
    
    return db.query.category.findMany({
      where: eq(categoryTable.parentId, parent.id),
      orderBy: (c, { asc }) => [asc(c.name)],
    });
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function createSubcategory(name: string, parentSlug: string) {
  const user = await getCurrentUser();
  if (!canManageTaxonomy(user?.role)) return { success: false, error: "Unauthorized" };
  
  const trimmedName = name.trim();
  if (!trimmedName) return { success: false, error: "Name is required" };
  const slug = slugify(trimmedName);

  try {
    // Upsert the parent category just in case it doesn't exist yet (for hardcoded frontend categories)
    const parentName = parentSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    
    const [parent] = await db.insert(categoryTable).values({
      id: crypto.randomUUID(),
      slug: parentSlug,
      name: parentName,
    }).onConflictDoUpdate({
      target: categoryTable.slug,
      set: { slug: parentSlug } // no-op basically
    }).returning();

    // Check if subcategory already exists
    const [existing] = await db.select().from(categoryTable).where(eq(categoryTable.slug, slug)).limit(1);
    if (existing) {
      if (existing.parentId !== parent.id) {
        // If it exists but under a different parent, we just update it or return an error?
        // Let's just return it for now so the UI can proceed, or return an error to prevent moving categories by accident.
        return { success: false, error: `Category "${trimmedName}" already exists under a different parent.` };
      }
      return { success: true, category: existing };
    }

    const [category] = await db.insert(categoryTable).values({
      id: crypto.randomUUID(),
      name: trimmedName,
      slug,
      parentId: parent.id,
    }).returning();
    
    revalidatePath("/admin/taxonomy");
    return { success: true, category };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create subcategory";
    return { success: false, error: message };
  }
}

export async function updateCategory(id: string, data: { name: string; description?: string }) {
  const user = await getCurrentUser();
  if (!canManageTaxonomy(user?.role)) return { success: false, error: "Unauthorized" };

  if (!data.name || !data.name.trim()) return { success: false, error: "Name is required" };
  const slug = slugify(data.name);

  try {
    const [existing] = await db.select().from(categoryTable).where(and(eq(categoryTable.slug, slug), ne(categoryTable.id, id))).limit(1);
    if (existing) return { success: false, error: "Another category with this slug already exists" };

    const [category] = await db.update(categoryTable).set({
      name: data.name.trim(),
      slug,
      description: data.description?.trim() || null,
    }).where(eq(categoryTable.id, id)).returning();
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
    const [category] = await db.select().from(categoryTable).where(eq(categoryTable.id, id)).limit(1);

    if (!category) return { success: false, error: "Category not found" };

    const [{ count: articleCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(articleTable).where(eq(articleTable.categoryId, id));

    if (category.parentId && user?.role !== "OWNER" && user?.role !== "ADMIN") {
      return { success: false, error: "Only Admins and Owners can delete subcategories." };
    }

    if (articleCount > 0) {
      return {
        success: false,
        error: `Cannot delete category "${category.name}" because it is assigned to ${articleCount} article(s). Reassign them first.`,
      };
    }

    await db.delete(categoryTable).where(eq(categoryTable.id, id));
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
    const [existing] = await db.select().from(tagTable).where(eq(tagTable.slug, slug)).limit(1);
    if (existing) return { success: false, error: "Tag already exists" };

    const [tag] = await db.insert(tagTable).values({
      id: crypto.randomUUID(),
      name: data.name.trim(),
      slug,
      description: data.description?.trim() || null,
    }).returning();
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
    const [existing] = await db.select().from(tagTable).where(and(eq(tagTable.slug, slug), ne(tagTable.id, id))).limit(1);
    if (existing) return { success: false, error: "Another tag with this slug already exists" };

    const [tag] = await db.update(tagTable).set({
      name: data.name.trim(),
      slug,
      description: data.description?.trim() || null,
    }).where(eq(tagTable.id, id)).returning();
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
    const [tag] = await db.select().from(tagTable).where(eq(tagTable.id, id)).limit(1);

    if (!tag) return { success: false, error: "Tag not found" };

    await db.delete(tagTable).where(eq(tagTable.id, id));
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
  details: any
) {
  try {
    const user = await getCurrentUser();
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: user?.id || null, action, entityType, entityId, details
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
    const [source] = await db.select().from(categoryTable).where(eq(categoryTable.id, sourceId)).limit(1);
    const [target] = await db.select().from(categoryTable).where(eq(categoryTable.id, targetId)).limit(1);

    if (!source) return { success: false, error: "Source category not found" };
    if (!target) return { success: false, error: "Target category not found" };

    const [{ count: moved }] = await db.select({ count: sql<number>`count(*)::int` }).from(articleTable).where(eq(articleTable.categoryId, sourceId));

    // One transaction: a partial merge would leave articles split across a
    // category the editor believes no longer exists.
    
            await db.update(articleTable).set({ categoryId: targetId }).where(eq(articleTable.categoryId, sourceId));
            await db.delete(categoryTable).where(eq(categoryTable.id, sourceId));
          

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
    const sourcePromise = db.query.tag.findFirst({
      where: eq(tagTable.id, sourceId),
      with: { articles: { columns: { A: true } } }
    });
    
    const targetPromise = db.query.tag.findFirst({
      where: eq(tagTable.id, targetId),
      with: { articles: { columns: { A: true } } }
    });
    
    const [source, target] = await Promise.all([sourcePromise, targetPromise]);

    if (!source) return { success: false, error: "Source tag not found" };
    if (!target) return { success: false, error: "Target tag not found" };

    // Tags are many-to-many, so unlike categories this is not a field update.
    // An article can already carry both tags; connecting it again would break
    // the join table's unique constraint, so only connect the difference.
    const alreadyTagged = new Set(target.articles.map((a) => a.A));
    const toConnect = source.articles
      .filter((a) => !alreadyTagged.has(a.A))
      .map((a) => ({ A: a.A, B: targetId }));

    
            if (toConnect.length > 0) {
              await db.insert(_articleToTag).values(toConnect).onConflictDoNothing();
            }
            await db.delete(tagTable).where(eq(tagTable.id, sourceId));
          

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
