"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { showToast } from "@/lib/utils";
import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import { CharacterCount } from "@tiptap/extension-character-count";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import tippy from 'tippy.js';

import { upsertArticle } from "@/app/actions/article";
import { Role } from "@prisma/client";
import { ALLOWED_MEDIA_DOMAINS } from "@/lib/sanitize";
import SeoPreview from "./SeoPreview";
import ReviewWorkspace from "./ReviewWorkspace";
import { EditorToolbar } from "./EditorToolbar";
import { Figure } from "./extensions/AdvancedImage";
import { Callout } from "./extensions/Callout";
import { SlashMenu } from "./extensions/SlashMenu";
import { CodeBlockLowlight } from "./extensions/CodeBlockLowlight";
import { SlashCommandList, getSuggestionItems } from "./SlashCommandList";

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

// Templates
const ARTICLE_TEMPLATES: Record<string, { title: string, deck: string, html: string }> = {
  news: {
    title: "News Template",
    deck: "The core facts, implications, and quotes.",
    html: "<p><strong>City, Date</strong> — Core news paragraph answering Who, What, When, Where, and Why.</p><h2>The Details</h2><p>Provide the essential context and data.</p><aside data-callout-type=\"quote\">Key quote from an expert or official goes here.</aside><h2>Why It Matters</h2><p>Explain the broader impact on the industry.</p>"
  },
  review: {
    title: "Review Template",
    deck: "Our verdict on the latest tech.",
    html: "<h2>The Verdict</h2><aside data-callout-type=\"takeaway\"><strong>Pros:</strong><br>- Great battery life<br>- Solid build quality<br><br><strong>Cons:</strong><br>- High price point<br>- Missing key feature</aside><h2>Design & Build</h2><p>Details about the physical hardware.</p><h2>Performance</h2><p>How it handles daily tasks.</p><h2>Conclusion</h2><p>Final thoughts on whether it is worth buying.</p>"
  },
  guide: {
    title: "How-To Guide",
    deck: "Step-by-step instructions.",
    html: "<h2>What You Need</h2><ul><li>Tool A</li><li>Tool B</li></ul><h2>Step 1: Preparation</h2><p>First step details...</p><aside data-callout-type=\"info\"><strong>Tip:</strong> Don't skip this part!</aside><h2>Step 2: Execution</h2><p>Second step details...</p>"
  }
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
  img: z.string().optional().refine((url) => {
    if (!url) return true;
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) return false;
      return ALLOWED_MEDIA_DOMAINS.includes(parsed.hostname);
    } catch { return false; }
  }, { message: "Invalid image URL or unapproved domain (must be from Pexels, Unsplash, etc.)" }),
  tags: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDesc: z.string().optional(),
  bodyHtml: z.string().optional(),
  notes: z.string().optional(),
  scheduledFor: z.string().optional(),
  homepagePlacement: z.string().optional(),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

interface ArticleEditorProps {
  initialData?: any;
  userRole?: string;
  authorName?: string | null;
  authorRole?: string | null;
  authorId?: string | null;
  availableCategories?: any[];
  availableTags?: any[];
  initialRevisions?: any[];
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
  availableCategories = [],
  availableTags = [],
  initialRevisions = [],
}: ArticleEditorProps) {
  const [isPending, setIsPending] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(initialData?.slug));
  const [lastSaved, setLastSaved] = useState<Date | null>(initialData?.updatedAt ? new Date(initialData.updatedAt) : null);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
    scheduledFor: initialData?.scheduledFor ? new Date(initialData.scheduledFor).toISOString().slice(0, 16) : "",
    homepagePlacement: initialData?.homepagePlacement || "",
  };

  const { register, setValue, watch, getValues, reset } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues,
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Replaced by CodeBlockLowlight for syntax highlighting
      }),
      CodeBlockLowlight,
      Underline,
      Highlight.configure({ multicolor: false }),
      Figure,
      Callout,
      Link.configure({
        openOnClick: false,
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CharacterCount.configure({
        limit: 50000,
      }),
      SlashMenu.configure({
        suggestion: {
          items: getSuggestionItems,
          render: () => {
            let component: ReactRenderer
            let popup: any

            return {
              onStart: (props: any) => {
                component = new ReactRenderer(SlashCommandList, {
                  props,
                  editor: props.editor,
                })

                if (!props.clientRect) return

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                })
              },

              onUpdate(props: any) {
                component.updateProps(props)

                if (!props.clientRect) return

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                })
              },

              onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                  popup[0].hide()
                  return true
                }
                return (component.ref as any)?.onKeyDown(props)
              },

              onExit() {
                popup[0].destroy()
                component.destroy()
              },
            }
          },
        }
      })
    ],
    editorProps: {
      attributes: {
        class: 'prose ed-body-content',
      },
    },
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

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // If there are unsaved changes (idle waiting for debounce, saving, or error)
      if (autosaveStatus !== "saved" && (typingTimeoutRef.current !== null || autosaveStatus === "error")) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [autosaveStatus]);

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      // Don't autosave if the change is programmatic or if we are actively submitting a transition
      if (isPending) return;
      setAutosaveStatus("idle");
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        handleSave(getValues("status") || "DRAFT", true);
      }, 5000);
    });
    return () => subscription.unsubscribe();
  }, [watch, isPending]);

  const fillTestData = (templateKey?: string) => {
    if (templateKey && ARTICLE_TEMPLATES[templateKey]) {
      const template = ARTICLE_TEMPLATES[templateKey];
      const title = template.title + " " + Math.floor(Math.random() * 1000);
      reset({
        title,
        slug: slugify(title),
        cat: "ai",
        author: "xCipher Staff",
        role: "Editorial",
        featured: false,
        status: "DRAFT",
        deck: template.deck,
        img: "",
        seoTitle: `${title} | xCipher`,
        seoDesc: template.deck,
        tags: templateKey,
        bodyHtml: template.html,
      });
      setSlugManuallyEdited(true);
      editor?.commands.setContent(template.html);
      showToast(`Template "${template.title}" applied!`);
      return;
    }

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

  const handleSave = async (targetStatus: string, isAutosave = false, notesOverride?: string) => {
    const currentTitle = watch("title") || getValues("title");
    if (!currentTitle || !currentTitle.trim()) {
      if (!isAutosave) showToast("Please enter an article title.");
      return null;
    }

    let currentSlug = watch("slug") || getValues("slug");
    if (!currentSlug || !currentSlug.trim()) {
      currentSlug = slugify(currentTitle);
      if (!isAutosave) setValue("slug", currentSlug, { shouldValidate: true });
    }

    if (!isAutosave) {
      if (["SUBMITTED", "PUBLISHED"].includes(targetStatus)) {
        if (!currentTitle || !currentTitle.trim()) {
          showToast("Pre-flight Check Failed: Title is required.");
          return null;
        }
        const deck = watch("deck") || getValues("deck");
        if (!deck || deck.trim().length < 10) {
          showToast("Pre-flight Check Failed: A descriptive deck is required.");
          return null;
        }
        if (editor.storage.characterCount.words() < 50) {
          showToast("Pre-flight Check Failed: Article must be at least 50 words.");
          return null;
        }
      }
      setIsPending(true);
    }
    if (isAutosave) setAutosaveStatus("saving");
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
        lastUpdatedAt: lastSaved ? lastSaved.toISOString() : undefined,
        isAutosave: Boolean(isAutosave),
        notes: notesOverride || null,
        scheduledFor: watch("scheduledFor") || getValues("scheduledFor") || null,
      };

      // Strip any accidental client proxies
      const plainPayload = JSON.parse(JSON.stringify(payload));

      const result = await upsertArticle(plainPayload);

      if (result.success && result.article) {
        setLastSaved(new Date(result.article.updatedAt));
        if (isAutosave) {
          setAutosaveStatus("saved");
          return result.article;
        }

        showToast(targetStatus === "PUBLISHED" ? "Story published successfully!" : "Saved successfully!");
        setValue("status", result.article.status);
        if (!initialData?.id && result.article.id) {
          router.push(`/admin/editor/${result.article.id}`);
        } else {
          router.refresh();
        }
        return result.article;
      } else {
        if (isAutosave) {
          // On autosave conflict, silently resync the baseline so subsequent autosaves succeed.
          // The server returns the current updatedAt so we can align without a page reload.
          if (result.serverUpdatedAt) {
            setLastSaved(new Date(result.serverUpdatedAt));
            setAutosaveStatus("saved");
          } else {
            setAutosaveStatus("error");
            console.error("Autosave failed:", result.error);
          }
        } else {
          showToast("Save failed: " + (result.error || "Unknown error"));
        }
        return null;
      }
    } catch (error: any) {
      if (isAutosave) {
        setAutosaveStatus("error");
      } else {
        showToast("Save failed: " + (error.message || "Network or database error"));
      }
      console.error("Save error:", error);
      return null;
    } finally {
      if (!isAutosave) setIsPending(false);
    }
  };

  const handlePreview = async () => {
    const currentTitle = watch("title") || getValues("title");
    if (!currentTitle || !currentTitle.trim()) {
      showToast("Please enter an article title first to preview");
      document.getElementById("edTitle")?.focus();
      return;
    }

    // Save the current state before previewing to ensure the DB has the latest content.
    // We use the current status so we don't accidentally unpublish a live article.
    const currentStatus = watch("status") || getValues("status") || "DRAFT";
    showToast("Saving before preview...");
    const saved = await handleSave(currentStatus);
    if (saved && saved.id) {
      window.open(`/preview/${saved.id}`, "_blank");
    }
  };

  if (!editor) {
    return null;
  }

  const isEditorial = ["OWNER", "ADMIN", "EDITOR", "REVIEWER"].includes(userRole || "");
  const canPublish = ["OWNER", "ADMIN", "EDITOR"].includes(userRole || "");
  const currentFormStatus = watch("status") || "DRAFT";

  return (
    <form className="ed-grid" onSubmit={(e) => { e.preventDefault(); }}>
      <div className="ed-full" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--surface)", borderRadius: "var(--r-md)", border: "1px solid var(--line)", marginBottom: "16px" }}>
        <div>
          <span style={{ fontWeight: 600, color: "var(--ink)" }}>Status: </span>
          <span className="muted" style={{ padding: "4px 8px", background: "var(--surface-2)", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>{currentFormStatus}</span>
        </div>
        <div style={{ fontSize: "12px", color: "var(--ink-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
          {autosaveStatus === "saving" && <span>⏳ Autosaving...</span>}
          {autosaveStatus === "saved" && <span style={{ color: "var(--accent)" }}>✓ Saved</span>}
          {autosaveStatus === "error" && <span style={{ color: "red" }}>⚠️ Save failed</span>}
          {lastSaved && <span>Last saved: {lastSaved.toLocaleTimeString()}</span>}
          <div style={{ marginLeft: "12px" }}>
            <select 
              onChange={(e) => fillTestData(e.target.value)} 
              value=""
              style={{ padding: "4px 8px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "4px", fontSize: "12px" }}
            >
              <option value="" disabled>Apply Template...</option>
              {Object.keys(ARTICLE_TEMPLATES).map(k => (
                <option key={k} value={k}>{ARTICLE_TEMPLATES[k].title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

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
          {availableCategories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
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
      
      {canPublish && (
        <div>
          <label className="ed-label" htmlFor="edScheduledFor">Schedule Publication (Optional)</label>
          <input className="ed-input" id="edScheduledFor" type="datetime-local" {...register("scheduledFor")} />
        </div>
      )}

      <div style={{ display: "flex", gap: "24px", marginTop: "24px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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

        {canPublish && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label className="ed-label" htmlFor="edHomepagePlacement" style={{ margin: 0 }}>Homepage Placement:</label>
            <select className="ed-input" id="edHomepagePlacement" {...register("homepagePlacement")} style={{ width: "auto" }}>
              <option value="">None (Default)</option>
              <option value="hero">Hero Section</option>
              <option value="featured">Featured Stories</option>
              <option value="picks">Editor's Picks</option>
            </select>
          </div>
        )}
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
      
      <div className="ed-full">
        <label className="ed-label" htmlFor="edTags">Tags</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px", padding: "12px", border: "1px solid var(--line)", borderRadius: "var(--r-md)", background: "var(--bg-elevated)", maxHeight: "160px", overflowY: "auto" }}>
          {availableTags.length > 0 ? availableTags.map(tag => (
            <label key={tag.id} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", cursor: "pointer" }}>
              <input type="checkbox" value={tag.slug} {...register("tags")} style={{ accentColor: "var(--accent)" }} />
              {tag.name}
            </label>
          )) : (
            <span className="muted text-sm">No tags available. Manage them in Taxonomy.</span>
          )}
        </div>
        <input type="hidden" {...register("tags")} />
      </div>
      
      <div className="ed-full" style={{ padding: "16px", border: "1px solid var(--line)", borderRadius: "var(--r-md)", background: "var(--surface-1)" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>SEO & Metadata</h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div>
            <label className="ed-label" htmlFor="edSeoTitle">SEO title</label>
            <input className="ed-input" id="edSeoTitle" placeholder="Defaults to article title" {...register("seoTitle")} />
          </div>
          <div>
            <label className="ed-label" htmlFor="edSeoDesc">SEO description</label>
            <input className="ed-input" id="edSeoDesc" placeholder="Defaults to excerpt" {...register("seoDesc")} />
          </div>
        </div>

        <SeoPreview 
          title={watch("seoTitle") || watch("title") || ""} 
          description={watch("seoDesc") || watch("deck") || ""}
          slug={watch("slug") || ""}
          image={watch("img") || ""}
        />
      </div>
      
      <div className={isFullscreen ? "ed-editor-shell is-fullscreen fixed inset-0 z-[9999] bg-[var(--bg)] flex flex-col p-4 overflow-y-auto" : "ed-full ed-editor-shell"}>
        <div className={isFullscreen ? "ed-editor-inner w-full mx-auto" : ""}>
          <label className="ed-label">Article body</label>
          
          <EditorToolbar 
            editor={editor} 
            isFullscreen={isFullscreen} 
            toggleFullscreen={() => setIsFullscreen(!isFullscreen)} 
          />
          
          <div className="ed-body" id="edBody" aria-label="Article body editor" style={isFullscreen ? { minHeight: "calc(100vh - 150px)", maxHeight: "none", border: "none" } : {}}>
            <EditorContent editor={editor} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderTop: 'none', borderBottomLeftRadius: 'var(--r-md)', borderBottomRightRadius: 'var(--r-md)', fontSize: '12px', color: 'var(--ink-muted)' }}>
            <span>
              {editor.storage.characterCount.words()} words · {editor.storage.characterCount.characters()} characters
            </span>
            <span>
              ~{Math.ceil(editor.storage.characterCount.words() / 200)} min read
            </span>
          </div>
        </div>
      </div>

      
      {initialData?.id && (
        <div className="ed-full" style={{ marginTop: "24px" }}>
          <ReviewWorkspace 
            userRole={userRole || "AUTHOR"} 
            articleId={initialData.id} 
            currentStatus={currentFormStatus}
            revisions={initialRevisions}
            onDecision={async (status, notes) => {
              await handleSave(status, false, notes);
            }}
          />
        </div>
      )}

      <div className="ed-full ed-actions" style={{ flexWrap: "wrap", gap: "12px", marginTop: "32px", padding: "16px", background: "var(--surface)", borderTop: "1px solid var(--line)" }}>
        <button 
          className="btn-cs" 
          type="button" 
          disabled={isPending} 
          onClick={handlePreview}
        >
          Preview
        </button>

        <span className="spacer" style={{ flexGrow: 1 }}></span>

        {/* Explicit Transitions based on Role and Status */}
        {currentFormStatus === "DRAFT" || currentFormStatus === "REVISION_REQUESTED" ? (
          <>
            <button className="btn-cs" type="button" disabled={isPending} onClick={() => handleSave(currentFormStatus)}>
              {isPending ? "Saving..." : "Save Draft"}
            </button>
            <button className="btn-cs primary" type="button" disabled={isPending} onClick={() => handleSave("SUBMITTED")}>
              Submit for Review
            </button>
          </>
        ) : null}

        {currentFormStatus === "PUBLISHED" && canPublish ? (
          <>
            <button className="btn-cs danger" type="button" disabled={isPending} onClick={() => handleSave("DRAFT", false, "Unpublished by editor")}>
              Unpublish
            </button>
            <button className="btn-cs primary" type="button" disabled={isPending} onClick={() => handleSave("PUBLISHED")}>
              {isPending ? "Updating..." : "Update Live"}
            </button>
          </>
        ) : null}

      </div>
    </form>
  );
}
