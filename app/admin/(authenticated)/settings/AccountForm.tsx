"use client";

import { useState } from "react";
import { showToast } from "@/lib/utils";
import { updateNotificationPrefs } from "@/app/actions/profile";

export default function AccountForm({ user }: { user: any }) {
  const [isPending, setIsPending] = useState(false);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Notification Prefs
  const initialPrefs = user?.notificationPrefs || {
    emailAlerts: true,
    weeklyDigest: false,
    reviewUpdates: true
  };
  const [prefs, setPrefs] = useState(initialPrefs);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters");
      return;
    }
    
    setIsPending(true);
    // Add real password change API call here later
    setTimeout(() => {
      showToast("Password updated successfully (Mock)");
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsPending(false);
    }, 1000);
  };

  const handlePrefsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const res = await updateNotificationPrefs({
        emailAlerts: !!prefs.emailAlerts,
        weeklyDigest: !!prefs.weeklyDigest,
        reviewUpdates: !!prefs.reviewUpdates,
      });
      if (res.success) {
        showToast("Notification preferences saved.");
      } else {
        showToast(`Error: ${res.error || "Failed to save preferences"}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save preferences";
      showToast(`Error: ${msg}`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* ── Section: Password Management ────────────────────────── */}
      <div className="cs-settings-section">
        <div className="cs-settings-section-label">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Change Password
        </div>
        <div className="cs-settings-body">
          <form onSubmit={handlePasswordSubmit} className="cs-settings-grid">
            <div className="cs-settings-full">
              <label className="ed-label">Current Password</label>
              <input type="password" className="ed-input" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div>
              <label className="ed-label">New Password</label>
              <input type="password" className="ed-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} />
            </div>
            <div>
              <label className="ed-label">Confirm New Password</label>
              <input type="password" className="ed-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} />
            </div>
            <div className="cs-settings-full" style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn-cs primary" disabled={isPending}>Update Password</button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Section: Notification Preferences ─────────────────── */}
      <div className="cs-settings-section">
        <div className="cs-settings-section-label">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          Notification Preferences
        </div>
        <div className="cs-settings-body">
          <form onSubmit={handlePrefsSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "var(--ink)" }}>
                <input type="checkbox" checked={prefs.emailAlerts} onChange={e => setPrefs({...prefs, emailAlerts: e.target.checked})} style={{ width: "16px", height: "16px", accentColor: "var(--accent)" }} />
                Important Account & Security Alerts
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "var(--ink)" }}>
                <input type="checkbox" checked={prefs.reviewUpdates} onChange={e => setPrefs({...prefs, reviewUpdates: e.target.checked})} style={{ width: "16px", height: "16px", accentColor: "var(--accent)" }} />
                Article Review Status Updates
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "var(--ink)" }}>
                <input type="checkbox" checked={prefs.weeklyDigest} onChange={e => setPrefs({...prefs, weeklyDigest: e.target.checked})} style={{ width: "16px", height: "16px", accentColor: "var(--accent)" }} />
                Weekly Publication Digest
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn-cs" disabled={isPending}>Save Preferences</button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
