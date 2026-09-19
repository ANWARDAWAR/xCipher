"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/profile";
import { showToast } from "@/lib/utils";
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
import { X, Camera, Loader2, AlertCircle } from "lucide-react";
import { uploadAvatar } from "@/app/actions/upload-avatar";
import { UPLOAD_ACCEPT_ATTR, uploadError, formatBytes, MAX_UPLOAD_BYTES } from "@/lib/upload-constraints";

const PLATFORM_OPTIONS = ["X", "LinkedIn", "GitHub", "YouTube", "Facebook", "Instagram", "Website", "Email"];

export default function ProfileForm({
  user,
  author,
  targetUserId,
  editingOtherName,
  actorRole,
}: {
  user: any;
  author: any;
  /** Set when an owner/admin is editing someone else's profile. The server
   *  re-checks the capability; this only tells the action which record to
   *  write. */
  targetUserId?: string;
  editingOtherName?: string;
  /** Role of the signed-in user. Distinct from `user.role`, which belongs to
   *  the profile on screen -- they differ whenever an owner edits someone
   *  else. The server re-checks this; it only decides what to render. */
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
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw || []);
    if (Array.isArray(parsed)) {
      initialSocials = parsed;
    } else if (typeof parsed === 'object') {
      initialSocials = Object.entries(parsed).map(([platform, url]) => ({ platform, url: url as string }));
    }
  } catch { initialSocials = []; }

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
    author?.expertise ? author.expertise.split(',').map((s: string) => s.trim()).filter(Boolean) : []
  );
  const [beatInput, setBeatInput] = useState("");
  const [verifiedTitle, setVerifiedTitle] = useState(author?.verifiedTitle || false);
  const [disclosure, setDisclosure] = useState(author?.disclosure || "");
  const [publicContact, setPublicContact] = useState(author?.publicContact !== false);
  const [slug, setSlug] = useState(author?.slug || "");
  const [socials, setSocials] = useState<{ platform: string; url: string }[]>(initialSocials);
  
  const [avatarError, setAvatarError] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFile = useCallback(async (file: File) => {
    setAvatarUploadError(null);

    // Rejected here before the bytes leave the machine; the server repeats
    // every check against the actual file.
    const clientError = uploadError(file);
    if (clientError) {
      setAvatarUploadError(clientError);
      return;
    }

    setAvatarBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadAvatar(fd);
      if (res.ok && res.url) {
        setAvatar(res.url);
        // Clear the broken-image flag: a previous bad URL should not leave the
        // new upload rendering as a placeholder.
        setAvatarError(false);
      } else {
        setAvatarUploadError(res.error ?? "The upload failed.");
      }
    } catch {
      setAvatarUploadError("The upload failed. Check your connection and try again.");
    } finally {
      setAvatarBusy(false);
    }
  }, []);

  // Dirty State Tracking
  const [isDirty, setIsDirty] = useState(false);
  const initialDataRef = useRef({
    name, headline, role, avatar, overview, bio, location, website, email,
    expertise: expertise.join(', '), verifiedTitle, disclosure, publicContact, slug,
    socials: JSON.stringify(socials)
  });

  useEffect(() => {
    const currentData = {
      name, headline, role, avatar, overview, bio, location, website, email,
      expertise: expertise.join(', '), verifiedTitle, disclosure, publicContact, slug,
      socials: JSON.stringify(socials)
    };
    const hasChanged = JSON.stringify(currentData) !== JSON.stringify(initialDataRef.current);
    setIsDirty(hasChanged);
  }, [name, headline, role, avatar, overview, bio, location, website, email, expertise, verifiedTitle, disclosure, publicContact, slug, socials]);


  // Falls back to the edited user's role only when no actor role was supplied,
  // which is the self-edit case where the two are the same person.
  const isAdmin = ["OWNER", "ADMIN"].includes(actorRole ?? user?.role ?? "");

  const addSocial = () => setSocials([...socials, { platform: "Website", url: "" }]);
  const updateSocial = (index: number, key: 'platform' | 'url', value: string) => {
    const next = [...socials];
    next[index][key] = value;
    setSocials(next);
  };
  const removeSocial = (index: number) => setSocials(socials.filter((_, i) => i !== index));

  const addBeat = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = beatInput.trim();
      if (val && !expertise.includes(val)) {
        setExpertise([...expertise, val]);
      }
      setBeatInput("");
    }
  };

  const removeBeat = (beat: string) => {
    setExpertise(expertise.filter(b => b !== beat));
  };

  // The biography uses the same editor as an article.
  //
  // It previously ran a reduced RichTextField toolbar, which meant an author
  // writing a long profile had a different set of tools -- and a different
  // visual language -- from the one they use every day. The extension list is
  // the article list, so behaviour, shortcuts and markup all match, and
  // sanitizeBioHtml was widened in step so nothing here is accepted by the
  // editor and then dropped on save.
  const bioEditor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // replaced by the highlighting version below
        heading: { levels: [2, 3, 4] }, // a bio sits inside a page that already has an h1
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
        protocols: ['http', 'https', 'mailto'],
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      YouTubeEmbed,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: bio,
    // This form is server-rendered, and Tiptap warns (and can mismatch) if it
    // renders immediately during SSR.
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsPending(true);
    try {
      const validSocials = socials.filter(s => s.url.trim() !== "");
      const res = await updateProfile({ 
        name, headline, role, overview, avatar, bio, location, website, email, 
        socialLinks: validSocials, expertise: expertise.join(', '), verifiedTitle, disclosure, publicContact, slug,
        // Only meaningful when an owner/admin opened someone else's profile.
        // The action authorises this against the actor's own role.
        targetUserId,
      });
      if (res.success) {
        showToast("Profile saved");
        // Was a full window.location.reload() behind a 600ms setTimeout, which
        // threw away the client bundle and the scroll position to show data the
        // server had already committed. router.refresh() re-fetches just the
        // server components, and the transition keeps the button disabled until
        // the new tree commits rather than for a guessed interval.
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
    setExpertise(d.expertise ? d.expertise.split(', ') : []);
    setVerifiedTitle(d.verifiedTitle);
    setDisclosure(d.disclosure);
    setPublicContact(d.publicContact);
    setSlug(d.slug);
    setSocials(JSON.parse(d.socials));
  };

  const completeness = [
    name, avatar, headline, bio, role, expertise.length > 0 ? "yes" : "", email, website || socials.length > 0
  ].filter(Boolean).length;
  const completenessPercent = Math.round((completeness / 8) * 100);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto pb-32">
      {editingOtherName && (
        /* Editing someone else's profile is easy to forget once you are three
           fields in, and the consequence is publishing changes under the wrong
           byline. The notice stays visible for the whole form. */
        <div className="pf-editing-other" role="status">
          <strong>Editing another user&rsquo;s profile:</strong> {editingOtherName}.
          Changes are saved to their account, not yours.
        </div>
      )}
      
      {/* Profile Completeness Card */}
      <div className="mb-8 p-6 bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold text-[var(--ink)] mb-1">Profile Completeness</h3>
          <p className="text-[13px] text-[var(--muted)]">
            {completenessPercent === 100 
              ? "Your profile is fully optimized for readers."
              : "Complete your profile to build trust and authority with your audience."}
          </p>
        </div>
        <div className="flex-1 max-w-xs">
          <div className="flex justify-between text-xs font-medium mb-2">
            <span className="text-[var(--ink-2)]">{completenessPercent}% Complete</span>
            {completenessPercent < 100 && <span className="text-[var(--accent)]">Action Required</span>}
          </div>
          <div className="h-2 w-full bg-[var(--surface-3)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--accent)] transition-all duration-500 ease-out"
              style={{ width: `${completenessPercent}%`, backgroundColor: completenessPercent === 100 ? 'var(--success)' : 'var(--accent)' }}
            />
          </div>
        </div>
      </div>

      {/* ── Section: Identity ────────────────────────── */}
      <div className="cs-settings-section mb-8">
        <div className="cs-settings-section-label">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Public Identity
        </div>
        <div className="cs-settings-body">
          {/* Avatar: click the circle to upload.
              
              Replaces a plain URL field. Pasting a link put the burden on the
              author to find a permanent, square, correctly-sized image -- and
              the old help text had to warn them off Instagram and Facebook URLs
              because those expire and silently break the byline. Uploading
              removes all of that: Cloudinary crops to a square on the face and
              serves an optimised format, and the URL never rots. */}
          <div className="flex flex-col sm:flex-row gap-6 mb-6 items-start">
            <div className="flex-none">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarBusy}
                className="av-upload"
                aria-label={avatar ? "Replace profile photo" : "Upload a profile photo"}
              >
                {avatar && !avatarError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                ) : (
                  <svg width="32" height="32" fill="none" stroke="var(--muted)" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                )}

                {/* Overlay rather than a separate button: the photo is the
                    affordance, and a 96px circle is a comfortable target. */}
                <span className="av-upload-overlay" aria-hidden="true">
                  {avatarBusy ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span className="av-upload-overlay-text">{avatar ? "Replace" : "Upload"}</span>
                    </>
                  )}
                </span>
              </button>

              <input
                ref={avatarInputRef}
                type="file"
                accept={UPLOAD_ACCEPT_ATTR}
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  // Cleared so re-picking the same file after an error still
                  // fires change.
                  e.target.value = "";
                  if (file) void handleAvatarFile(file);
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <span className="ed-label">Profile photo</span>
              <p className="text-[12.5px] text-[var(--muted)] mt-1.5 leading-relaxed">
                Click the circle to upload. The image is cropped to a square around
                the face and optimised automatically — {formatBytes(MAX_UPLOAD_BYTES)} maximum,
                JPEG, PNG, WebP or GIF.
              </p>

              {avatarUploadError && (
                <p role="alert" className="dz-error mt-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{avatarUploadError}</span>
                </p>
              )}

              {avatarBusy && (
                <p className="text-[12px] text-[var(--muted)] mt-2" role="status" aria-live="polite">
                  Uploading…
                </p>
              )}

              {/* Kept, collapsed, for anything already hosted elsewhere, and so
                  an existing pasted URL is still visible and removable. */}
              <details className="mt-3">
                <summary className="text-[12px] text-[var(--muted)] cursor-pointer hover:text-[var(--ink)]">
                  Use an image URL instead
                </summary>
                <input
                  type="url"
                  className={`ed-input mt-2 ${avatarError ? 'border-[var(--bad)]' : ''}`}
                  value={avatar}
                  onChange={e => { setAvatar(e.target.value); setAvatarError(false); setAvatarUploadError(null); }}
                  placeholder="https://example.com/your-photo.jpg"
                />
                <p className="text-[11.5px] text-[var(--muted)] mt-1.5">
                  <strong className="text-[var(--warn)]">Note:</strong> links from Instagram or
                  Facebook expire and will break your byline. Uploading avoids this.
                </p>
              </details>
            </div>
          </div>

          <div className="cs-settings-grid">
            <div>
              <label className="ed-label">Display Name *</label>
              <input type="text" className="ed-input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Jane Doe" />
            </div>
            <div>
              <label className="ed-label">Headline / Tagline</label>
              <input type="text" className="ed-input" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g. Senior Tech Correspondent" maxLength={100} />
            </div>
            <div>
              <label className="ed-label">Profile URL Slug</label>
              <input type="text" className="ed-input" value={slug} onChange={e => setSlug(e.target.value)} placeholder="e.g. jane-doe" />
            </div>
            <div>
              <label className="ed-label">
                Official Role 
                {!isAdmin && <span className="text-[11px] text-[var(--warn)] ml-2">(Admin only)</span>}
              </label>
              <input 
                type="text" 
                className={`ed-input ${!isAdmin ? 'bg-[var(--surface-2)] cursor-not-allowed text-[var(--muted)]' : ''}`}
                value={role} 
                onChange={e => isAdmin && setRole(e.target.value)} 
                readOnly={!isAdmin} 
                placeholder="e.g. Editor-in-Chief" 
                maxLength={100} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Section: Editorial Credentials ───────────── */}
      <div className="cs-settings-section mb-8">
        <div className="cs-settings-section-label">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Editorial Credentials
        </div>
        <div className="cs-settings-body">
          <div className="cs-settings-full mb-6">
            <label className="ed-label">Coverage Beats (Focus Areas)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {expertise.map((beat) => (
                <span key={beat} className="inline-flex items-center gap-1.5 bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--ink-2)] px-2.5 py-1 rounded-md text-xs font-mono">
                  {beat}
                  <button type="button" onClick={() => removeBeat(beat)} className="hover:text-[var(--bad)] focus:outline-none">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <input 
              type="text" 
              className="ed-input" 
              value={beatInput} 
              onChange={e => setBeatInput(e.target.value)} 
              onKeyDown={addBeat}
              placeholder="Type a beat (e.g. AI, Cybersecurity) and press Enter..." 
            />
          </div>

          <div className="cs-settings-grid">
            <div>
              <label className="ed-label">Location</label>
              <input type="text" className="ed-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. San Francisco, CA" />
            </div>
            {isAdmin && (
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--ink)]">
                  <input type="checkbox" checked={verifiedTitle} onChange={e => setVerifiedTitle(e.target.checked)} className="w-4 h-4 accent-[var(--success)]" />
                  <span className="font-semibold">Verified Editorial Title</span>
                  <span className="text-[var(--warn)] text-xs ml-1">(Admin only)</span>
                </label>
              </div>
            )}
            <div className="cs-settings-full" style={{ gridColumn: "1 / -1" }}>
              <label className="ed-label">Ethical Disclosure (Optional)</label>
              <textarea className="ed-input" rows={2} value={disclosure} onChange={e => setDisclosure(e.target.value)} placeholder="e.g. Holds shares in XYZ Corp. or advises startup ABC." />
            </div>
          </div>
        </div>
      </div>

      {/* ── Section: Biography ───────────────────────── */}
      <div className="cs-settings-section mb-8">
        <div className="cs-settings-section-label">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Biography
        </div>
        <div className="cs-settings-body">
          <div className="cs-settings-full">
            <label className="ed-label">Short Overview</label>
            <textarea
              className="ed-input"
              value={overview}
              onChange={e => setOverview(e.target.value)}
              rows={2}
              maxLength={150}
              placeholder="e.g. Contributing writer covering AI and software."
            />
            <span className="block mt-1.5 text-[11.5px] text-[var(--muted)]">A short bio displayed at the bottom of your articles.</span>
          </div>

          <div className="cs-settings-full mt-6">
            <label className="ed-label">Full Biography</label>
            {bioEditor ? (
              <div className="pf-bio-editor">
                <EditorToolbar editor={bioEditor} />
                <div className="ed-body prose max-w-none" aria-label="Full biography">
                  <EditorBubbleMenu editor={bioEditor} />
                  <EditorContent editor={bioEditor} />
                </div>
              </div>
            ) : (
              /* Fixed height before the client editor mounts, so the form does
                 not jump when it does. */
              <div className="pf-bio-editor pf-bio-loading" aria-hidden="true" />
            )}
            <span className="block mt-1.5 text-[11.5px] text-[var(--muted)]">
              Displayed on your full public author profile page.
            </span>
          </div>
        </div>
      </div>

      {/* ── Section: Contact & Social ────────────────── */}
      <div className="cs-settings-section mb-8">
        <div className="cs-settings-section-label">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          Contact & Social Presence
        </div>
        <div className="cs-settings-body">
          <div className="cs-settings-grid mb-6">
            <div>
              <label className="ed-label">Public Email</label>
              <input type="email" className="ed-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="public@example.com" />
            </div>
            <div>
              <label className="ed-label">Personal Website</label>
              <input type="url" className="ed-input" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yoursite.com" />
            </div>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--ink)] mb-6">
            <input type="checkbox" checked={publicContact} onChange={e => setPublicContact(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
            <span>Show email and contact forms on public profile</span>
          </label>

          <label className="ed-label">Social Links</label>
          <div className="flex flex-col gap-3">
            {socials.map((social, index) => (
              <div key={index} className="flex gap-2 items-center">
                <select className="ed-input w-32 shrink-0" value={social.platform} onChange={e => updateSocial(index, 'platform', e.target.value)}>
                  {PLATFORM_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input
                  type="url"
                  className="ed-input flex-1"
                  value={social.url}
                  onChange={e => updateSocial(index, 'url', e.target.value)}
                  placeholder={`https://${social.platform.toLowerCase()}.com/username`}
                />
                <button
                  type="button"
                  onClick={() => removeSocial(index)}
                  className="shrink-0 w-10 h-10 flex items-center justify-center border border-[var(--line-2)] rounded-md text-[var(--muted)] hover:text-[var(--bad)] hover:border-[var(--bad)] transition-colors"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addSocial} className="self-start text-sm font-medium text-[var(--ink-2)] hover:text-[var(--accent)] transition-colors py-2 px-1">
              + Add Social Link
            </button>
          </div>
        </div>
      </div>

      {/* ── Sticky Save Toolbar ──────────────────────── */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 bg-[var(--paper)]/90 backdrop-blur-md border-t border-[var(--line)] p-4 transform transition-transform duration-300 ${isDirty ? 'translate-y-0 shadow-lg' : 'translate-y-full'}`}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="text-sm font-medium text-[var(--ink-2)] hidden sm:block">
            You have unsaved profile changes.
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button 
              type="button" 
              onClick={handleReset} 
              disabled={busy} 
              className="px-4 py-2 text-sm font-medium rounded-md text-[var(--muted)] hover:bg-[var(--surface-2)] transition-colors"
            >
              Reset
            </button>
            <button 
              type="submit" 
              onClick={handleSubmit}
              disabled={busy} 
              className="px-6 py-2 text-sm font-medium rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-deep)] disabled:opacity-50 transition-colors shadow-sm"
            >
              {busy ? "Saving\u2026" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
