import React from "react";
import { Modal } from "../Modal";
import { api } from "../../lib/apiClient";

export default function ConcernsModal({ open, onClose, defaultDept = "" }) {
  const [name, setName] = React.useState("");
  const [dept, setDept] = React.useState(defaultDept);
  const [subject, setSubject] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [image, setImage] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setName("");
    setDept(defaultDept || "");
    setSubject("");
    setDetails("");
    setImage(null);
    setError("");
  }, [open, defaultDept]);

  function onPickFile(e) {
    const f = e.target.files?.[0] || null;
    setImage(f);
  }

  async function handleSubmit() {
    setError("");
    if (!subject.trim()) return setError("Subject is required.");
    if (!details.trim()) return setError("Please describe your concern.");

    try {
      setSaving(true);
      const fd = new FormData();
      if (name) fd.append("name", name);
      if (dept) fd.append("dept", dept);
      fd.append("subject", subject.trim());
      fd.append("message", details.trim());
      if (image instanceof File) fd.append("image", image);

      await api("/api/concerns", { method: "POST", body: fd, credentials: "omit" });
      onClose();
    } catch (e) {
      setError(e?.message || "Failed to submit concern.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Concerns & Suggestions"
      actions={
        <>
          <button className="btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Submitting..." : "Submit"}
          </button>
        </>
      }
    >
      {/* Scoped CSS to beat global rules that force inline/flex layouts */}

      <div className={`c-form ${typeof window !== "undefined" && window.innerWidth >= 760 ? "c-form--two" : ""}`}>
        <div className="c-field">
          <span className="c-label">Your Name</span>
          <input
            className="c-input"
            placeholder="Optional"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="c-field">
          <span className="c-label">Department</span>
          <input
            className="c-input"
            placeholder="e.g., HTM"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            readOnly={!!defaultDept}
          />
        </div>

        <div className="c-field" style={{ gridColumn: "1 / -1" }}>
          <span className="c-label">Subject</span>
          <input
            className="c-input"
            placeholder="Short summary"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="c-field" style={{ gridColumn: "1 / -1" }}>
          <span className="c-label">Details</span>
          <textarea
            className="c-textarea"
            placeholder="Describe your concern or suggestion in detail..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </div>

        <div className="c-field" style={{ gridColumn: "1 / -1" }}>
          <span className="c-label">Attach image (optional)</span>
          <input className="c-file" type="file" accept="image/*" onChange={onPickFile} />
        </div>

        {error && (
          <div style={{ gridColumn: "1/-1", color: "#b91c1c", fontSize: 14 }}>
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
