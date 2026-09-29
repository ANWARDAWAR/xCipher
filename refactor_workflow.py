import re

with open('app/actions/workflow.ts', 'r') as f:
    content = f.read()

# Replace getArticle
content = content.replace(
    'return await db.article.findUnique({',
    'return await db.query.article.findFirst({'
)
content = content.replace(
    'where: { id },',
    'where: eq(article.id, id),'
)
content = content.replace(
    'select: {',
    'columns: {'
)
content = content.replace(
    'category: { select: { slug: true } },',
    'category: { columns: { slug: true } },'
)
content = content.replace(
    'authorModel: { select: { slug: true } },',
    'authorModel: { columns: { slug: true } },'
)

# Replace count
content = content.replace(
    'await db.user.count({',
    'await db.select({ count: sql`count(*)::int` }).from(user).where('
)
content = content.replace(
    'where: { isActive: true, role: { in: REVIEWER_ROLES } }',
    'and(eq(user.isActive, true), inArray(user.role, REVIEWER_ROLES))'
)
content = content.replace(
    '});',
    ');'
)
content = content.replace(
    'const activeReviewersCount = await db.select({ count: sql`count(*)::int` }).from(user).where(',
    'const [activeReviewersRes] = await db.select({ count: sql`count(*)::int` }).from(user).where(and(eq(user.isActive, true), inArray(user.role, REVIEWER_ROLES)));\n    const activeReviewersCount = activeReviewersRes?.count || 0;\n    // '
)


with open('app/actions/workflow.ts', 'w') as f:
    f.write(content)
