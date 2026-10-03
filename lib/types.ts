export type Role = "OWNER" | "ADMIN" | "EDITOR" | "REVIEWER" | "AUTHOR" | "MODERATOR" | "STAFF";
export const ROLES: Role[] = ["OWNER", "ADMIN", "EDITOR", "REVIEWER", "AUTHOR", "MODERATOR", "STAFF"];

export type ArticleStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'SUBMITTED' | 'REVISION_REQUESTED' | 'REJECTED' | 'APPROVED' | 'SCHEDULED' | 'ARCHIVED';
export const ARTICLE_STATUSES: ArticleStatus[] = ['DRAFT', 'REVIEW', 'PUBLISHED', 'SUBMITTED', 'REVISION_REQUESTED', 'REJECTED', 'APPROVED', 'SCHEDULED', 'ARCHIVED'];

export type CommentStatus = "PENDING" | "APPROVED" | "REJECTED" | "SPAM";
export const COMMENT_STATUSES: CommentStatus[] = ["PENDING", "APPROVED", "REJECTED", "SPAM"];

// Minimal stubs for Article and Category that components might use from old Prisma types
export interface Article {
  id: string;
  slug: string;
  title: string;
  deck: string | null;
  contentJson: any | null;
  contentHtml: string | null;
  img: string | null;
  authorId: string | null;
  author: string | null;
  isAnonymous: boolean;
  categoryId: string | null;
  status: ArticleStatus;
  featured: boolean;
  views: number;
  readingTime: number | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  scheduledFor: Date | null;
  homepagePlacement: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
