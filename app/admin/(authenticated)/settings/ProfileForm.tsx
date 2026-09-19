"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import {
  Camera,
  X,
  Loader2,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  User,
  Globe,
  Briefcase,
  Check,
  FileText,
  Plus,
} from "lucide-react";
import { updateProfile } from "@/app/actions/profile";
import { uploadAvatar } from "@/app/actions/upload-avatar";
import { showToast } from "@/lib/utils";
import { normaliseCropArea, exportSize } from "@/lib/crop";
import { useEditor, EditorContent } from "@tiptap/react";
import { EditorToolbar } from "@/components/editorial/EditorToolbar";
import { EditorBubbleMenu } from "@/components/editorial/EditorBubbleMenu";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import LinkExtension from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { CodeBlockLowlight } from "@/components/editorial/extensions/CodeBlockLowlight";
import { Figure } from "@/components/editorial/extensions/AdvancedImage";
import { Callout } from "@/components/editorial/extensions/Callout";
import { YouTubeEmbed } from "@/components/editorial/extensions/YouTubeEmbed";

const PLATFORM_OPTIONS = [
  "X",
  "LinkedIn",
  "GitHub",
  "YouTube",
  "Facebook",
  "Instagram",
  "Website",
  "Email",
];

/**
 * Renders the cropped area of an image onto an HTML5 canvas and exports it as a JPEG Blob and File.
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number = 0,
  fileName: string = "avatar.jpg"
): Promise<{ blob: Blob; file: File; url: string }> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("The selected image could not be loaded."));
    img.src = imageSrc;
  });

  const safe = normaliseCropArea(pixelCrop, {
    width: image.naturalWidth,
    height: image.naturalHeight,
  });
  if (!safe) throw new Error("Selected crop area is invalid.");

  const size = exportSize(safe);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize canvas context.");

  if (rotation % 360 !== 0) {
    const rad = (rotation * Math.PI) / 180;
    ctx.translate(size / 2, size / 2);
    ctx.rotate(rad);
    ctx.translate(-size / 2, -size / 2);
  }

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    safe.x,
    safe.y,
    safe.width,
    safe.height,
    0,
    0,
    size,
    size
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create cropped image blob."));
        return;
      }
      const baseName = fileName.replace(/\.[^.]+$/, "") || "avatar";
      const file = new File([blob], `${baseName}-cropped.jpg`, {
        type: "image/jpeg",
      });
      const url = URL.createObjectURL(blob);
      resolve({ blob, file, url });
    }, "image/jpeg", 0.92);
  });
}

export default function ProfileForm({
  user,
  author,
  targetUserId,
  editingOtherName,
  actorRole,
}: {
  user: any;
  author: any;
  targetUserId?: string;
  editingOtherName?: string;
  actorRole?: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const busy = isPending || isRefreshing;

  // Parse existing social links
  let initialSocials: { platform: string; url: string }[] = [];
  try {
    const raw = author?.socialLinks;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw || [];
    if (Array.isArray(parsed)) {
      initialSocials = parsed;
    } else if (typeof parsed === "object") {
      initialSocials = Object.entries(parsed).map(([platform, url]) => ({
        platform,
        url: url as string,
      }));
    }
  } catch {
    initialSocials = [];
  }

  // Form field states
  const [name, setName] = useState(author?.name || user?.name || "");
  const [headline, setHeadline] = useState(author?.headline || "");
  const [role, setRole] = useState(author?.role || "");
  const [avatar, setAvatar] = useState(author?.avatar || "");
  const [overview, setOverview] = useState(author?.overview || "");
  const [bio, setBio] = useState(author?.bio || "");
  const [location, setLocation] = useState(author?.location || "");
  const [website, setWebsite] = useState(author?.website || "");
  const [email, setEmail] = useState(author?.email || "");
  const [expertise, setExpertise] = useState<string[]>(
    author?.expertise
      ? author.expertise
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : []
  );
  const [beatInput, setBeatInput] = useState("");
  const [verifiedTitle, setVerifiedTitle] = useState(
    author?.verifiedTitle || false
  );
  const [disclosure, setDisclosure] = useState(author?.disclosure || "");
  const [pgpPublicKey, setPgpPublicKey] = useState(user?.pgpPublicKey || "");
  const [publicContact, setPublicContact] = useState(
    author?.publicContact !== false
  );
  const [slug, setSlug] = useState(author?.slug || "");
  const [socials, setSocials] =
    useState<{ platform: string; url: string }[]>(initialSocials);

  // Avatar and Cropper states
  const [avatarError, setAvatarError] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [croppedAvatarFile, setCroppedAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropper Modal state
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState("avatar.jpg");
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  // Dirty state tracking
  const [isDirty, setIsDirty] = useState(false);
  const initialDataRef = useRef({
    name,
    headline,
    role,
    avatar,
    overview,
    bio,
    location,
    website,
    email,
    expertise: expertise.join(", "),
    verifiedTitle,
    disclosure,
    pgpPublicKey,
    publicContact,
    slug,
    socials: JSON.stringify(socials),
  });

  useEffect(() => {
    const currentData = {
      name,
      headline,
      role,
      avatar,
      overview,
      bio,
      location,
      website,
      email,
      expertise: expertise.join(", "),
      verifiedTitle,
      disclosure,
      pgpPublicKey,
      publicContact,
      slug,
      socials: JSON.stringify(socials),
    };
    const hasFieldsChanged =
      JSON.stringify(currentData) !== JSON.stringify(initialDataRef.current);
    const hasAvatarChanged = croppedAvatarFile !== null;
    setIsDirty(hasFieldsChanged || hasAvatarChanged);
  }, [
    name,
    headline,
    role,
    avatar,
    overview,
    bio,
    location,
    website,
    email,
    expertise,
    verifiedTitle,
    disclosure,
    pgpPublicKey,
    publicContact,
    slug,
    socials,
    croppedAvatarFile,
  ]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [cropImageSrc, avatarPreview]);

  const isAdmin = ["OWNER", "ADMIN"].includes(actorRole ?? user?.role ?? "");

  // Avatar selection & modal triggers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
    }

    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
    setCropFileName(file.name);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setIsCropperOpen(true);
  };

  const closeCropper = () => {
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    }
    setIsCropperOpen(false);
  };

  const handleApplyCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    setIsCropping(true);
    try {
      const cropped = await getCroppedImg(
        cropImageSrc,
        croppedAreaPixels,
        rotation,
        cropFileName
      );

      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }

      setAvatarPreview(cropped.url);
      setCroppedAvatarFile(cropped.file);
      setAvatarError(false);
      closeCropper();
    } catch (err: any) {
      console.error("Crop error:", err);
      showToast(err.message || "Failed to crop image.");
    } finally {
      setIsCropping(false);
    }
  };

  // Social Links management
  const addSocial = () =>
    setSocials([...socials, { platform: "Website", url: "" }]);
  const updateSocial = (
    index: number,
    key: "platform" | "url",
    value: string
  ) => {
    const next = [...socials];
    next[index][key] = value;
    setSocials(next);
  };
  const removeSocial = (index: number) =>
    setSocials(socials.filter((_, i) => i !== index));

  // Coverage Beats management
  const addBeat = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = beatInput.trim();
      if (val && !expertise.includes(val)) {
        setExpertise([...expertise, val]);
      }
      setBeatInput("");
    }
  };

  const removeBeat = (beat: string) => {
    setExpertise(expertise.filter((b) => b !== beat));
  };

  // Tiptap editor for Full Biography
  const bioEditor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [2, 3, 4] },
      }),
      CodeBlockLowlight,
      Underline,
      Highlight.configure({ multicolor: false }),
      Figure,
      Callout,
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: false,
        protocols: ["http", "https", "mailto"],
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      YouTubeEmbed,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: bio,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setBio(editor.getHTML());
    },
  });

  useEffect(() => {
    if (bioEditor && bioEditor.getHTML() !== bio) {
      bioEditor.commands.setContent(bio);
    }
  }, [bio, bioEditor]);

  // Form submission: uploads avatar to Cloudinary if a cropped file exists, then updates profile
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsPending(true);

    try {
      let finalAvatarUrl = avatar;

      if (croppedAvatarFile) {
        const formData = new FormData();
        formData.append("file", croppedAvatarFile);
        const uploadRes = await uploadAvatar(formData);
        if (!uploadRes.ok || !uploadRes.url) {
          showToast(uploadRes.error || "Failed to upload avatar");
          setIsPending(false);
          return;
        }
        finalAvatarUrl = uploadRes.url;
        setAvatar(finalAvatarUrl);
      }

      const validSocials = socials.filter((s) => s.url.trim() !== "");
      const res = await updateProfile({
        name,
        headline,
        role,
        overview,
        avatar: finalAvatarUrl,
        bio,
        location,
        website,
        email,
        socialLinks: validSocials,
        expertise: expertise.join(", "),
        verifiedTitle,
        disclosure,
        pgpPublicKey,
        publicContact,
        slug,
        targetUserId,
      });

      if (res.success) {
        showToast("Profile saved");
        if (avatarPreview && avatarPreview.startsWith("blob:")) {
          URL.revokeObjectURL(avatarPreview);
        }
        setAvatarPreview(null);
        setCroppedAvatarFile(null);

        initialDataRef.current = {
          name,
          headline,
          role,
          avatar: finalAvatarUrl,
          overview,
          bio,
          location,
          website,
          email,
          expertise: expertise.join(", "),
          verifiedTitle,
          disclosure,
          pgpPublicKey,
          publicContact,
          slug: res.slug || slug,
          socials: JSON.stringify(validSocials),
        };
        setIsDirty(false);
        startRefresh(() => router.refresh());
      } else {
        showToast(res.error || "Failed to update profile");
      }
    } catch (err: any) {
      showToast(err.message || "An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  const handleReset = () => {
    const d = initialDataRef.current;
    setName(d.name);
    setHeadline(d.headline);
    setRole(d.role);
    setOverview(d.overview);
    setAvatar(d.avatar);
    setBio(d.bio);
    setLocation(d.location);
    setWebsite(d.website);
    setEmail(d.email);
    setExpertise(d.expertise ? d.expertise.split(", ").filter(Boolean) : []);
    setVerifiedTitle(d.verifiedTitle);
    setDisclosure(d.disclosure);
    setPgpPublicKey(d.pgpPublicKey);
    setPublicContact(d.publicContact);
    setSlug(d.slug);
    setSocials(JSON.parse(d.socials));

    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setCroppedAvatarFile(null);
    setAvatarError(false);

    if (bioEditor && bioEditor.getHTML() !== d.bio) {
      bioEditor.commands.setContent(d.bio);
    }

    setIsDirty(false);
  };

  const activeAvatarSrc = avatarPreview || avatar;

  // Calculate profile completeness
  const completeness = [
    name,
    activeAvatarSrc,
    headline,
    bio,
    role,
    expertise.length > 0 ? "yes" : "",
    email,
    website || socials.length > 0,
  ].filter(Boolean).length;
  const completenessPercent = Math.round((completeness / 8) * 100);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto pb-32">
      {editingOtherName && (
        <div
          className="mb-8 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-sm text-[var(--ink)] flex items-center gap-3"
          role="status"
        >
          <AlertCircle className="w-5 h-5 text-[var(--warning)] shrink-0" />
          <div>
            <strong className="text-[var(--ink)]">Editing another user&rsquo;s profile:</strong>{" "}
            {editingOtherName}. Changes are saved to their account, not yours.
          </div>
        </div>
      )}

      {/* Profile Completeness Card */}
      <div className="mb-8 p-6 bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold text-[var(--ink)] mb-1">
            Profile Completeness
          </h3>
          <p className="text-[13px] text-[var(--muted)]">
            {completenessPercent === 100
              ? "Your profile is fully optimized for readers and search discovery."
              : "Complete your profile to build trust and authority with your audience."}
          </p>
        </div>
        <div className="flex-1 max-w-xs">
          <div className="flex justify-between text-xs font-medium mb-2">
            <span className="text-[var(--ink)]">{completenessPercent}% Complete</span>
            {completenessPercent < 100 && (
              <span className="text-[var(--accent)] font-semibold">Action Required</span>
            )}
          </div>
          <div className="h-2 w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${completenessPercent}%`,
                backgroundColor:
                  completenessPercent === 100 ? "var(--ok)" : "var(--accent)",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Section: Public Identity ────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-[var(--line)]">
          <User className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-base font-semibold text-[var(--ink)]">Public Identity</h3>
        </div>

        {/* Task 1: Avatar Upload & Cropper Implementation */}
        <div className="flex flex-col sm:flex-row gap-6 mb-8 items-start sm:items-center">
          <div className="flex-none relative">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[var(--line)] bg-[var(--surface-2)] group cursor-pointer shrink-0 shadow-sm hover:border-[var(--accent)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              aria-label="Change avatar photo"
            >
              {activeAvatarSrc && !avatarError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeAvatarSrc}
                  alt={name || "Profile avatar"}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                  <User className="w-10 h-10 stroke-1" />
                </div>
              )}

              {/* Hover semi-transparent overlay with Camera icon and Change Avatar text */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 p-1 text-center">
                <Camera className="w-5 h-5 text-white" />
                <span className="text-[10px] font-semibold tracking-wider uppercase">
                  Change Avatar
                </span>
              </div>
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-[var(--ink)]">Profile Avatar</h4>
            <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
              Click the avatar to upload and adjust your photo. A clean square 1:1 image
              works best across mobile and desktop articles.
            </p>

            {croppedAvatarFile && (
              <div className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--accent)]/10 text-[var(--accent)]">
                <Check className="w-3.5 h-3.5" />
                <span>New cropped avatar ready to save</span>
              </div>
            )}

            {/* Alternative image URL fallback */}
            <details className="mt-3 text-xs text-[var(--muted)]">
              <summary className="cursor-pointer hover:text-[var(--ink)] transition-colors inline-block font-medium">
                Use an image URL instead
              </summary>
              <div className="mt-2 flex flex-col gap-1.5 max-w-md">
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => {
                    setAvatar(e.target.value);
                    setAvatarError(false);
                    setAvatarPreview(null);
                    setCroppedAvatarFile(null);
                  }}
                  placeholder="https://example.com/your-avatar.jpg"
                  className="w-full bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--muted)]/50"
                />
                <span className="text-[11px] text-[var(--muted)]">
                  Note: URLs from social networks often expire. Uploading ensures permanence.
                </span>
              </div>
            </details>
          </div>
        </div>

        {/* 2-Column Responsive Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Display Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Jane Doe"
              className="w-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors placeholder:text-[var(--muted)]/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Headline / Tagline
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={100}
              placeholder="e.g. Senior Tech Correspondent"
              className="w-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors placeholder:text-[var(--muted)]/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Profile URL Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. jane-doe"
              className="w-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors placeholder:text-[var(--muted)]/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Official Role {!isAdmin && <span className="text-[var(--warning)] lowercase font-normal">(Admin only)</span>}
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => isAdmin && setRole(e.target.value)}
              readOnly={!isAdmin}
              maxLength={100}
              placeholder="e.g. Editor-in-Chief"
              className={`w-full border border-[var(--line)] rounded-lg px-3.5 py-2.5 text-sm transition-colors placeholder:text-[var(--muted)]/50 ${
                !isAdmin
                  ? "bg-[var(--surface-2)] cursor-not-allowed text-[var(--muted)]"
                  : "bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
              }`}
            />
          </div>
        </div>
      </div>

      {/* ── Section: Editorial Credentials ───────────── */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-[var(--line)]">
          <Briefcase className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-base font-semibold text-[var(--ink)]">Editorial Credentials</h3>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
            Coverage Beats (Focus Areas)
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {expertise.map((beat) => (
              <span
                key={beat}
                className="inline-flex items-center gap-1.5 bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink)] px-3 py-1 rounded-md text-xs font-mono"
              >
                {beat}
                <button
                  type="button"
                  onClick={() => removeBeat(beat)}
                  className="text-[var(--muted)] hover:text-[var(--bad)] focus:outline-none transition-colors"
                  aria-label={`Remove ${beat}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={beatInput}
            onChange={(e) => setBeatInput(e.target.value)}
            onKeyDown={addBeat}
            placeholder="Type a beat (e.g. AI, Cybersecurity) and press Enter or comma..."
            className="w-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors placeholder:text-[var(--muted)]/50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. San Francisco, CA"
              className="w-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors placeholder:text-[var(--muted)]/50"
            />
          </div>

          {isAdmin ? (
            <div className="flex items-center md:pt-6">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-[var(--ink)]">
                <input
                  type="checkbox"
                  checked={verifiedTitle}
                  onChange={(e) => setVerifiedTitle(e.target.checked)}
                  className="w-4 h-4 accent-[var(--accent)] rounded"
                />
                <span>Verified Editorial Title</span>
                <span className="text-xs text-[var(--warning)] font-normal">(Admin only)</span>
              </label>
            </div>
          ) : (
            <div />
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
            Ethical Disclosure (Optional)
          </label>
          <textarea
            rows={2}
            value={disclosure}
            onChange={(e) => setDisclosure(e.target.value)}
            placeholder="e.g. Holds shares in XYZ Corp. or actively advises startup ABC."
            className="w-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors placeholder:text-[var(--muted)]/50"
          />
        </div>

        <div className="mt-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
            PGP Public Key (Optional)
          </label>
          <textarea
            rows={4}
            value={pgpPublicKey}
            onChange={(e) => setPgpPublicKey(e.target.value)}
            placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----..."
            className="w-full font-mono bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-lg px-3.5 py-2.5 text-[10px] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors placeholder:text-[var(--muted)]/50"
          />
          <p className="mt-2 text-xs text-red-500 font-[family:var(--f-body)]">
            Your public PGP key for secure communications and encrypted tips. Do NOT paste your private key.
          </p>
        </div>
      </div>

      {/* ── Section: Biography ───────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-[var(--line)]">
          <FileText className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-base font-semibold text-[var(--ink)]">Biography</h3>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
            Short Overview
          </label>
          <textarea
            rows={2}
            maxLength={150}
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            placeholder="e.g. Contributing writer covering AI, cryptography, and open source systems."
            className="w-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors placeholder:text-[var(--muted)]/50"
          />
          <div className="flex justify-between items-center text-[11.5px] text-[var(--muted)] mt-1.5">
            <span>Displayed at the bottom of your articles.</span>
            <span>{overview.length}/150</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
            Full Biography
          </label>
          {bioEditor ? (
            <div className="pf-bio-editor rounded-xl border border-[var(--line)] overflow-hidden bg-[var(--surface)]">
              <EditorToolbar editor={bioEditor} />
              <div
                className="ed-body prose max-w-none p-4 min-h-[180px] text-[var(--ink)] focus:outline-none"
                aria-label="Full biography"
              >
                <EditorBubbleMenu editor={bioEditor} />
                <EditorContent editor={bioEditor} />
              </div>
            </div>
          ) : (
            <div className="h-48 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] animate-pulse" />
          )}
          <span className="block mt-2 text-[11.5px] text-[var(--muted)]">
            Displayed on your full public author profile page.
          </span>
        </div>
      </div>

      {/* ── Section: Contact & Social Presence ───────── */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-[var(--line)]">
          <Globe className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-base font-semibold text-[var(--ink)]">
            Contact & Social Presence
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Public Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="public@example.com"
              className="w-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors placeholder:text-[var(--muted)]/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Personal Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yoursite.com"
              className="w-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors placeholder:text-[var(--muted)]/50"
            />
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-[var(--ink)] mb-6">
          <input
            type="checkbox"
            checked={publicContact}
            onChange={(e) => setPublicContact(e.target.checked)}
            className="w-4 h-4 accent-[var(--accent)] rounded"
          />
          <span>Show email and contact forms on public profile</span>
        </label>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">
            Social Links
          </label>
          <div className="flex flex-col gap-3">
            {socials.map((social, index) => (
              <div key={index} className="flex gap-2.5 items-center">
                <select
                  value={social.platform}
                  onChange={(e) => updateSocial(index, "platform", e.target.value)}
                  className="w-36 bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] shrink-0 transition-colors"
                >
                  {PLATFORM_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <input
                  type="url"
                  value={social.url}
                  onChange={(e) => updateSocial(index, "url", e.target.value)}
                  placeholder={`https://${social.platform.toLowerCase()}.com/username`}
                  className="flex-1 bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--muted)]/50"
                />
                <button
                  type="button"
                  onClick={() => removeSocial(index)}
                  className="shrink-0 w-10 h-10 flex items-center justify-center border border-[var(--line)] rounded-lg text-[var(--muted)] hover:text-[var(--bad)] hover:border-[var(--bad)] hover:bg-[var(--surface-2)] transition-colors"
                  aria-label="Remove social link"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addSocial}
              className="self-start inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-deep)] py-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Social Link</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Task 2: Sticky "Save Changes" Bottom Bar ──────────────────────── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ease-in-out transform ${
          isDirty
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-[var(--surface)]/80 backdrop-blur-md border-t border-[var(--line)] shadow-2xl px-4 py-3 sm:py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--warning)] animate-pulse shrink-0" />
              <span className="text-sm font-medium text-[var(--warning)] sm:text-[var(--ink)]">
                You have unsaved changes.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={busy}
                className="px-5 py-2.5 text-sm font-medium rounded-xl text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] hover:shadow-sm border border-transparent hover:border-[var(--line)] transition-all duration-200 disabled:opacity-50 active:scale-95"
              >
                Reset
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={busy}
                className="relative overflow-hidden group px-6 py-2.5 text-sm font-semibold rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent-deep)] disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left ease-out duration-300" />
                <span className="relative flex items-center gap-2">
                  {busy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <span>Save Changes</span>
                      <Check className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Task 1: Cropper Modal UI ────────────────────────────────────── */}
      {isCropperOpen && cropImageSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cropper-modal-title"
        >
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Professional Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)]">
              <h3 id="cropper-modal-title" className="text-base font-semibold text-[var(--ink)]">
                Adjust Avatar
              </h3>
              <button
                type="button"
                onClick={closeCropper}
                disabled={isCropping}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cropping Area (1:1 Aspect Ratio) */}
            <div className="relative w-full aspect-square bg-black overflow-hidden">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
              />
            </div>

            {/* Cropper controls: Zoom slider & Rotate */}
            <div className="px-5 py-3 bg-[var(--surface-2)] border-b border-[var(--line)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 flex-1 max-w-xs">
                <ZoomOut className="w-4 h-4 text-[var(--muted)] shrink-0" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer h-1.5 bg-[var(--line)] rounded-lg"
                  aria-label="Zoom level"
                />
                <ZoomIn className="w-4 h-4 text-[var(--muted)] shrink-0" />
              </div>

              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors text-xs font-medium"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate</span>
              </button>
            </div>

            {/* Footer with Cancel and Apply Crop buttons */}
            <div className="px-5 py-4 flex items-center justify-end gap-3 bg-[var(--surface)]">
              <button
                type="button"
                onClick={closeCropper}
                disabled={isCropping}
                className="px-4 py-2 text-sm font-medium rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                disabled={isCropping || !croppedAreaPixels}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-deep)] disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
              >
                {isCropping ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Applying…</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Apply Crop</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
