import { getCategories, getTags } from "@/app/actions/taxonomy";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canViewTaxonomy } from "@/lib/permissions";
import { Role } from "@prisma/client";
import TaxonomyManager from "./TaxonomyManager";

export const metadata = {
  title: "Taxonomy Management | xCipher",
};

export default async function TaxonomyPage() {
  const user = await getCurrentUser();
  // Derived from the capability map, which is what the sidebar link already
  // uses. A hardcoded list here would be a second source of truth, and the two
  // drifting means either a dead nav link or an unguarded page.
  if (!user || !canViewTaxonomy(user.role as Role)) {
    redirect("/admin");
  }

  const [categories, tags] = await Promise.all([
    getCategories(),
    getTags(),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-ink font-[var(--f-ui)]">
              Taxonomy Management
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-surface-2 border border-line text-xs font-semibold text-muted">
                {categories.length} {categories.length === 1 ? "category" : "categories"}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-2 border border-line text-xs font-semibold text-muted">
                {tags.length} {tags.length === 1 ? "tag" : "tags"}
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-1 font-[var(--f-ui)]">
            Structure publication sections, high-level topics, and granular tag descriptors.
          </p>
        </div>
      </div>

      {/* Structured Two-Column Manager */}
      <TaxonomyManager
        initialCategories={categories}
        initialTags={tags}
      />
    </div>
  );
}
