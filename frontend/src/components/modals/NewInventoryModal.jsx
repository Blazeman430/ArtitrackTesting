import React from "react";

export function NewInventoryModal({ open, onClose, onConfirm }) {
  const [name, setName] = React.useState("");

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm(name.trim());
    setName("");
    onClose();
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__head">
          <h3>Create New Inventory</h3>
          <button className="btn btn--ghost" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal__body">
          <label>
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pastry Kitchen" />
          </label>
          <div className="modal__actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}
