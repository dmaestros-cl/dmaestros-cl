"use client";

export function AdminSuccessDialog({ title, message, onClose }: { title: string; message: string; onClose: () => void }) {
  return <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}><section className="admin-success-dialog" role="dialog" aria-modal="true" aria-labelledby="success-dialog-title" aria-describedby="success-dialog-message" onMouseDown={(event) => event.stopPropagation()}><span className="admin-success-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg></span><span className="admin-eyebrow">Operación completada</span><h2 id="success-dialog-title">{title}</h2><p id="success-dialog-message" aria-live="polite">{message}</p><button className="admin-primary-button" type="button" autoFocus onClick={onClose}>Entendido</button></section></div>;
}
