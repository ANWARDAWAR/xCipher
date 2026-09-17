"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { showToast } from "@/lib/utils";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { upsertArticle } from "@/app/actions/article";

// Static category options for the editor dropdown
const EDITOR_CATEGORIES: Record<string, string> = {
  ai: "Artificial Intelligence",
  cybersecurity: "Cybersecurity",
  gadgets: "Gadgets & Devices",
  software: "Software",
  programming: "Programming",
  business: "Business & Finance",
  gaming: "Gaming",
};

// Define the schema
const articleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  cat: z.string().min(1, "Category is required"),
  author: z.string().min(1, "Author is required"),
  role: z.string().optional(),
  featured: z.boolean().optional(),
  status: z.enum(["PUBLISHED", "DRAFT", "REVIEW", "SUBMITTED", "REVISION_REQUESTED", "REJECTED"]),
  deck: z.string().optional(),
  img: z.string().optional(),
  tags: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDesc: z.string().optional(),
  bodyHtml: z.string().optional(),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

interface ArticleEditorProps {
  initialData?: any;
  userRole?: string;
  authorName?: string | null;
  authorRole?: string | null;
  authorId?: string | null;
}

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export default function ArticleEditor({
  initialData,
  userRole,
  authorName,
  authorRole,
  authorId,
}: ArticleEditorProps) {
  const [isPending, setIsPending] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(initialData?.slug));
  const isInitializedRef = useRef(false);
  const router = useRouter();

  const defaultValues: Partial<ArticleFormValues> = {
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    cat: initialData?.category?.slug || initialData?.cat || "ai",
    author: initialData?.author || authorName || "xCipher Staff",
    role: initialData?.role || authorRole || "",
    featured: Boolean(initialData?.featured),
    status: (initialData?.status?.toUpperCase() || "DRAFT") as any,
    deck: initialData?.deck || initialData?.excerpt || "",
    img: initialData?.img ? String(initialData.img) : "",
    tags: Array.isArray(initialData?.tags) 
      ? initialData.tags.join(", ") 
      : initialData?.tags || "",
    seoTitle: initialData?.seoTitle || "",
    seoDesc: initialData?.seoDesc || "",
    bodyHtml: initialData?.contentHtml || initialData?.bodyHtml || initialData?.body || "<p>Start writing...</p>",
  };

  const { register, setValue, watch, getValues, reset } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues,
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: defaultValues.bodyHtml,
    onUpdate: ({ editor }) => {
      setValue("bodyHtml", editor.getHTML(), { shouldDirty: true });
    },
  });

  useEffect(() => {
    if (initialData && editor && !isInitializedRef.current) {
      isInitializedRef.current = true;
      const htmlContent = initialData.contentHtml || initialData.bodyHtml || initialData.body || "<p>Start writing...</p>";
      reset({
        title: initialData.title || "",
        slug: initialData.slug || "",
        cat: initialData.category?.slug || initialData.cat || "ai",
        author: initialData.author || authorName || "xCipher Staff",
        role: initialData.role || authorRole || "",
        featured: Boolean(initialData.featured),
        status: (initialData.status?.toUpperCase() || "DRAFT") as any,
        deck: initialData.deck || initialData.excerpt || "",
        img: initialData.img ? String(initialData.img) : "",
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(", ") : initialData.tags || "",
        seoTitle: initialData.seoTitle || "",
        seoDesc: initialData.seoDesc || "",
        bodyHtml: htmlContent,
      });
      if (initialData.slug) {
        setSlugManuallyEdited(true);
      }
      editor.commands.setContent(htmlContent);
    }
  }, [initialData, editor, reset]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setValue("title", newTitle, { shouldValidate: true, shouldDirty: true });
    if (!slugManuallyEdited) {
      setValue("slug", slugify(newTitle), { shouldValidate: true, shouldDirty: true });
    }
  };

  const fillTestData = () => {
    const rand = Math.floor(Math.random() * 10000);
    const title = `Next-Gen Neural Computing Breakthrough ${rand}`;
    const slug = slugify(title);
    const bodyContent = "<h2>Executive Summary</h2><p>Researchers today announced measurable breakthroughs in hybrid neural-classical computing pipelines, unlocking significant reductions in model latency.</p><h3>Key Findings</h3><ul><li>Over 40% reduction in training latency.</li><li>Preserved numerical precision under standard FP8 quantizations.</li></ul>";

    reset({
      title,
      slug,
      cat: "ai",
      author: "Elena Rostova",
      role: "Principal AI Researcher",
      featured: true,
      status: "DRAFT",
      deck: "Quantum-accelerated neural networks achieve breakthrough benchmarks in preliminary lab evaluations.",
      img: "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1280&h=720",
      seoTitle: `${title} | xCipher`,
      seoDesc: "Evaluating quantum-accelerated neural computing benchmarks and architectural implications.",
      tags: "AI, Quantum Computing, Neural Networks",
      bodyHtml: bodyContent,
    });

    setSlugManuallyEdited(true);
    editor?.commands.setContent(bodyContent);
    showToast("Test data populated! You can now Save Draft, Publish, or Preview.");
  };

  const handleSave = async (targetStatus: "DRAFT" | "PUBLISHED" | "SUBMITTED") => {
    const currentTitle = watch("title") || getValues("title");
    if (!currentTitle || !currentTitle.trim()) {
      showToast("Please enter an article title.");
      document.getElementById("edTitle")?.focus();
      return null;
    }

    let currentSlug = watch("slug") || getValues("slug");
    if (!currentSlug || !currentSlug.trim()) {
      currentSlug = slugify(currentTitle);
      setValue("slug", currentSlug, { shouldValidate: true });
    }

    setIsPending(true);
    try {
      const rawTags = watch("tags") || getValues("tags") || "";
      const tagsArray = typeof rawTags === "string" 
        ? rawTags.split(",").map(t => t.trim()).filter(Boolean)
        : Array.isArray(rawTags) ? rawTags : [];

      const payload = {
        id: initialData?.id ? String(initialData.id) : undefined,
        title: currentTitle.trim(),
        slug: currentSlug.trim(),
        cat: watch("cat") || getValues("cat") || "ai",
        author: watch("author") || getValues("author") || authorName || "xCipher Staff",
        role: watch("role") || getValues("role") || authorRole || null,
        authorId: authorId || initialData?.authorId || null,
        status: targetStatus,
        featured: Boolean(watch("featured") ?? getValues("featured")),
        deck: watch("deck") || getValues("deck") || null,
        img: watch("img") || getValues("img") || null,
        tags: tagsArray,
        seoTitle: watch("seoTitle") || getValues("seoTitle") || null,
        seoDesc: watch("seoDesc") || getValues("seoDesc") || null,
        bodyHtml: editor?.getHTML() || "",
        bodyJson: editor?.getJSON() ? JSON.parse(JSON.stringify(editor.getJSON())) : null,
      };

      // Strip any accidental client proxies
      const plainPayload = JSON.parse(JSON.stringify(payload));

      const result = await upsertArticle(plainPayload);

      if (result.success && result.article) {
        showToast(targetStatus === "PUBLISHED" ? "Story published successfully!" : "Draft saved successfully!");
        if (!initialData?.id && result.article.id) {
          router.push(`/admin/editor/${result.article.id}`);
        } else {
          router.refresh();
        }
        return result.article;
      } else {
        showToast("Save failed: " + (result.error || "Unknown error"));
        return null;
      }
    } catch (error: any) {
      showToast("Save failed: " + (error.message || "Network or database error"));
      console.error("Save error:", error);
      return null;
    } finally {
      setIsPending(false);
    }
  };

  const handlePreview = async () => {
    const currentTitle = watch("title") || getValues("title");
    if (!currentTitle || !currentTitle.trim()) {
      showToast("Please enter an article title first to preview");
      document.getElementById("edTitle")?.focus();
      return;
    }

    // Auto-save as draft first so the article is guaranteed to exist in the database
    showToast("Saving draft before preview...");
    const saved = await handleSave("DRAFT");
    if (saved && saved.slug) {
      window.open(`/article/${saved.slug}`, "_blank");
    }
  };

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) {
      return;
    }
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("Image URL (e.g. https://images.pexels.com/...)");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <form className="ed-grid" onSubmit={(e) => { e.preventDefault(); handleSave("PUBLISHED"); }}>
      <div className="ed-full">
        <label className="ed-label" htmlFor="edTitle">Article title</label>
        <input 
          className="ed-input" 
          id="edTitle" 
          placeholder="Write a headline that earns the click honestly" 
          {...register("title", { onChange: handleTitleChange })} 
        />
      </div>
      
      <div>
        <label className="ed-label" htmlFor="edSlug">Slug</label>
        <input 
          className="ed-input" 
          id="edSlug" 
          placeholder="auto-generated-from-title" 
          {...register("slug", {
            onChange: () => setSlugManuallyEdited(true),
          })} 
        />
      </div>
      
      <div>
        <label className="ed-label" htmlFor="edCat">Category</label>
        <select className="ed-input" id="edCat" {...register("cat")}>
          {Object.entries(EDITOR_CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="ed-label" htmlFor="edAuthor">Author</label>
        <input className="ed-input" id="edAuthor" placeholder="e.g. xCipher Staff" {...register("author")} readOnly title="Set from profile settings" style={{ cursor: "not-allowed", backgroundColor: "var(--bg-elevated)", color: "var(--ink-muted)" }} />
        <span style={{ display: "block", marginTop: "4px", fontSize: "12px", color: "var(--ink-muted)" }}>This is automatically set from your profile settings.</span>
      </div>

      <div>
        <label className="ed-label" htmlFor="edRole">Author role</label>
        <input className="ed-input" id="edRole" placeholder="e.g. Senior Tech Correspondent" {...register("role")} readOnly title="Set from profile settings" style={{ cursor: "not-allowed", backgroundColor: "var(--bg-elevated)", color: "var(--ink-muted)" }} />
      </div>
      
      <div>
        <label className="ed-label" htmlFor="edStatus">Publish status</label>
        <select className="ed-input" id="edStatus" {...register("status")}>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted for review</option>
          <option value="REVIEW">In review</option>
          <option value="REVISION_REQUESTED">Revision requested</option>
          <option value="REJECTED">Rejected</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "24px" }}>
        <input 
          type="checkbox" 
          id="edFeatured" 
          {...register("featured")} 
          style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--accent)" }} 
        />
        <label className="ed-label" htmlFor="edFeatured" style={{ margin: 0, cursor: "pointer" }}>
          Feature on homepage / top stories
        </label>
      </div>
      
      <div className="ed-full">
        <label className="ed-label" htmlFor="edExcerpt">Excerpt / deck</label>
        <textarea className="ed-input" id="edExcerpt" rows={2} placeholder="One or two sentences that make the story clear" {...register("deck")} />
      </div>
      
      <div className="ed-full">
        <label className="ed-label" htmlFor="edImg">Featured image URL</label>
        <input className="ed-input" id="edImg" placeholder="https://images.pexels.com/…" {...register("img")} />
        {watch("img") && (
          <div className="ed-imgprev">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={watch("img")!} alt="Draft featured image preview" onError={(e) => (e.currentTarget.style.display = "none")} />
          </div>
        )}
      </div>
      
      <div>
        <label className="ed-label" htmlFor="edTags">Tags (comma separated)</label>
        <input className="ed-input" id="edTags" placeholder="AI, policy, Europe" {...register("tags")} />
      </div>
      
      <div>
        <label className="ed-label" htmlFor="edSeoTitle">SEO title</label>
        <input className="ed-input" id="edSeoTitle" placeholder="Defaults to article title" {...register("seoTitle")} />
      </div>
      
      <div className="ed-full">
        <label className="ed-label" htmlFor="edSeoDesc">SEO description</label>
        <input className="ed-input" id="edSeoDesc" placeholder="Defaults to excerpt" {...register("seoDesc")} />
      </div>
      
      <div className="ed-full">
        <label className="ed-label">Article body</label>
        <div className="ed-toolbar" role="toolbar" aria-label="Formatting">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "active bg-[#232a31]" : ""}
            title="Bold"
          >
            <b>B</b>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "active bg-[#232a31]" : ""}
            title="Italic"
          >
            <i style={{ fontFamily: "Georgia" }}>I</i>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive("underline") ? "active bg-[#232a31]" : ""}
            title="Underline"
          >
            <u>U</u>
          </button>
          <span className="t-sep"></span>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive("heading", { level: 2 }) ? "active bg-[#232a31]" : ""}
            title="Heading"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive("blockquote") ? "active bg-[#232a31]" : ""}
            title="Quote"
          >
            ❝
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "active bg-[#232a31]" : ""}
            title="Bullet list"
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive("orderedList") ? "active bg-[#232a31]" : ""}
            title="Numbered list"
          >
            1. List
          </button>
          <span className="t-sep"></span>
          <button
            type="button"
            onClick={setLink}
            className={editor.isActive("link") ? "active bg-[#232a31]" : ""}
            title="Insert link"
          >
            Link
          </button>
          <button
            type="button"
            onClick={addImage}
            title="Insert image"
          >
            Image
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive("codeBlock") ? "active bg-[#232a31]" : ""}
            title="Code block"
          >
            &lt;/&gt;
          </button>
        </div>
        
        <div className="ed-body" id="edBody" aria-label="Article body editor">
          <EditorContent editor={editor} />
        </div>
      </div>
      
      <div className="ed-full ed-actions">
        <button className="btn-cs" type="button" onClick={fillTestData} disabled={isPending}>Fill Test Data</button>
        <button 
          className="btn-cs" 
          type="button" 
          disabled={isPending} 
          onClick={() => handleSave("DRAFT")}
        >
          {isPending ? "Saving..." : "Save Draft"}
        </button>
        <button 
          className="btn-cs" 
          type="button" 
          disabled={isPending} 
          onClick={handlePreview}
        >
          Preview
        </button>
        <span className="spacer"></span>
        <button 
          className="btn-cs primary" 
          type="button" 
          disabled={isPending} 
          onClick={() => handleSave(userRole === "AUTHOR" ? "SUBMITTED" : "PUBLISHED")}
        >
          {isPending ? "Saving..." : (userRole === "AUTHOR" ? "Submit for Review" : "Publish")}
        </button>
      </div>
    </form>
  );
}
