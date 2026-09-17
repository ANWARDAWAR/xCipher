"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: any) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      throw new Error("User not found in database.");
    }

    const { name, headline, role, overview, bio, avatar, location, website, email, socialLinks } = data;

    // Generate slug from name
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `user-${user.id.substring(0, 6)}`;
    
    // If user already has an author, keep existing slug to avoid breaking links
    let slug = baseSlug;
    if (dbUser.authorId) {
      const existing = await db.author.findUnique({ where: { id: dbUser.authorId } });
      if (existing) slug = existing.slug;
    }

    const author = await db.author.upsert({
      where: { id: dbUser.authorId || 'non-existent-id' },
      update: { name, headline, role, overview, bio, avatar, location, website, email, socialLinks },
      create: { slug, name, headline, role, overview, bio, avatar, location, website, email, socialLinks },
    });

    if (!dbUser.authorId || dbUser.name !== name) {
      await db.user.update({
        where: { id: user.id },
        data: { authorId: author.id, name },
      });
    }

    revalidatePath('/admin/settings');
    revalidatePath('/admin');
    revalidatePath(`/author/${author.slug}`);

    return { success: true, slug: author.slug };
  } catch (error: any) {
    console.error("updateProfile error:", error);
    return { success: false, error: error.message || "Failed to update profile" };
  }
}
