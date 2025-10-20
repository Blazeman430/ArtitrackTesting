import React from "react";
import { Modal } from "../Modal";

export function RequestBorrowModal({ open, onClose, onConfirm, item, saving }) {
  const [qty, setQty] = React.useState(1);
  const [returnDate, setReturnDate] = React.useState("");
  const [purpose, setPurpose] = React.useState("");
  const [who, setWho] = React.useState("");

  React.useEffect(() => { if (open) { setQty(1); setReturnDate(""); setPurpose(""); } }, [open]);

  const submit = () => onConfirm?.({ item, qty, returnDate, purpose, who });

  const disabled = saving || !item || !who || qty <= 0;

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title="Borrow Request"
      actions={
        <>
          <button className="btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn--primary" onClick={submit} disabled={disabled}>
            {saving ? "Submitting..." : "Submit Request"}
          </button>
        </>
      }
    >
      <div className="grid-2">
        <label><span>Item</span><input value={item?.name || ""} readOnly /></label>
        <label><span>Qty</span><input type="number" min="1" value={qty} onChange={(e)=>setQty(Number(e.target.value||1))} /></label>
        <label><span>Return date</span><input type="date" value={returnDate} onChange={(e)=>setReturnDate(e.target.value)} /></label>
        <label style={{gridColumn:"1/-1"}}><span>Purpose</span><input value={purpose} onChange={(e)=>setPurpose(e.target.value)} /></label>
        <label style={{gridColumn:"1/-1"}}><span>Borrower</span><input placeholder="Name / ID" value={who} onChange={(e)=>setWho(e.target.value)} /></label>
      </div>
    </Modal>
  );
}
