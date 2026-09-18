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
import { useDraftCache, clearDraftCache } from "@/lib/use-draft-cache";
import { Loader2 } from "lucide-react";
import { Role, ArticleStatus } from "@prisma/client";
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
  // Mirrors ArticleStatus in prisma/schema.prisma, minus the deprecated REVIEW
  // value, which is backfilled to SUBMITTED and never written.
  status: z.enum([
    "DRAFT",
    "SUBMITTED",
    "REVISION_REQUESTED",
    "REJECTED",
    "APPROVED",
    "SCHEDULED",
    "PUBLISHED",
    "ARCHIVED",
  ]),
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
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved" | "error" | "conflict">("idle");
  const [conflictBaseline, setConflictBaseline] = useState<Date | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const router = useRouter();

  // The live article id.
  //
  // This used to be read straight off `initialData?.id` at save time, but that
  // prop is captured when the component mounts and never changes. On /admin/editor
  // (a new story) it is undefined, so every autosave posted with no id and the
  // server -- correctly -- inserted another row. Five seconds of typing produced
  // a new draft, forever.
  //
  // A ref rather than state because handleSave reads it during an in-flight
  // async call: state would still hold the pre-render value and the very next
  // autosave would duplicate once more before React caught up.
  const articleIdRef = useRef<string | null>(initialData?.id ? String(initialData.id) : null);
  const [articleId, setArticleId] = useState<string | null>(
    initialData?.id ? String(initialData.id) : null
  );

  const {
    recovered: recoveredDraft,
    dismissRecovery,
    discard: discardRecovery,
    cache: cacheDraft,
  } = useDraftCache({ articleId: initialData?.id ? String(initialData.id) : null });

  const adoptArticleId = (id: string) => {
    if (!id || articleIdRef.current === id) return;
    articleIdRef.current = id;
    setArticleId(id);
    // Keep the URL in step so a reload lands on the saved story rather than a
    // blank new-story form. replace() not push(): the empty editor is not a
    // place the writer should be able to go "back" to and start a duplicate.
    router.replace(`/admin/editor/${id}`, { scroll: false });
  };

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

  const { register, setValue, watch, getValues, reset, formState: { errors, isSubmitted } } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues,
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Replaced by CodeBlockLowlight for syntax highlighting
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
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
    const subscription = watch(() => {
      // Cache locally on every change, even while a save is in flight or a
      // conflict is unresolved. This is the copy that survives a crash, so it
      // must keep pace with the keystrokes rather than with the server.
      cacheDraft(getValues() as Record<string, unknown>, editor?.getHTML() || "");

      // Don't autosave if the change is programmatic or if we are actively submitting a transition
      if (isPending || autosaveStatus === "conflict") return;
      setAutosaveStatus("idle");
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        handleSave(getValues("status") || "DRAFT", true);
      }, 5000);
    });
    return () => subscription.unsubscribe();
  }, [watch, isPending, autosaveStatus, cacheDraft, editor]);

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

  /** Apply a recovered localStorage cache over the current form. */
  const handleRestoreDraft = () => {
    if (!recoveredDraft) return;
    const values = recoveredDraft.values as Partial<ArticleFormValues>;

    // keepDefaultValues:false so the restored content becomes the new baseline;
    // otherwise react-hook-form would treat it as dirty against the old values
    // and the beforeunload guard would fire on a form the user just restored.
    reset(values as ArticleFormValues);
    if (recoveredDraft.bodyHtml) {
      editor?.commands.setContent(recoveredDraft.bodyHtml);
      setValue("bodyHtml", recoveredDraft.bodyHtml, { shouldDirty: false });
    }
    setSlugManuallyEdited(Boolean(values.slug));
    dismissRecovery();
    showToast("Recovered your unsaved changes.", "success");
  };

  /**
   * Discard & restart — wipe the cache and return the form to a pristine state.
   * Only resets the local form; it never deletes the server-side article, so an
   * existing story is left intact and simply reloaded from the server copy.
   */
  const handleDiscardAndRestart = () => {
    const isExisting = Boolean(articleIdRef.current);
    const message = isExisting
      ? "Discard local changes and reload the saved version of this story?"
      : "Discard this draft and start over? Anything written here will be lost.";

    if (!window.confirm(message)) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    clearDraftCache(articleIdRef.current);
    clearDraftCache(null);
    dismissRecovery();

    if (isExisting) {
      // Server copy is the source of truth for a saved story.
      router.refresh();
      showToast("Reloaded the saved version.", "success");
      return;
    }

    reset({ ...defaultValues, bodyHtml: "<p>Start writing...</p>" } as ArticleFormValues);
    editor?.commands.setContent("<p>Start writing...</p>");
    setSlugManuallyEdited(false);
    setLastSaved(null);
    setAutosaveStatus("idle");
    showToast("Editor reset.", "success");
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
        // Live ref, not the mount-time prop: this is what stops autosave from
        // re-creating the article on every pass.
        id: articleIdRef.current || undefined,
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

        // Claim the id on EVERY successful save, autosave included, and before
        // the autosave early-return below. This is the line the duplication bug
        // turned on: the old code only adopted the id on the manual-save path,
        // so an autosave-first story never learned its own id.
        const wasNew = !articleIdRef.current;
        if (result.article.id) adoptArticleId(String(result.article.id));

        // The server copy is now authoritative, so the crash cache for this
        // form has done its job. A new story also moves to an id-keyed cache
        // key, so drop the "new" bucket to avoid a stale restore prompt on the
        // next blank editor.
        if (wasNew) clearDraftCache(null);
        clearDraftCache(result.article.id ? String(result.article.id) : null);

        if (isAutosave) {
          setAutosaveStatus("saved");
          return result.article;
        }

        showToast(
          targetStatus === "PUBLISHED" ? "Story published successfully!" : "Saved successfully!",
          "success"
        );
        setValue("status", result.article.status as any);
        if (!wasNew) router.refresh();
        return result.article;
      } else {
        if (isAutosave) {
          // On autosave conflict, enter conflict state to prompt user.
          if (result.serverUpdatedAt) {
            setConflictBaseline(new Date(result.serverUpdatedAt));
            setAutosaveStatus("conflict");
            showToast("Autosave conflict: article changed elsewhere.");

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

  
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = tagInput.trim().toLowerCase();
      if (!val) return;
      const current = watch("tags") || "";
      const currentArr = typeof current === "string" ? current.split(",").map(t => t.trim()).filter(Boolean) : (Array.isArray(current) ? current : []);
      if (!currentArr.includes(val)) {
        setValue("tags", [...currentArr, val].join(", "), { shouldDirty: true });
      }
      setTagInput("");
    }
  };
  const handleRemoveTag = (tagToRemove: string) => {
    const current = watch("tags") || "";
    const currentArr = typeof current === "string" ? current.split(",").map(t => t.trim()).filter(Boolean) : (Array.isArray(current) ? current : []);
    setValue("tags", currentArr.filter(t => t !== tagToRemove).join(", "), { shouldDirty: true });
  };
  
  const currentTagsString = watch("tags") || "";
  const currentTags = typeof currentTagsString === "string" ? currentTagsString.split(",").map(t => t.trim()).filter(Boolean) : (Array.isArray(currentTagsString) ? currentTagsString : []);

  return (
    <form onSubmit={(e) => { e.preventDefault(); }} className="flex flex-col h-[100dvh] overflow-hidden bg-[var(--bg)]">
      
      {/* ── Sticky Top Editorial Command Header ── */}
      {/* sticky top-0 as well as flex-shrink-0: the form is a flex column with
          its own scroll containers, but the header still needs to pin when a
          narrow viewport lets the whole form scroll. */}
      <header className="h-14 flex-shrink-0 sticky top-0 z-40 bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--line)] px-4 sm:px-6 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button 
            type="button"
            onClick={() => router.push('/admin/articles')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <span className="hidden sm:inline">Back</span>
          </button>
          
          <div className="w-px h-4 bg-[var(--line)] hidden sm:block mx-1"></div>
          
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            currentFormStatus === 'PUBLISHED' ? 'bg-[var(--ok)]/10 text-[var(--ok)] border border-[var(--ok)]/20' :
            currentFormStatus === 'SUBMITTED' ? 'bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20' :
            'bg-[#f59e0b]/10 text-[#d97706] border border-[#f59e0b]/20'
          }`}>
            {currentFormStatus === 'SUBMITTED' ? 'In Review' : currentFormStatus}
          </span>
          
          <span className="text-xs text-[var(--muted)] hidden md:inline ml-2">
            {editor.storage.characterCount.words()} words · {editor.storage.characterCount.characters()} chars
          </span>
        </div>

        {/* shrink-0 so the action buttons keep their size and the left-hand
            meta cluster is what gives way when the bar runs out of room. */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Inspector Toggle */}
          <button 
            type="button" 
            onClick={() => setIsInspectorOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-[var(--ink-2)] hover:bg-[var(--surface-2)] transition-colors border border-[var(--line-2)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            <span className="hidden sm:inline">Settings</span>
          </button>
          
          <button
            type="button"
            disabled={isPending}
            onClick={handleDiscardAndRestart}
            title="Discard local changes and start over"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-[var(--muted)] hover:text-[var(--bad)] hover:bg-[var(--bad)]/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
            <span className="hidden md:inline">Discard</span>
          </button>

          <button 
            type="button" 
            disabled={isPending} 
            onClick={handlePreview}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-[var(--ink-2)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <span className="hidden sm:inline">Preview</span>
          </button>
          
          {(currentFormStatus === "DRAFT" || currentFormStatus === "REVISION_REQUESTED") && (
            <button 
              type="button" 
              disabled={isPending} 
              onClick={() => handleSave(currentFormStatus)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--line-2)] text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isPending ? "Saving\u2026" : "Save Draft"}
            </button>
          )}

          {currentFormStatus === "PUBLISHED" && canPublish ? (
            <button 
              type="button" 
              disabled={isPending} 
              onClick={() => handleSave("PUBLISHED")}
              className="inline-flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-deep)] active:bg-[var(--accent-press)] text-on-accent font-medium px-4 py-1.5 rounded-lg shadow-sm shadow-[var(--accent)]/20 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isPending ? "Updating\u2026" : "Update Live"}
            </button>
          ) : (
            (currentFormStatus === "DRAFT" || currentFormStatus === "REVISION_REQUESTED") && (
              <button 
                type="button" 
                disabled={isPending} 
                onClick={() => handleSave(canPublish ? "PUBLISHED" : "SUBMITTED")}
                className="inline-flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-deep)] active:bg-[var(--accent-press)] text-on-accent font-medium px-4 py-1.5 rounded-lg shadow-sm shadow-[var(--accent)]/20 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {isPending
                  ? (canPublish ? "Publishing\u2026" : "Submitting\u2026")
                  : (canPublish ? "Publish Story" : "Submit for Review")}
              </button>
            )
          )}
        </div>
      </header>

      {recoveredDraft && (
        <div
          role="status"
          className="bg-[var(--accent)]/10 text-[var(--ink)] px-6 py-3 border-b border-[var(--accent)]/30 flex flex-col sm:flex-row justify-between sm:items-center gap-3 z-50"
        >
          <div className="text-sm">
            <strong className="font-semibold">Unsaved changes recovered.</strong>{" "}
            <span className="text-[var(--muted)]">
              This browser has a copy from{" "}
              {new Date(recoveredDraft.savedAt).toLocaleString()} that was never saved to
              the server.
            </span>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={discardRecovery}
              className="text-xs font-medium px-3 py-1.5 rounded-md border border-[var(--line-2)] text-[var(--ink-2)] hover:bg-[var(--surface-2)] transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="text-xs font-semibold px-3 py-1.5 rounded-md bg-[var(--accent)] text-on-accent hover:bg-[var(--accent-deep)] transition-colors"
            >
              Restore
            </button>
          </div>
        </div>
      )}

      {autosaveStatus === "conflict" && (
        <div role="status" className="bg-warn/10 text-warn px-6 py-3 border-b border-warn flex flex-col sm:flex-row justify-between items-center z-50">
          <div className="text-sm">
            <strong className="font-semibold">Autosave Conflict:</strong> This article was changed elsewhere. Your local changes were not saved.
          </div>
          <div className="flex gap-3 mt-2 sm:mt-0">
            <button type="button" onClick={() => window.location.reload()} className="text-xs font-medium px-3 py-1.5 rounded-md bg-[var(--surface)]/50 hover:bg-[var(--surface)]/80 border border-warn/20 transition-colors text-warn">
              Reload (Discard Local)
            </button>
            <button type="button" onClick={() => {
              if (conflictBaseline) {
                setLastSaved(conflictBaseline);
                setAutosaveStatus("idle");
                setConflictBaseline(null);
                showToast("Overwriting with local changes...");
                setTimeout(() => handleSave(getValues("status") || "DRAFT", true), 0);
              }
            }} className="text-xs font-medium px-3 py-1.5 rounded-md bg-warn text-on-status hover:opacity-90 transition-colors shadow-sm">
              Overwrite
            </button>
          </div>
        </div>
      )}

      {/* ── 2-Column Workspace ── */}
      <div className="flex flex-row flex-1 overflow-hidden w-full relative">
        
        {/* ── Main Writing Canvas (Left/Center) ── */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-4 sm:px-10 py-8 bg-[var(--paper)]">
          <div className="max-w-4xl mx-auto space-y-6 pb-24">
            
            {/* Title Input */}
            <div>
              <label htmlFor="article-title" className="block text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">Article Title <span className="text-[var(--bad)]">*</span></label>
              <textarea
                id="article-title"
                className={`w-full text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--ink)] tracking-tight leading-tight placeholder:text-[var(--muted)]/30 bg-transparent resize-none border-b focus:outline-none pb-3 transition-colors ${errors.title && isSubmitted ? 'border-[var(--bad)] focus:border-[var(--bad)]' : 'border-[var(--line)]/40 focus:border-[var(--ink)]/30'}`}
                rows={2}
                placeholder="Write a headline that earns the click honestly..."
                {...register("title", { onChange: handleTitleChange })}
              />
              {errors.title && isSubmitted && <p className="text-xs text-[var(--bad)] mt-1">{errors.title.message}</p>}
            </div>

            {/* Deck / Excerpt Input */}
            <div>
              <label htmlFor="article-deck" className="block text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">Deck / Excerpt</label>
              <textarea
                id="article-deck"
                className="w-full text-base sm:text-lg text-[var(--muted)] placeholder:text-[var(--muted)]/40 bg-transparent resize-none border-b border-[var(--line)]/40 focus:border-[var(--ink)]/30 focus:outline-none pb-2 transition-colors leading-relaxed"
                rows={2}
                placeholder="Write a compelling one or two sentence deck that summarizes the core revelation..."
                {...register("deck")}
              />
            </div>

            {/* Tiptap Editor Canvas */}
            <div className={isFullscreen ? "ed-editor-shell is-fullscreen fixed inset-0 z-[9999] bg-[var(--bg)] flex flex-col p-4 overflow-y-auto" : "ed-editor-shell border-none shadow-none bg-transparent"}>
              <div className={isFullscreen ? "ed-editor-inner w-full mx-auto max-w-3xl" : "w-full"}>
                <EditorToolbar 
                  editor={editor} 
                  isFullscreen={isFullscreen} 
                  toggleFullscreen={() => setIsFullscreen(!isFullscreen)} 
                />
                
                <div 
                  className="ed-body mt-2 prose prose-lg dark:prose-invert max-w-none min-h-[500px]" 
                  id="edBody" 
                  aria-label="Article body editor"
                  style={isFullscreen ? { minHeight: "calc(100vh - 150px)" } : { border: 'none', padding: 0 }}
                >
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>

            {/* Templates Utility */}
            <div className="pt-6 border-t border-[var(--line)]">
              <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2 block">Quick Start Templates</label>
              <select 
                onChange={(e) => fillTestData(e.target.value)} 
                value=""
                className="text-sm bg-[var(--surface-2)] border border-[var(--line)] rounded-md px-3 py-1.5 text-[var(--ink-2)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="" disabled>Apply Template...</option>
                {Object.keys(ARTICLE_TEMPLATES).map(k => (
                  <option key={k} value={k}>{ARTICLE_TEMPLATES[k].title}</option>
                ))}
              </select>
            </div>
          </div>
        </main>

        {/* Backdrop for mobile slide-over */}
        {isInspectorOpen && (
          <div 
            className="fixed inset-0 z-40 bg-[var(--ink)]/40 backdrop-blur-sm lg:hidden"
            onClick={() => setIsInspectorOpen(false)}
            aria-hidden="true"
          />
        )}
        
        {/* ── Document Inspector Rail (Right Sidebar) ── */}
        <aside className={`fixed inset-y-0 right-0 z-50 w-full max-w-[360px] lg:w-80 xl:w-96 shrink-0 border-l border-[var(--line)] bg-[var(--surface)]/30 overflow-y-auto p-5 sm:p-6 space-y-8 transform transition-transform duration-300 ease-in-out lg:static lg:transform-none lg:translate-x-0 lg:block ${isInspectorOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between lg:hidden mb-2 pb-4 border-b border-[var(--line-2)]">
            <h2 className="text-lg font-bold text-[var(--ink)]">Settings</h2>
            <button 
              type="button" 
              onClick={() => setIsInspectorOpen(false)}
              className="p-2 -mr-2 text-[var(--muted)] hover:text-[var(--ink)] rounded-full hover:bg-[var(--surface-2)] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

{/* Panel A: Publishing & Categorization */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider border-b border-[var(--line-2)] pb-2">Categorization</h3>
            
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1.5" htmlFor="edCat">Category</label>
              <select className="w-full text-sm bg-[var(--surface-2)] border border-[var(--line-2)] rounded-md px-3 py-2 text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]" id="edCat" {...register("cat")}>
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1.5">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {currentTags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--surface-3)] text-[var(--ink)] border border-[var(--line-2)]">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="text-[var(--muted)] hover:text-[var(--bad)] transition-colors focus:outline-none">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </span>
                ))}
              </div>
              <input 
                type="text" 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Type tag & press Enter"
                className="w-full text-sm bg-[var(--surface-2)] border border-[var(--line-2)] rounded-md px-3 py-2 text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--muted)]"
              />
              <input type="hidden" {...register("tags")} />
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1.5">Author</label>
                <input className="w-full text-sm bg-[var(--surface-3)] border border-[var(--line-2)] rounded-md px-3 py-2 text-[var(--muted)] cursor-not-allowed" value={watch("author")} readOnly title="Set from profile settings" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1.5">Author Role</label>
                <input className="w-full text-sm bg-[var(--surface-3)] border border-[var(--line-2)] rounded-md px-3 py-2 text-[var(--muted)] cursor-not-allowed" value={watch("role")} readOnly title="Set from profile settings" />
              </div>
            </div>

            {canPublish && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1.5" htmlFor="edScheduledFor">Schedule Publication</label>
                <input className="w-full text-sm bg-[var(--surface-2)] border border-[var(--line-2)] rounded-md px-3 py-2 text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]" type="datetime-local" id="edScheduledFor" {...register("scheduledFor")} />
              </div>
            )}

            <div className="space-y-3 pt-2 border-t border-[var(--line-2)]">
              <label className="flex items-start gap-2 cursor-pointer group">
                <input type="checkbox" id="edFeatured" {...register("featured")} className="mt-0.5 accent-[var(--accent)]" />
                <span className="text-sm font-medium text-[var(--ink-2)] group-hover:text-[var(--ink)]">Feature on homepage / top stories</span>
              </label>
              
              {canPublish && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1.5" htmlFor="edHomepagePlacement">Homepage Placement</label>
                  <select className="w-full text-sm bg-[var(--surface-2)] border border-[var(--line-2)] rounded-md px-3 py-2 text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]" id="edHomepagePlacement" {...register("homepagePlacement")}>
                    <option value="">None (Default)</option>
                    <option value="hero">Hero Section</option>
                    <option value="featured">Featured Stories</option>
                    <option value="picks">Editor's Picks</option>
                  </select>
                </div>
              )}
            </div>
          </section>

          {/* Panel B: Featured Media */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider border-b border-[var(--line-2)] pb-2">Featured Media</h3>
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1.5" htmlFor="edImg">Image URL</label>
              <input className="w-full text-sm bg-[var(--surface-2)] border border-[var(--line-2)] rounded-md px-3 py-2 text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--muted)]" id="edImg" placeholder="https://images.pexels.com/..." {...register("img")} />
              {watch("img") && (
                <div className="mt-3 aspect-video w-full rounded-md overflow-hidden border border-[var(--line-2)] bg-[var(--surface-3)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={watch("img")!} alt="Featured image preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              )}
            </div>
          </section>

          {/* Panel C: SEO */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider border-b border-[var(--line-2)] pb-2">Search & Social SEO</h3>
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1.5" htmlFor="edSeoTitle">SEO Title</label>
              <input className="w-full text-sm bg-[var(--surface-2)] border border-[var(--line-2)] rounded-md px-3 py-2 text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--muted)]" id="edSeoTitle" placeholder="Defaults to article title" {...register("seoTitle")} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1.5" htmlFor="edSeoDesc">SEO Description</label>
              <textarea className="w-full text-sm bg-[var(--surface-2)] border border-[var(--line-2)] rounded-md px-3 py-2 text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--muted)] resize-none" rows={3} id="edSeoDesc" placeholder="Defaults to excerpt" {...register("seoDesc")} />
            </div>
            <div className="pt-2">
              <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1.5">Google SERP Preview</label>
              <SeoPreview 
                title={watch("seoTitle") || watch("title") || ""} 
                description={watch("seoDesc") || watch("deck") || ""}
                slug={watch("slug") || ""}
                image={watch("img") || ""}
              />
            </div>
          </section>

          {/* Panel D: Permanent Slug */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider border-b border-[var(--line-2)] pb-2">Permanent URL</h3>
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1.5" htmlFor="edSlug">Slug</label>
              <input 
                className="w-full text-sm bg-[var(--surface-2)] border border-[var(--line-2)] rounded-md px-3 py-2 text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] font-mono" 
                id="edSlug" 
                {...register("slug", { onChange: () => setSlugManuallyEdited(true) })} 
              />
            </div>
          </section>

          {/* Review Workspace */}
          {initialData?.id && (
            <section className="pt-6 border-t border-[var(--line-2)]">
              <ReviewWorkspace 
                userRole={userRole || "AUTHOR"} 
                userId={authorId || ""}
                reviewerId={null}
                articleId={initialData.id} 
                currentStatus={currentFormStatus}
                revisions={initialRevisions}
                onDecision={async (status, notes) => {
                  await handleSave(status, false, notes);
                }}
              />
            </section>
          )}

          {/* Mobile bottom actions for unpublish (desktop has it in header, but just in case) */}
          {currentFormStatus === "PUBLISHED" && canPublish && (
            <div className="pt-4 lg:hidden">
              <button 
                type="button" 
                disabled={isPending} 
                onClick={() => handleSave("DRAFT", false, "Unpublished by editor")}
                className="w-full bg-[var(--surface-3)] hover:bg-[var(--line-2)] text-[var(--bad)] font-medium px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Unpublish
              </button>
            </div>
          )}
        </aside>
      </div>
    </form>
  );
}
