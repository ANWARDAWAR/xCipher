import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  json,
  unique,
  index,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const roleEnum = pgEnum('Role', ['OWNER', 'ADMIN', 'EDITOR', 'AUTHOR', 'REVIEWER', 'MODERATOR', 'STAFF']);
export const articleStatusEnum = pgEnum('ArticleStatus', ['DRAFT', 'REVIEW', 'PUBLISHED', 'SUBMITTED', 'REVISION_REQUESTED', 'REJECTED', 'APPROVED', 'SCHEDULED', 'ARCHIVED']);
export const subscriberStatusEnum = pgEnum('SubscriberStatus', ['PENDING', 'ACTIVE', 'UNSUBSCRIBED', 'BOUNCED']);
export const commentStatusEnum = pgEnum('CommentStatus', ['PENDING', 'APPROVED', 'REJECTED', 'SPAM']);

export const account = pgTable('Account', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => {
  return {
    providerProviderAccountIdUnique: unique('Account_provider_providerAccountId_key').on(table.provider, table.providerAccountId)
  }
});

export const session = pgTable('Session', {
  id: text('id').primaryKey(),
  sessionToken: text('sessionToken').notNull().unique(),
  userId: text('userId').notNull(),
  expires: timestamp('expires', { mode: 'date', precision: 3 }).notNull(),
});

export const user = pgTable('User', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date', precision: 3 }),
  image: text('image'),
  password: text('password'),
  role: roleEnum('role').default('AUTHOR').notNull(),
  authorId: text('authorId').unique(),
  pgpPublicKey: text('pgpPublicKey'),
  notificationPrefs: json('notificationPrefs'),
  isActive: boolean('isActive').default(true).notNull(),
  sessionVersion: integer('sessionVersion').default(1).notNull(),
});

export const verificationToken = pgTable('VerificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires', { mode: 'date', precision: 3 }).notNull(),
}, (table) => {
  return {
    identifierTokenUnique: unique('VerificationToken_identifier_token_key').on(table.identifier, table.token)
  }
});

export const passwordResetToken = pgTable('PasswordResetToken', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires', { mode: 'date', precision: 3 }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date', precision: 3 }).defaultNow().notNull(),
  userId: text('userId').notNull(),
  used: boolean('used').default(false).notNull(),
});

export const author = pgTable('Author', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  role: text('role'),
  bio: text('bio'),
  avatar: text('avatar'),
  socialLinks: json('socialLinks'),
  joinedAt: timestamp('joinedAt', { mode: 'date', precision: 3 }).defaultNow().notNull(),
  email: text('email'),
  headline: text('headline'),
  location: text('location'),
  website: text('website'),
  overview: text('overview'),
  disclosure: text('disclosure'),
  expertise: text('expertise'),
  previousSlugs: text('previousSlugs').array().default(sql`ARRAY[]::text[]`).notNull(),
  publicContact: boolean('publicContact').default(true).notNull(),
  verifiedTitle: boolean('verifiedTitle').default(false).notNull(),
});

export const category = pgTable('Category', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  fullTitle: text('fullTitle'),
  description: text('description'),
  parentId: text('parentId'),
});

export const tag = pgTable('Tag', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
});

export const article = pgTable('Article', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  deck: text('deck'),
  contentUrl: text('contentUrl'),
  author: text('author'),
  role: text('role'),
  categoryId: text('categoryId'),
  status: articleStatusEnum('status').default('DRAFT').notNull(),
  views: integer('views').default(0).notNull(),
  readingTime: integer('readingTime').default(1).notNull(),
  legacyTags: text('tags').array().default(sql`ARRAY[]::text[]`).notNull(),
  featured: boolean('featured').default(false).notNull(),
  img: text('img'),
  seoTitle: text('seoTitle'),
  seoDesc: text('seoDesc'),
  textContent: text('textContent'),
  createdAt: timestamp('createdAt', { mode: 'date', precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date', precision: 3 }).defaultNow().notNull(),
  authorId: text('authorId'),
  publishedAt: timestamp('publishedAt', { mode: 'date', precision: 3 }),
  scheduledFor: timestamp('scheduledFor', { mode: 'date', precision: 3 }),
  homepagePlacement: text('homepagePlacement'),
  previousSlugs: text('previousSlugs').array().default(sql`ARRAY[]::text[]`).notNull(),
  approvedAt: timestamp('approvedAt', { mode: 'date', precision: 3 }),
  approvedById: text('approvedById'),
  archivedAt: timestamp('archivedAt', { mode: 'date', precision: 3 }),
  reviewedAt: timestamp('reviewedAt', { mode: 'date', precision: 3 }),
  reviewedById: text('reviewedById'),
  submittedAt: timestamp('submittedAt', { mode: 'date', precision: 3 }),
  submittedById: text('submittedById'),
  metaTitle: text('metaTitle'),
  metaDescription: text('metaDescription'),
  ogImage: text('ogImage'),
  focusKeyword: text('focusKeyword'),
  canonicalUrl: text('canonicalUrl'),
  featuredImageAlt: text('featuredImageAlt'),
  featuredImageCaption: text('featuredImageCaption'),
  featuredImageCredit: text('featuredImageCredit'),
}, (table) => {
  return {
    statusUpdatedAtIdx: index('Article_status_updatedAt_idx').on(table.status, table.updatedAt),
    statusSubmittedAtIdx: index('Article_status_submittedAt_idx').on(table.status, table.submittedAt),
    authorIdStatusUpdatedAtIdx: index('Article_authorId_status_updatedAt_idx').on(table.authorId, table.status, table.updatedAt),
    categoryIdStatusPublishedAtIdx: index('Article_categoryId_status_publishedAt_idx').on(table.categoryId, table.status, table.publishedAt),
    publishedAtIdx: index('Article_publishedAt_idx').on(table.publishedAt),
    scheduledForIdx: index('Article_scheduledFor_idx').on(table.scheduledFor),
    searchIdx: index('Article_search_idx').using('gin', sql`to_tsvector('english', coalesce(${table.title}, '') || ' ' || coalesce(${table.deck}, '') || ' ' || coalesce(${table.textContent}, ''))`),
  }
});

export const articleRevision = pgTable('ArticleRevision', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  articleId: text('articleId').notNull().references(() => article.id, { onDelete: 'cascade' }),
  userId: text('userId').notNull(),
  notes: text('notes'),
  statusChange: text('statusChange'),
  createdAt: timestamp('createdAt', { mode: 'date', precision: 3 }).defaultNow().notNull(),
  contentUrl: text('contentUrl'),
  deck: text('deck'),
  title: text('title'),
});

export const articleReview = pgTable('ArticleReview', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  articleId: text('articleId').notNull().references(() => article.id, { onDelete: 'cascade' }),
  reviewerId: text('reviewerId').notNull(),
  decision: text('decision').notNull(),
  reason: text('reason'),
  reasonCode: text('reasonCode'),
  fromStatus: text('fromStatus').notNull(),
  toStatus: text('toStatus').notNull(),
  passNumber: integer('passNumber').default(1).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date', precision: 3 }).defaultNow().notNull(),
}, (table) => {
  return {
    articleIdCreatedAtIdx: index('ArticleReview_articleId_createdAt_idx').on(table.articleId, table.createdAt)
  }
});

export const auditLog = pgTable('AuditLog', {
  id: text('id').primaryKey(),
  userId: text('userId'),
  action: text('action').notNull(),
  entityType: text('entityType').notNull(),
  entityId: text('entityId'),
  details: json('details'),
  createdAt: timestamp('createdAt', { mode: 'date', precision: 3 }).defaultNow().notNull(),
});

export const notification = pgTable('Notification', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  message: text('message').notNull(),
  link: text('link'),
  type: text('type').default('SYSTEM').notNull(),
  isRead: boolean('isRead').default(false).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date', precision: 3 }).defaultNow().notNull(),
});

export const invitation = pgTable('Invitation', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  role: roleEnum('role').default('AUTHOR').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires', { mode: 'date', precision: 3 }).notNull(),
  status: text('status').default('PENDING').notNull(),
  invitedBy: text('invitedBy'),
  createdAt: timestamp('createdAt', { mode: 'date', precision: 3 }).defaultNow().notNull(),
});

export const subscriber = pgTable('Subscriber', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  status: subscriberStatusEnum('status').default('ACTIVE').notNull(),
  source: text('source').default('HOMEPAGE').notNull(),
  consentAt: timestamp('consentAt', { mode: 'date', precision: 3 }).defaultNow().notNull(),
  unsubscribeToken: text('unsubscribeToken').notNull().unique(),
  createdAt: timestamp('createdAt', { mode: 'date', precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date', precision: 3 }).notNull(),
});

export const comment = pgTable('Comment', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  articleId: text('articleId').notNull().references(() => article.id, { onDelete: 'cascade' }),
  articleSlug: text('articleSlug').notNull(),
  displayName: text('displayName').notNull(),
  emailHash: text('emailHash').notNull(),
  body: text('body').notNull(),
  status: commentStatusEnum('status').default('PENDING').notNull(),
  ipHash: text('ipHash'),
  userAgent: text('userAgent'),
  moderatorId: text('moderatorId'),
  moderatorNote: text('moderatorNote'),
  createdAt: timestamp('createdAt', { mode: 'date', precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date', precision: 3 }).defaultNow().notNull(),
});

export const publicationSettings = pgTable('PublicationSettings', {
  id: text('id').primaryKey().default('singleton'),
  siteName: text('siteName'),
  tagline: text('tagline'),
  description: text('description'),
  logoUrl: text('logoUrl'),
  faviconUrl: text('faviconUrl'),
  twitterHandle: text('twitterHandle'),
  publisherName: text('publisherName'),
  defaultOgImage: text('defaultOgImage'),
  footerText: text('footerText'),
  updatedAt: timestamp('updatedAt', { mode: 'date', precision: 3 }).notNull(),
  updatedById: text('updatedById'),
});

export const rateLimit = pgTable('RateLimit', {
  id: text('id').primaryKey(),
  actionKey: text('actionKey').notNull().unique(),
  count: integer('count').notNull(),
  resetAt: timestamp('resetAt', { mode: 'date', precision: 3 }).notNull(),
});

export const benchmarkLeaderboard = pgTable('BenchmarkLeaderboard', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: text('category').notNull(),
  subCategory: text('subCategory').notNull(),
  metric: text('metric').notNull(),
  topScore: integer('topScore').notNull(),
  deviceName: text('deviceName').notNull(),
  articleId: text('articleId').references(() => article.id, { onDelete: 'cascade' }),
  updatedAt: timestamp('updatedAt', { mode: 'date', precision: 3 }).defaultNow().notNull(),
}, (table) => {
  return {
    compoundKey: unique('BenchmarkLeaderboard_unique').on(table.category, table.subCategory, table.metric)
  };
});

export const _articleToTag = pgTable('_ArticleToTag', {
  A: text('A').notNull().references(() => article.id, { onDelete: 'cascade' }),
  B: text('B').notNull().references(() => tag.id, { onDelete: 'cascade' }),
}, (table) => {
  return {
    compoundKey: unique('_ArticleToTag_AB_unique').on(table.A, table.B),
    bIndex: index('_ArticleToTag_B_index').on(table.B)
  }
});

// Relations
export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ many, one }) => ({
  accounts: many(account),
  sessions: many(session),
  claimedArticles: many(article, { relationName: 'ArticleReviewer' }),
  articleReviews: many(articleReview),
  revisions: many(articleRevision),
  auditLogs: many(auditLog),
  moderatedComments: many(comment),
  notifications: many(notification),
  authorProfile: one(author, {
    fields: [user.authorId],
    references: [author.id],
  }),
}));

export const authorRelations = relations(author, ({ many, one }) => ({
  articles: many(article),
  user: one(user, {
    fields: [author.id],
    references: [user.authorId],
  }),
}));

export const categoryRelations = relations(category, ({ one, many }) => ({
  parent: one(category, {
    fields: [category.parentId],
    references: [category.id],
    relationName: 'CategoryHierarchy',
  }),
  children: many(category, { relationName: 'CategoryHierarchy' }),
  articles: many(article),
}));

export const tagRelations = relations(tag, ({ many }) => ({
  articles: many(_articleToTag), // many-to-many join
}));

export const articleRelations = relations(article, ({ one, many }) => ({
  authorModel: one(author, {
    fields: [article.authorId],
    references: [author.id],
  }),
  category: one(category, {
    fields: [article.categoryId],
    references: [category.id],
  }),
  reviewer: one(user, {
    fields: [article.reviewedById],
    references: [user.id],
    relationName: 'ArticleReviewer',
  }),
  reviews: many(articleReview),
  revisions: many(articleRevision),
  comments: many(comment),
  tags: many(_articleToTag), // many-to-many join
}));

export const articleRevisionRelations = relations(articleRevision, ({ one }) => ({
  article: one(article, {
    fields: [articleRevision.articleId],
    references: [article.id],
  }),
  user: one(user, {
    fields: [articleRevision.userId],
    references: [user.id],
  }),
}));

export const articleReviewRelations = relations(articleReview, ({ one }) => ({
  article: one(article, {
    fields: [articleReview.articleId],
    references: [article.id],
  }),
  reviewer: one(user, {
    fields: [articleReview.reviewerId],
    references: [user.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(user, {
    fields: [auditLog.userId],
    references: [user.id],
  }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
}));

export const commentRelations = relations(comment, ({ one }) => ({
  article: one(article, {
    fields: [comment.articleId],
    references: [article.id],
  }),
  moderator: one(user, {
    fields: [comment.moderatorId],
    references: [user.id],
  }),
}));

export const _articleToTagRelations = relations(_articleToTag, ({ one }) => ({
  article: one(article, {
    fields: [_articleToTag.A],
    references: [article.id],
  }),
  tag: one(tag, {
    fields: [_articleToTag.B],
    references: [tag.id],
  }),
}));
