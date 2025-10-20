import React from "react";

export function DeleteInventoryModal({ open, inv, confirmName, setConfirmName, onCancel, onConfirm }) {
  if (!open || !inv) return null;
  const mustType = inv.name;                       // require exact name
  const canDelete = confirmName.trim() === mustType;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal__head">
          <h3>Delete Inventory</h3>
          <button className="btn btn--ghost" onClick={onCancel}>✕</button>
        </div>
        <div className="modal__body">
          <p className="muted">
            This will permanently remove <strong>{inv.name}</strong> and all of its items, history,
            and audits from this department. This action cannot be undone.
          </p>

          <div style={{height:8}} />
          <label>
            <span>Type the inventory name to confirm</span>
            <input
              value={confirmName}
              onChange={e => setConfirmName(e.target.value)}
              placeholder={inv.name}
            />
          </label>
        </div>
        <div className="modal__actions">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn btn--primary" onClick={onConfirm} disabled={!canDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
