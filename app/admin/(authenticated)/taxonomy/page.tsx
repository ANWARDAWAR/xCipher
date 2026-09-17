import { getCategories, getTags, createCategory, createTag } from "@/app/actions/taxonomy";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Taxonomy Management - xCipher Admin",
};

export default async function TaxonomyPage() {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "EDITOR"].includes(user.role)) {
    redirect("/admin");
  }

  const [categories, tags] = await Promise.all([
    getCategories(),
    getTags()
  ]);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Taxonomy Management</h1>
        <p className="muted">Manage categories and tags used across the publication.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '24px' }}>
        {/* Categories Section */}
        <section className="admin-card">
          <h2>Categories</h2>
          <p className="muted" style={{ marginBottom: "16px" }}>Categories represent the high-level topics of articles.</p>
          
          <form action={async (formData) => {
            "use server";
            const name = formData.get("name") as string;
            const desc = formData.get("description") as string;
            await createCategory({ name, description: desc });
          }} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div>
              <label className="ed-label">New Category Name</label>
              <input name="name" className="ed-input" required placeholder="e.g. AI & Machine Learning" />
            </div>
            <div>
              <label className="ed-label">Description (Optional)</label>
              <input name="description" className="ed-input" placeholder="A short description..." />
            </div>
            <button type="submit" className="btn-cs primary" style={{ alignSelf: 'flex-start' }}>Add Category</button>
          </form>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && (
                <tr><td colSpan={2} className="muted">No categories found.</td></tr>
              )}
              {categories.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td><code className="text-sm">{c.slug}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Tags Section */}
        <section className="admin-card">
          <h2>Tags</h2>
          <p className="muted" style={{ marginBottom: "16px" }}>Tags provide specific, granular descriptors for content.</p>
          
          <form action={async (formData) => {
            "use server";
            const name = formData.get("name") as string;
            const desc = formData.get("description") as string;
            await createTag({ name, description: desc });
          }} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div>
              <label className="ed-label">New Tag Name</label>
              <input name="name" className="ed-input" required placeholder="e.g. OpenAI" />
            </div>
            <div>
              <label className="ed-label">Description (Optional)</label>
              <input name="description" className="ed-input" placeholder="A short description..." />
            </div>
            <button type="submit" className="btn-cs primary" style={{ alignSelf: 'flex-start' }}>Add Tag</button>
          </form>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
              </tr>
            </thead>
            <tbody>
              {tags.length === 0 && (
                <tr><td colSpan={2} className="muted">No tags found.</td></tr>
              )}
              {tags.map(t => (
                <tr key={t.id}>
                  <td><strong>{t.name}</strong></td>
                  <td><code className="text-sm">{t.slug}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
