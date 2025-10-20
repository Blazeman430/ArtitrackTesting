// src/components/modals/DeleteItemsModal.jsx
import React from "react";
import { Modal } from "../Modal";

export function DeleteItemsModal({
  open,
  onClose,
  items = [],            // [{id, sku, name, imageUrl, location}]
  onConfirm,             // (ids: number[]) => Promise<void> | void
  busy = false,
}) {
  const [selected, setSelected] = React.useState(() => new Set());

  // Reset selection when the modal closes
  React.useEffect(() => {
    if (!open) setSelected(new Set());
  }, [open]);

  const allIds = items.map(it => it.id).filter(Boolean);
  const allChecked = allIds.length > 0 && allIds.every(id => selected.has(id));

  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allChecked) {
        allIds.forEach(id => next.delete(id));
      } else {
        allIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const toggleOne = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!selected.size) return onClose();
    if (typeof onConfirm === "function") {
      await onConfirm(Array.from(selected)); // parent will delete + refresh
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete Items"
      actions={
        <>
          <button className="btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            onClick={handleConfirm}
            disabled={busy || selected.size === 0}
            title={selected.size ? `Delete ${selected.size} item(s)` : "Select items to delete"}
          >
            {busy ? "Deleting..." : "Confirm"}
          </button>
        </>
      }
    >
      <p className="muted" style={{ marginTop: 0 }}>
        Select items to delete. This action cannot be undone.
      </p>

      <div className="table-wrap" style={{ maxHeight: 280, overflow: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 28 }}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th>Image</th>
              <th>SKU</th>
              <th>Item</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={it.id ?? i}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(it.id)}
                    onChange={() => toggleOne(it.id)}
                    aria-label={`Select ${it.sku || it.name}`}
                  />
                </td>
                <td>
                  {it.imageUrl ? (
                    <img
                      src={it.imageUrl}
                      alt=""
                      width={36}
                      height={36}
                      style={{ objectFit: "cover", borderRadius: 6, border: "1px solid #e5e7eb" }}
                      onError={(ev) => { ev.currentTarget.style.visibility = "hidden"; }}
                    />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: 6, background: "#f3f4f6", border: "1px solid #e5e7eb" }} />
                  )}
                </td>
                <td className="mono">{it.sku || "—"}</td>
                <td>{it.name}</td>
                <td className="muted">{it.location || "—"}</td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={5} className="muted">No items</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
