import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("Starting taxonomy migration...");

  const articles = await db.article.findMany({
    select: {
      id: true,
      author: true,
      legacyTags: true,
    }
  });

  console.log(`Found ${articles.length} articles to migrate.`);

  let authorCache: Record<string, string> = {};
  let tagCache: Record<string, string> = {};

  for (const article of articles) {
    let updates: any = {};

    // 1. Author Migration
    if (article.author) {
      const authorName = article.author.trim();
      if (authorName) {
        if (!authorCache[authorName]) {
          const authorSlug = slugify(authorName);
          let dbAuthor = await db.author.findUnique({ where: { slug: authorSlug } });
          if (!dbAuthor) {
            dbAuthor = await db.author.create({
              data: {
                name: authorName,
                slug: authorSlug,
              }
            });
            console.log(`Created new author: ${authorName}`);
          }
          authorCache[authorName] = dbAuthor.id;
        }
        updates.authorId = authorCache[authorName];
      }
    }

    // 2. Tags Migration
    if (article.legacyTags && article.legacyTags.length > 0) {
      let tagIds = [];
      for (const t of article.legacyTags) {
        const tagName = t.trim();
        if (!tagName) continue;
        
        const tagSlug = slugify(tagName);
        if (!tagCache[tagSlug]) {
          let dbTag = await db.tag.findUnique({ where: { slug: tagSlug } });
          if (!dbTag) {
            dbTag = await db.tag.create({
              data: {
                name: tagName,
                slug: tagSlug,
              }
            });
            console.log(`Created new tag: ${tagName}`);
          }
          tagCache[tagSlug] = dbTag.id;
        }
        tagIds.push(tagCache[tagSlug]);
      }
      
      if (tagIds.length > 0) {
        updates.tags = {
          connect: tagIds.map(id => ({ id }))
        };
      }
    }

    if (Object.keys(updates).length > 0) {
      await db.article.update({
        where: { id: article.id },
        data: updates
      });
      console.log(`Migrated article ID: ${article.id}`);
    }
  }

  console.log("Taxonomy migration completed.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
