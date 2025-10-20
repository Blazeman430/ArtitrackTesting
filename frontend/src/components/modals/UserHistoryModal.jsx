import React from "react";

export function UserHistoryModal({ open, onClose, name, data }) {
  if (!open || !name) return null;
  const rows = data(name);
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal__head">
          <h3>{name} — History (all inventories)</h3>
          <button className="btn btn--ghost" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th><th>Inventory</th><th>Item</th><th>Qty</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.date}-${i}-${r.item || r.items}`}>
                    <td>{r.date}</td>
                    <td className="muted">{r._inv}</td>
                    <td>{r.item || r.items}</td>
                    <td>{r.qty}</td>
                    <td>
                      <span className={`pill ${
                        r.status === "approved" ? "pill--ok" :
                        r.status === "pending"  ? "pill--warn" : "pill--danger"
                      }`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
                {!rows.length && <tr><td className="muted" colSpan={5}>No records for {name}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal__actions">
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}