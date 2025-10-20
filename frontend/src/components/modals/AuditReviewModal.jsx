import React from "react";

export function AuditReviewModal({ open, audit, onClose, onAcknowledge, onRequestRevision }) {
  const [reason, setReason] = React.useState("");
  React.useEffect(() => { setReason(""); }, [audit, open]);
  if (!open || !audit) return null;

  const summary = audit.summary || null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal" style={{ maxWidth: 720 }}>
        <div className="modal__head">
          <h3>Audit {audit.id || "—"} — {audit.dept}</h3>
          <button className="btn btn--ghost" onClick={onClose}>✕</button>
        </div>

        <div className="modal__body">
          <div className="grid-2">
            <label>
              <span>Status</span>
              <input value={audit.status} readOnly />
            </label>
            <label>
              <span>Date</span>
              <input value={audit.date} readOnly />
            </label>
            <label>
              <span>Submitted By</span>
              <input value={audit.submittedBy || "—"} readOnly />
            </label>
            <label>
              <span>Dept</span>
              <input value={audit.dept} readOnly />
            </label>

            {summary ? (
              <>
                <label>
                  <span>Counted (report)</span>
                  <input value={summary.counted} readOnly />
                </label>
                <label>
                  <span>System (records)</span>
                  <input value={summary.system} readOnly />
                </label>
                <label>
                  <span>Mismatches</span>
                  <input value={summary.mismatches} readOnly />
                </label>
                <label style={{ gridColumn:"1/-1" }}>
                  <span>Note from department</span>
                  <input value={audit.note || ""} readOnly />
                </label>
              </>
            ) : (
              <div className="muted" style={{ gridColumn:"1/-1" }}>
                No detailed summary provided for this audit.
              </div>
            )}

            {/* Only show revision reason input when requesting revision */}
            {audit.status !== "Acknowledged" && (
              <label style={{ gridColumn:"1/-1" }}>
                <span>Revision reason (optional)</span>
                <input
                  value={reason}
                  onChange={(e)=>setReason(e.target.value)}
                  placeholder="Explain what needs to be fixed or clarified"
                />
              </label>
            )}
          </div>
        </div>

        <div className="modal__actions">
          <button className="btn" onClick={onClose}>Close</button>
          {audit.status !== "Acknowledged" && (
            <>
              <button className="btn" onClick={() => onRequestRevision(audit, reason)}>Request Revision</button>
              <button className="btn btn--primary" onClick={() => onAcknowledge(audit)}>Acknowledge</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
