import React from "react";

export function Modal({ open, title, children, onClose, actions }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal__head">
          <h3>{title}</h3>
          <button className="btn btn--ghost" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body">{children}</div>
        <div className="modal__actions">{actions}</div>
      </div>
    </div>
  );
}
