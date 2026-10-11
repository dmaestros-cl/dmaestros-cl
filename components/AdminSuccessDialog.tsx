"use client";

import { useEffect, useId, useRef } from "react";

export function AdminSuccessDialog({ title, message, onClose }: { title: string; message: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // The native top layer escapes the animated tab's stacking context.
    dialog.showModal();
    return () => {
      dialog.close();
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="admin-success-overlay"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          confirmRef.current?.focus();
        }
      }}
    >
      <section className="admin-success-dialog">
        <span className="admin-success-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg></span>
        <span className="admin-eyebrow">Operación completada</span>
        <h2 id={titleId}>{title}</h2>
        <p id={messageId}>{message}</p>
        <button ref={confirmRef} className="admin-primary-button" type="button" autoFocus onClick={onClose}>Entendido</button>
      </section>
    </dialog>
  );
}
