"use client";

import React, { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  requireTypedConfirmation?: string;
  /** When true the action behind the dialog is in flight: both buttons are
   *  disabled, the confirm button shows pendingText, and neither Escape nor
   *  an overlay click can close the dialog mid-operation. */
  isPending?: boolean;
  /** Label shown on the confirm button while isPending. */
  pendingText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = true,
  requireTypedConfirmation,
  isPending = false,
  pendingText = "Working…",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typedString, setTypedString] = React.useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  // Typed confirmation is cleared on every close path, so a half-typed string
  // from the last attempt never survives into the next dialog. (Not an
  // effect + setState: closing is an event, not a render derivation, and
  // react-hooks/set-state-in-effect rightly rejects that pattern.)
  const handleClose = () => {
    setTypedString("");
    onCancel();
  };

  const handleConfirm = () => {
    setTypedString("");
    onConfirm();
  };

  // Focus management. On open: remember what had focus, then move it into the
  // dialog (the typed input when there is one, else the confirm button) so a
  // keyboard user is not left behind the overlay. On close: put focus back
  // where it was. On Escape: close, but never mid-flight.
  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement;
    const target = requireTypedConfirmation ? inputRef.current : confirmButtonRef.current;
    target?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      const previous = previousFocusRef.current as HTMLElement | null;
      previousFocusRef.current = null;
      previous?.focus?.();
    };
    // onCancel is a caller-provided setState/close handler; stable in all
    // current call sites. Re-running on isPending keeps Escape honest.
  }, [isOpen, isPending, requireTypedConfirmation, onCancel]);

  if (!isOpen) return null;

  const confirmDisabled =
    isPending || (requireTypedConfirmation ? typedString !== requireTypedConfirmation : false);

  return (
    <div
      className="cs-dialog-overlay"
      onClick={() => {
        if (!isPending) handleClose();
      }}
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "16px"
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      aria-busy={isPending}
    >
      <div
        className="cs-card cs-dialog"
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "24px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
          border: "1px solid var(--line)"
        }}
      >
        <h3 id="dialog-title" style={{ marginTop: 0, marginBottom: "8px", fontSize: "18px" }}>{title}</h3>
        <p id="dialog-description" style={{ color: "var(--ink-muted)", fontSize: "14px", marginBottom: "24px", lineHeight: 1.5 }}>
          {description}
        </p>

        {requireTypedConfirmation && (
          <div style={{ marginBottom: "24px" }}>
            <label htmlFor="dialog-confirm-input" style={{ display: "block", fontSize: "13px", marginBottom: "8px" }}>
              Please type <strong>{requireTypedConfirmation}</strong> to confirm.
            </label>
            <input
              id="dialog-confirm-input"
              ref={inputRef}
              type="text"
              className="ed-input"
              value={typedString}
              onChange={(e) => setTypedString(e.target.value)}
              placeholder={requireTypedConfirmation}
              disabled={isPending}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              style={{ width: "100%" }}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            className="btn-cs"
            disabled={isPending}
            onClick={handleClose}
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            className={`btn-cs ${isDestructive ? "danger" : "primary"}`}
            disabled={confirmDisabled}
            onClick={handleConfirm}
          >
            {isPending ? pendingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
