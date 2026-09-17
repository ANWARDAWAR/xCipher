"use client";

import { useState, useEffect } from "react";
import { updateProfile } from "@/app/actions/profile";
import { showToast } from "@/lib/utils";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";

const PLATFORM_OPTIONS = ["X", "LinkedIn", "GitHub", "YouTube", "Facebook", "Instagram", "Website", "Email"];

export default function ProfileForm({ user, author }: { user: any; author: any }) {
  const [isPending, setIsPending] = useState(false);

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
  const [expertise, setExpertise] = useState(author?.expertise || "");
  const [verifiedTitle, setVerifiedTitle] = useState(author?.verifiedTitle || false);
  const [disclosure, setDisclosure] = useState(author?.disclosure || "");
  const [publicContact, setPublicContact] = useState(author?.publicContact !== false);
  const [slug, setSlug] = useState(author?.slug || "");
  
  const isAdmin = ["OWNER", "ADMIN"].includes(user?.role || "");
  const [socials, setSocials] = useState<{ platform: string; url: string }[]>(initialSocials);

  const addSocial = () => setSocials([...socials, { platform: "Website", url: "" }]);
  const updateSocial = (index: number, key: 'platform' | 'url', value: string) => {
    const next = [...socials];
    next[index][key] = value;
    setSocials(next);
  };
  const removeSocial = (index: number) => setSocials(socials.filter((_, i) => i !== index));

  const bioEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({ openOnClick: false }),
    ],
    content: bio,
    onUpdate: ({ editor }) => {
      setBio(editor.getHTML());
    },
  });

  // Ensure content is synced if reset is called
  useEffect(() => {
    if (bioEditor && bioEditor.getHTML() !== bio) {
      bioEditor.commands.setContent(bio);
    }
  }, [bio, bioEditor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const validSocials = socials.filter(s => s.url.trim() !== "");
      const res = await updateProfile({ 
        name, headline, role, overview, avatar, bio, location, website, email, 
        socialLinks: validSocials, expertise, verifiedTitle, disclosure, publicContact, slug
      });
      if (res.success) {
        showToast("Profile saved! Refreshing...");
        setTimeout(() => window.location.reload(), 600);
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
    setName(author?.name || user?.name || "");
    setHeadline(author?.headline || "");
    setRole(author?.role || "");
    setOverview(author?.overview || "");
    setAvatar(author?.avatar || "");
    setBio(author?.bio || "");
    setLocation(author?.location || "");
    setWebsite(author?.website || "");
    setEmail(author?.email || "");
    setExpertise(author?.expertise || "");
    setVerifiedTitle(author?.verifiedTitle || false);
    setDisclosure(author?.disclosure || "");
    setPublicContact(author?.publicContact !== false);
    setSlug(author?.slug || "");
    setSocials(initialSocials);
  };

  // Calculate profile completeness
  const completeness = [
    name, avatar, headline, bio, role, expertise, email, website || socials.length > 0
  ].filter(Boolean).length;
  const completenessPercent = Math.round((completeness / 8) * 100);

  return (
    <form onSubmit={handleSubmit} className="w-full pb-12">
      
      {/* Profile Completeness */}
      <div style={{ marginBottom: "24px", padding: "16px", background: "var(--surface-2)", borderRadius: "var(--r-md)", border: "1px solid var(--line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", fontWeight: 600 }}>
          <span>Profile Completeness</span>
          <span style={{ color: completenessPercent === 100 ? "var(--success)" : "var(--accent)" }}>{completenessPercent}%</span>
        </div>
        <div style={{ width: "100%", height: "8px", background: "var(--surface)", borderRadius: "4px", overflow: "hidden" }}>
          <div style={{ width: `${completenessPercent}%`, height: "100%", background: completenessPercent === 100 ? "var(--success)" : "var(--accent)", transition: "width 0.3s ease" }} />
        </div>
      </div>

      {/* ── Section: Identity ────────────────────────── */}
      <div className="cs-settings-section">
        <div className="cs-settings-section-label">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Identity
        </div>
        <div className="cs-settings-body">
          {/* Avatar preview + URL */}
          <div className="cs-settings-avatar-row">
            <div className="cs-settings-ava-preview">
              {avatar ? (
                <img src={avatar} alt="avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
              ) : (
                <svg width="24" height="24" fill="none" stroke="#6a7681" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label className="ed-label">Avatar URL</label>
              <input type="url" className="ed-input" value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://example.com/your-photo.jpg" />
              <span style={{ display: 'block', marginTop: '5px', font: '400 11.5px var(--f-ui)', color: '#4a545e' }}>Direct link to a square photo (Unsplash, Imgur, etc.)</span>
            </div>
          </div>

          <div className="cs-settings-grid">
            <div>
              <label className="ed-label">Display Name *</label>
              <input type="text" className="ed-input" value={name} onChange={e => setName(e.target.value)} required placeholder="Anwar Iqbal" />
            </div>
            <div>
              <label className="ed-label">Headline / Tagline</label>
              <input type="text" className="ed-input" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Senior AI Reporter at xCipher" maxLength={100} />
            </div>
            <div>
              <label className="ed-label">Profile URL Slug</label>
              <input type="text" className="ed-input" value={slug} onChange={e => setSlug(e.target.value)} placeholder="e.g. anwar-iqbal" />
            </div>
            <div>
              <label className="ed-label">
                Author Role 
                {!isAdmin && <span style={{ fontSize: "11px", color: "var(--warning)", marginLeft: "8px" }}>(Admin only)</span>}
              </label>
              <input type="text" className="ed-input" value={role} onChange={e => isAdmin && setRole(e.target.value)} readOnly={!isAdmin} placeholder="e.g. Senior Tech Correspondent" maxLength={100} style={{ cursor: !isAdmin ? "not-allowed" : "text", backgroundColor: !isAdmin ? "var(--bg-elevated)" : undefined }} />
            </div>
            <div>
              <label className="ed-label">Coverage Beats (Expertise)</label>
              <input type="text" className="ed-input" value={expertise} onChange={e => setExpertise(e.target.value)} placeholder="e.g. AI, Semiconductors, Cloud" />
            </div>
            <div>
              <label className="ed-label">Location</label>
              <input type="text" className="ed-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Lahore, Pakistan" />
            </div>
            <div>
              <label className="ed-label">Public Email</label>
              <input type="email" className="ed-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="ed-label">Personal Website</label>
              <input type="url" className="ed-input" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yoursite.com" />
            </div>
            {isAdmin && (
              <div className="cs-settings-full">
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "var(--ink)" }}>
                  <input type="checkbox" checked={verifiedTitle} onChange={e => setVerifiedTitle(e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "var(--success)" }} />
                  <span style={{ fontWeight: 600 }}>Verified Editorial Title</span>
                  <span style={{ color: "var(--warning)", fontSize: "12px", marginLeft: "4px" }}>(Admin only)</span>
                </label>
              </div>
            )}
            <div className="cs-settings-full">
              <label className="ed-label">Ethical Disclosure (Optional)</label>
              <textarea className="ed-input" rows={2} value={disclosure} onChange={e => setDisclosure(e.target.value)} placeholder="e.g. Holds shares in XYZ Corp." />
            </div>
            <div className="cs-settings-full">
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "var(--ink)" }}>
                <input type="checkbox" checked={publicContact} onChange={e => setPublicContact(e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "var(--accent)" }} />
                <span>Show email and contact forms on public profile</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section: Biography ───────────────────────── */}
      <div className="cs-settings-section">
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
              placeholder="e.g. Contributing writer at xCipher covering AI and software."
            />
            <span style={{ display: 'block', marginTop: '5px', font: '400 11.5px var(--f-ui)', color: 'var(--muted)' }}>
              A short bio displayed at the bottom of your articles.
            </span>
          </div>

          <div className="cs-settings-full" style={{ marginTop: '16px' }}>
            <label className="ed-label">About You</label>
            
            <div className="ed-toolbar" role="toolbar" aria-label="Formatting" style={{ borderBottom: 'none', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '8px' }}>
              <button type="button" onClick={() => bioEditor?.chain().focus().toggleBold().run()} className={bioEditor?.isActive("bold") ? "active bg-[var(--surface-2)]" : ""} title="Bold"><b>B</b></button>
              <button type="button" onClick={() => bioEditor?.chain().focus().toggleItalic().run()} className={bioEditor?.isActive("italic") ? "active bg-[var(--surface-2)]" : ""} title="Italic"><i style={{ fontFamily: "Georgia" }}>I</i></button>
              <button type="button" onClick={() => bioEditor?.chain().focus().toggleUnderline().run()} className={bioEditor?.isActive("underline") ? "active bg-[var(--surface-2)]" : ""} title="Underline"><u>U</u></button>
              <span className="t-sep"></span>
              <button type="button" onClick={() => bioEditor?.chain().focus().toggleHeading({ level: 2 }).run()} className={bioEditor?.isActive("heading", { level: 2 }) ? "active bg-[var(--surface-2)]" : ""} title="Heading">H2</button>
              <button type="button" onClick={() => bioEditor?.chain().focus().toggleBulletList().run()} className={bioEditor?.isActive("bulletList") ? "active bg-[var(--surface-2)]" : ""} title="Bullet list">• List</button>
              <button type="button" onClick={() => {
                const url = window.prompt("Enter link URL");
                if (url) bioEditor?.chain().focus().setLink({ href: url }).run();
              }} className={bioEditor?.isActive("link") ? "active bg-[var(--surface-2)]" : ""} title="Insert link">Link</button>
            </div>
            
            <div className="ed-body" style={{ minHeight: '120px', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
              <EditorContent editor={bioEditor} />
            </div>

            <span style={{ display: 'block', marginTop: '5px', font: '400 11.5px var(--f-ui)', color: 'var(--muted)' }}>
              Displayed on your full public author profile page.
            </span>
          </div>
        </div>
      </div>

      {/* ── Section: Social Links ────────────────────── */}
      <div className="cs-settings-section">
        <div className="cs-settings-section-label">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          Social Links
        </div>
        <div className="cs-settings-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {socials.map((social, index) => (
              <div key={index} className="cs-social-row">
                <select className="ed-input cs-social-platform" value={social.platform} onChange={e => updateSocial(index, 'platform', e.target.value)}>
                  {PLATFORM_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input
                  type="url"
                  className="ed-input"
                  style={{ flex: 1, minWidth: 0 }}
                  value={social.url}
                  onChange={e => updateSocial(index, 'url', e.target.value)}
                  placeholder={`https://${social.platform.toLowerCase()}.com/username`}
                />
                <button
                  type="button"
                  onClick={() => removeSocial(index)}
                  style={{
                    flexShrink: 0, width: '36px', height: '38px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #2c333b', borderRadius: '4px',
                    color: '#4a545e', background: 'transparent', cursor: 'pointer',
                    transition: 'color .2s, border-color .2s',
                  }}
                  aria-label="Remove"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
            <button type="button" onClick={addSocial} className="btn-cs" style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
              + Add Social Link
            </button>
          </div>
        </div>
      </div>

      {/* ── Action Bar ───────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', paddingTop: '20px', borderTop: '1px solid #1e242b' }}>
        <button type="button" onClick={handleReset} disabled={isPending} className="btn-cs">Reset</button>
        <button type="submit" className="btn-cs primary" disabled={isPending}>
          {isPending ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </form>
  );
}
