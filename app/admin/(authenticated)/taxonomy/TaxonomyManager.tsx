"use client";

import React, { useState, useMemo } from "react";
import { 
  Folder, 
  Tag as TagIcon, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  FileText, 
  Loader2, 
  X, 
  Hash
} from "lucide-react";
import { 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  createTag, 
  updateTag, 
  deleteTag 
} from "@/app/actions/taxonomy";
import { showToast } from "@/lib/utils";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count?: {
    articles: number;
  };
}

interface TagItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count?: {
    articles: number;
  };
}

interface TaxonomyManagerProps {
  initialCategories: CategoryItem[];
  initialTags: TagItem[];
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

export default function TaxonomyManager({
  initialCategories,
  initialTags,
}: TaxonomyManagerProps) {
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [tags, setTags] = useState<TagItem[]>(initialTags);

  // Category creation form state
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  // Tag creation form state
  const [tagName, setTagName] = useState("");
  const [tagDesc, setTagDesc] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  // Search filters
  const [catSearch, setCatSearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");

  // Edit states
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatDesc, setEditCatDesc] = useState("");
  const [isUpdatingCat, setIsUpdatingCat] = useState(false);

  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [editTagDesc, setEditTagDesc] = useState("");
  const [isUpdatingTag, setIsUpdatingTag] = useState(false);

  // Delete dialog states
  const [deletingCat, setDeletingCat] = useState<CategoryItem | null>(null);
  const [deletingTag, setDeletingTag] = useState<TagItem | null>(null);

  // Filtered lists
  const filteredCategories = useMemo(() => {
    if (!catSearch.trim()) return categories;
    const q = catSearch.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, catSearch]);

  const filteredTags = useMemo(() => {
    if (!tagSearch.trim()) return tags;
    const q = tagSearch.toLowerCase();
    return tags.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }, [tags, tagSearch]);

  // Handle Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    setIsCreatingCat(true);
    try {
      const res = await createCategory({
        name: catName.trim(),
        description: catDesc.trim() || undefined,
      });

      if (res.success && res.category) {
        setCategories((prev) => [
          ...prev,
          { ...res.category, _count: { articles: 0 } },
        ].sort((a, b) => a.name.localeCompare(b.name)));
        setCatName("");
        setCatDesc("");
        showToast(`Category "${res.category.name}" created successfully!`);
      } else {
        showToast(`Error: ${res.error || "Failed to create category"}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create category";
      showToast(`Error: ${msg}`);
    } finally {
      setIsCreatingCat(false);
    }
  };

  // Handle Create Tag
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;

    setIsCreatingTag(true);
    try {
      const res = await createTag({
        name: tagName.trim(),
        description: tagDesc.trim() || undefined,
      });

      if (res.success && res.tag) {
        setTags((prev) => [
          ...prev,
          { ...res.tag, _count: { articles: 0 } },
        ].sort((a, b) => a.name.localeCompare(b.name)));
        setTagName("");
        setTagDesc("");
        showToast(`Tag "${res.tag.name}" created successfully!`);
      } else {
        showToast(`Error: ${res.error || "Failed to create tag"}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create tag";
      showToast(`Error: ${msg}`);
    } finally {
      setIsCreatingTag(false);
    }
  };

  // Open Edit Category
  const openEditCategory = (cat: CategoryItem) => {
    setEditingCat(cat);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description || "");
  };

  // Submit Edit Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editCatName.trim()) return;

    setIsUpdatingCat(true);
    try {
      const res = await updateCategory(editingCat.id, {
        name: editCatName.trim(),
        description: editCatDesc.trim() || undefined,
      });

      if (res.success && res.category) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingCat.id
              ? { ...res.category, _count: c._count }
              : c
          )
        );
        showToast(`Category "${res.category.name}" updated!`);
        setEditingCat(null);
      } else {
        showToast(`Error: ${res.error || "Failed to update category"}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update category";
      showToast(`Error: ${msg}`);
    } finally {
      setIsUpdatingCat(false);
    }
  };

  // Open Edit Tag
  const openEditTag = (tag: TagItem) => {
    setEditingTag(tag);
    setEditTagName(tag.name);
    setEditTagDesc(tag.description || "");
  };

  // Submit Edit Tag
  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !editTagName.trim()) return;

    setIsUpdatingTag(true);
    try {
      const res = await updateTag(editingTag.id, {
        name: editTagName.trim(),
        description: editTagDesc.trim() || undefined,
      });

      if (res.success && res.tag) {
        setTags((prev) =>
          prev.map((t) =>
            t.id === editingTag.id
              ? { ...res.tag, _count: t._count }
              : t
          )
        );
        showToast(`Tag "${res.tag.name}" updated!`);
        setEditingTag(null);
      } else {
        showToast(`Error: ${res.error || "Failed to update tag"}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update tag";
      showToast(`Error: ${msg}`);
    } finally {
      setIsUpdatingTag(false);
    }
  };

  // Execute Delete Category
  const handleConfirmDeleteCat = async () => {
    if (!deletingCat) return;

    try {
      const res = await deleteCategory(deletingCat.id);
      if (res.success) {
        setCategories((prev) => prev.filter((c) => c.id !== deletingCat.id));
        showToast(`Category "${deletingCat.name}" deleted.`);
      } else {
        showToast(`Error: ${res.error || "Failed to delete category"}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete category";
      showToast(`Error: ${msg}`);
    } finally {
      setDeletingCat(null);
    }
  };

  // Execute Delete Tag
  const handleConfirmDeleteTag = async () => {
    if (!deletingTag) return;

    try {
      const res = await deleteTag(deletingTag.id);
      if (res.success) {
        setTags((prev) => prev.filter((t) => t.id !== deletingTag.id));
        showToast(`Tag "${deletingTag.name}" deleted.`);
      } else {
        showToast(`Error: ${res.error || "Failed to delete tag"}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete tag";
      showToast(`Error: ${msg}`);
    } finally {
      setDeletingTag(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ========================================================= */}
        {/* COLUMN 1: CATEGORIES                                      */}
        {/* ========================================================= */}
        <div className="space-y-6">
          {/* Header & Meta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center">
                <Folder className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink tracking-tight font-[var(--f-ui)]">
                  Categories
                </h2>
                <p className="text-xs text-muted">
                  High-level topic verticals and publication sections.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-2 border border-line text-xs font-semibold text-muted">
              {categories.length}
            </span>
          </div>

          {/* Creation Card */}
          <div className="bg-surface border border-line rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-line">
              <Plus className="w-4 h-4 text-red-600 dark:text-red-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-[var(--f-ui)]">
                Add Category
              </h3>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence"
                  className="w-full h-10 px-3 text-sm rounded-lg border border-line bg-surface text-ink placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-colors"
                />
              </div>

              {/* Slug Preview */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  URL Slug Preview
                </label>
                <div className="flex items-center text-xs font-mono rounded-lg border border-line bg-surface-2 overflow-hidden">
                  <span className="px-3 py-2 text-muted select-none border-r border-line bg-surface-2/80">
                    x-cipher.com/category/
                  </span>
                  <span className="px-3 py-2 text-ink truncate font-semibold">
                    {catName ? slugify(catName) : "slug-preview"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Brief synopsis of this editorial section..."
                  className="w-full h-10 px-3 text-sm rounded-lg border border-line bg-surface text-ink placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-colors"
                />
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  disabled={isCreatingCat || !catName.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-xs transition-all"
                >
                  {isCreatingCat ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Add Category</span>
                </button>
              </div>
            </form>
          </div>

          {/* Categories Table / List Card */}
          <div className="bg-surface border border-line rounded-xl shadow-xs overflow-hidden">
            {/* Table Search & Count Header */}
            <div className="p-3.5 border-b border-line bg-surface-2/40 flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  placeholder="Filter categories..."
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-line bg-surface text-ink placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-red-500/50"
                />
              </div>
              <span className="text-xs text-muted font-medium">
                {filteredCategories.length} {filteredCategories.length === 1 ? "item" : "items"}
              </span>
            </div>

            {/* Semantic Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[380px]">
                <thead>
                  <tr className="border-b border-line bg-surface-2/60 text-xs font-semibold tracking-wider text-muted uppercase font-[var(--f-ui)]">
                    <th className="px-4 py-3 w-[50%]">Name & Description</th>
                    <th className="px-4 py-3 w-[25%] text-center">Articles</th>
                    <th className="px-4 py-3 w-[25%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted">
                        {catSearch ? "No matching categories found." : "No categories created yet."}
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => {
                      const articleCount = cat._count?.articles ?? 0;
                      return (
                        <tr
                          key={cat.id}
                          className="hover:bg-surface-2/40 transition-colors duration-150"
                        >
                          {/* Name & Details */}
                          <td className="px-4 py-3.5">
                            <div className="space-y-1">
                              <div className="font-semibold text-sm text-ink leading-tight">
                                {cat.name}
                              </div>
                              <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono text-muted bg-surface-2 border border-line">
                                /{cat.slug}
                              </div>
                              {cat.description && (
                                <p className="text-xs text-muted line-clamp-1 mt-0.5">
                                  {cat.description}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Article Count */}
                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                articleCount > 0
                                  ? "bg-surface-2 border border-line text-ink"
                                  : "bg-surface-2/50 text-faint border border-line/60"
                              }`}
                            >
                              <FileText className="w-3 h-3 text-muted" />
                              {articleCount}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditCategory(cat)}
                                className="p-1.5 text-muted hover:text-ink hover:bg-surface-2 rounded-md transition-colors"
                                title="Edit Category"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingCat(cat)}
                                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                title="Delete Category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMN 2: TAGS                                            */}
        {/* ========================================================= */}
        <div className="space-y-6">
          {/* Header & Meta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <TagIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink tracking-tight font-[var(--f-ui)]">
                  Tags
                </h2>
                <p className="text-xs text-muted">
                  Granular descriptors and specific keyword classifiers.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-2 border border-line text-xs font-semibold text-muted">
              {tags.length}
            </span>
          </div>

          {/* Creation Card */}
          <div className="bg-surface border border-line rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-line">
              <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-[var(--f-ui)]">
                Add Tag
              </h3>
            </div>

            <form onSubmit={handleCreateTag} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Tag Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="e.g. OpenAI, Cryptography, Zero-Day"
                  className="w-full h-10 px-3 text-sm rounded-lg border border-line bg-surface text-ink placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-colors"
                />
              </div>

              {/* Slug Preview */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  URL Slug Preview
                </label>
                <div className="flex items-center text-xs font-mono rounded-lg border border-line bg-surface-2 overflow-hidden">
                  <span className="px-3 py-2 text-muted select-none border-r border-line bg-surface-2/80">
                    x-cipher.com/tag/
                  </span>
                  <span className="px-3 py-2 text-ink truncate font-semibold">
                    {tagName ? slugify(tagName) : "slug-preview"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={tagDesc}
                  onChange={(e) => setTagDesc(e.target.value)}
                  placeholder="Optional context for this keyword..."
                  className="w-full h-10 px-3 text-sm rounded-lg border border-line bg-surface text-ink placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-colors"
                />
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  disabled={isCreatingTag || !tagName.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-surface hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold rounded-lg shadow-xs transition-all"
                >
                  {isCreatingTag ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Add Tag</span>
                </button>
              </div>
            </form>
          </div>

          {/* Tags Table / List Card */}
          <div className="bg-surface border border-line rounded-xl shadow-xs overflow-hidden">
            {/* Table Search & Count Header */}
            <div className="p-3.5 border-b border-line bg-surface-2/40 flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="Filter tags..."
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-line bg-surface text-ink placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-red-500/50"
                />
              </div>
              <span className="text-xs text-muted font-medium">
                {filteredTags.length} {filteredTags.length === 1 ? "item" : "items"}
              </span>
            </div>

            {/* Semantic Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[380px]">
                <thead>
                  <tr className="border-b border-line bg-surface-2/60 text-xs font-semibold tracking-wider text-muted uppercase font-[var(--f-ui)]">
                    <th className="px-4 py-3 w-[50%]">Name & Description</th>
                    <th className="px-4 py-3 w-[25%] text-center">Articles</th>
                    <th className="px-4 py-3 w-[25%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredTags.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted">
                        {tagSearch ? "No matching tags found." : "No tags created yet."}
                      </td>
                    </tr>
                  ) : (
                    filteredTags.map((tag) => {
                      const articleCount = tag._count?.articles ?? 0;
                      return (
                        <tr
                          key={tag.id}
                          className="hover:bg-surface-2/40 transition-colors duration-150"
                        >
                          {/* Name & Details */}
                          <td className="px-4 py-3.5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <Hash className="w-3 h-3 text-muted" />
                                <span className="font-semibold text-sm text-ink leading-tight">
                                  {tag.name}
                                </span>
                              </div>
                              <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono text-muted bg-surface-2 border border-line">
                                #{tag.slug}
                              </div>
                              {tag.description && (
                                <p className="text-xs text-muted line-clamp-1 mt-0.5">
                                  {tag.description}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Article Count */}
                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                articleCount > 0
                                  ? "bg-surface-2 border border-line text-ink"
                                  : "bg-surface-2/50 text-faint border border-line/60"
                              }`}
                            >
                              <FileText className="w-3 h-3 text-muted" />
                              {articleCount}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditTag(tag)}
                                className="p-1.5 text-muted hover:text-ink hover:bg-surface-2 rounded-md transition-colors"
                                title="Edit Tag"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingTag(tag)}
                                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                title="Delete Tag"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Category Modal / Overlay */}
      {editingCat && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setEditingCat(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-surface border border-line rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="text-base font-bold text-ink">Edit Category</h3>
              <button
                type="button"
                onClick={() => setEditingCat(null)}
                className="p-1 text-muted hover:text-ink rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-line bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-red-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  New Slug Preview
                </label>
                <div className="text-xs font-mono px-3 py-2 rounded-lg bg-surface-2 border border-line text-muted truncate">
                  /category/{slugify(editCatName)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editCatDesc}
                  onChange={(e) => setEditCatDesc(e.target.value)}
                  className="w-full p-3 text-sm rounded-lg border border-line bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-red-500/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingCat || !editCatName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
                >
                  {isUpdatingCat && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tag Modal / Overlay */}
      {editingTag && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setEditingTag(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-surface border border-line rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="text-base font-bold text-ink">Edit Tag</h3>
              <button
                type="button"
                onClick={() => setEditingTag(null)}
                className="p-1 text-muted hover:text-ink rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTag} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTagName}
                  onChange={(e) => setEditTagName(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-line bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-red-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  New Slug Preview
                </label>
                <div className="text-xs font-mono px-3 py-2 rounded-lg bg-surface-2 border border-line text-muted truncate">
                  /tag/{slugify(editTagName)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editTagDesc}
                  onChange={(e) => setEditTagDesc(e.target.value)}
                  className="w-full p-3 text-sm rounded-lg border border-line bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-red-500/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTag(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingTag || !editTagName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
                >
                  {isUpdatingTag && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingCat}
        title={`Delete Category "${deletingCat?.name}"`}
        description={
          (deletingCat?._count?.articles ?? 0) > 0
            ? `Cannot delete this category: It is currently linked to ${deletingCat?._count?.articles} article(s). Please reassign them before deleting.`
            : `Are you sure you want to permanently delete category "${deletingCat?.name}"? This action cannot be undone.`
        }
        confirmText={
          (deletingCat?._count?.articles ?? 0) > 0 ? "Understood" : "Delete Category"
        }
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={
          (deletingCat?._count?.articles ?? 0) > 0
            ? () => setDeletingCat(null)
            : handleConfirmDeleteCat
        }
        onCancel={() => setDeletingCat(null)}
      />

      {/* Delete Tag Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingTag}
        title={`Delete Tag "${deletingTag?.name}"`}
        description={`Are you sure you want to permanently delete tag "${deletingTag?.name}"? It is referenced in ${deletingTag?._count?.articles ?? 0} article(s).`}
        confirmText="Delete Tag"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDeleteTag}
        onCancel={() => setDeletingTag(null)}
      />
    </div>
  );
}
