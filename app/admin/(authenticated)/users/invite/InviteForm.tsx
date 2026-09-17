"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteUser } from "../../../../actions/invitations";
import { showToast } from "../../../../../lib/utils";
import Link from "next/link";

export default function InviteForm() {
  const [loading, setLoading] = useState(false);
  const [successLink, setSuccessLink] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await inviteUser(formData);

    if (res.success && res.inviteUrl) {
      showToast("Invitation generated successfully!");
      setSuccessLink(res.inviteUrl);
      router.refresh();
    } else {
      showToast("Error: " + (res.error || "Failed to send invite"));
    }
    setLoading(false);
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(successLink);
    showToast("Link copied to clipboard!");
  };

  if (successLink) {
    return (
      <div className="ed-grid">
        <div className="ed-full">
          <label className="ed-label">Invitation Success</label>
          <p className="cs-sub" style={{ margin: "4px 0 16px 0" }}>
            The invitation link has been successfully generated. If the email fails to deliver, you can share this link directly with the user.
          </p>
          <input 
            className="ed-input" 
            readOnly 
            value={successLink} 
            style={{ marginBottom: "16px" }}
          />
        </div>
        <div className="ed-full ed-actions">
          <Link href="/admin/users" className="btn-cs">Back to Users</Link>
          <span className="spacer"></span>
          <button className="btn-cs" type="button" onClick={copyToClipboard}>
            Copy Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="ed-grid">
      <div className="ed-full">
        <label className="ed-label">Email Address</label>
        <input 
          className="ed-input"
          name="email" 
          type="email" 
          required 
          placeholder="editor@example.com"
        />
      </div>
      
      <div className="ed-full">
        <label className="ed-label">Role</label>
        <select className="ed-input" name="role" required defaultValue="AUTHOR">
          <option value="OWNER">Owner (Full System Access)</option>
          <option value="ADMIN">Admin (User Management + Publishing)</option>
          <option value="EDITOR">Editor (Publishing + Approvals)</option>
          <option value="AUTHOR">Author (Drafting + Submit for Review)</option>
          <option value="REVIEWER">Reviewer (Commenting + Revision Requests)</option>
          <option value="MODERATOR">Moderator (Comments + Community)</option>
          <option value="STAFF">Staff (Read-only Access)</option>
        </select>
      </div>
      
      <div className="ed-full ed-actions">
        <span className="spacer"></span>
        <button 
          type="submit" 
          disabled={loading} 
          className="btn-cs primary"
        >
          {loading ? "Generating..." : "Send Invitation"}
        </button>
      </div>
    </form>
  );
}
