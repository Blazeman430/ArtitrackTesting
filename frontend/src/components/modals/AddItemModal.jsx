import React from "react";
import { Modal } from "../Modal";

export function AddItemModal({
  open,
  onClose,
  onConfirm,
  saving = false,
  defaultDept = "HTM",
  onSearchItems,   // optional async (q, dept, inventoryId, attachOnly, signal) => [...]
  inventoryId = null,
  attachOnly = false,
  catalog = []     // optional fallback for client-side filter    // optional fallback for client-side filter
}) {
  // ---------- form state ----------
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [qty, setQty] = React.useState(0);
  const [acqDate, setAcqDate] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [dept, setDept] = React.useState(defaultDept);
  const [imageFile, setImageFile] = React.useState(null);
  const [preview, setPreview] = React.useState(null);
  const [min, setMin] = React.useState(0);
  const [description, setDescription] = React.useState("");
  const [error, setError] = React.useState("");
  const [batches, setBatches] = React.useState([{ expires_at: "", qty: 0 }]);
  const abortRef = React.useRef(null);
  const cacheRef = React.useRef(new Map()); // key: `${dept}|${inventoryId}|${q}`
  const [sku, setSku] = React.useState("");
  const [selectedItem, setSelectedItem] = React.useState(null); // {id, sku, ...} when picking a suggestion


  // ---------- typeahead state ----------
  const [sugs, setSugs] = React.useState([]);
  const [showSugs, setShowSugs] = React.useState(false);
  const [hi, setHi] = React.useState(-1);

  // wrappers/refs for outside-click + focus mgmt
  const nameBoxRef = React.useRef(null);
  const nameInputRef = React.useRef(null);
  const listRef = React.useRef(null);
  const suppressNextSearchRef = React.useRef(false);

  const [fileKey, setFileKey] = React.useState(0); // to reset <input type="file"/>

  function resetForm() {
    setName("");
    setSku("");
    setSelectedItem(null);
    setCategory("");
    setQty(0);
    setAcqDate("");
    setLocation("");
    setMin(0);
    setDescription("");
    setImageFile(null);
    setPreview(null);
    setError("");
    setSugs([]);
    setShowSugs(false);
    setHi(-1);
    setDept(defaultDept);      // keep or remove if you want dept unchanged
    setFileKey((k) => k + 1);  // forces file input to clear
  }

  React.useEffect(() => {
    if (open) resetForm();   // blank on open
  }, [open, defaultDept]);


  // reset when opened or dept changes
  // put near other effects
  React.useEffect(() => {
    if (!showSugs) return;
    function onOutside(e) {
      const box = nameBoxRef.current;
      if (box && !box.contains(e.target)) {
        setShowSugs(false);
        setHi(-1);
      }
    }
    // capture phase so it fires even if something stops propagation
    window.addEventListener('pointerdown', onOutside, true);
    return () => window.removeEventListener('pointerdown', onOutside, true);
  }, [showSugs]);

  const norm = (s) => (s || "").toLowerCase();
  const matchesItem = (it, q) => {
    const hay = `${it.name||""} ${it.sku||""} ${it.category||""}`.toLowerCase();
    const tokens = q.trim().toLowerCase().split(/\s+/);
    return tokens.every(t => hay.includes(t));
  };
  // file picker
  function onPickFile(e) {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  // ---------- search (debounced) ----------
    React.useEffect(() => {
      if (!open) return;

      // one-shot suppression after selecting a suggestion
      if (suppressNextSearchRef.current) {
        suppressNextSearchRef.current = false;
        return;
      }

      const q = name.trim();

      // clear stale results immediately
      if (sugs.length) setSugs([]);
      if (hi !== -1) setHi(-1);

      if (q.length < 2) {            // nothing to search
        if (showSugs) setShowSugs(false);
        return;
      }
      if (!showSugs) setShowSugs(true);

      // cancel any in-flight request
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const scope = (inventoryId == null || !attachOnly) ? "ALL" : String(inventoryId);
      const key = `${dept}|${scope}|${q.toLowerCase()}`;


      const t = setTimeout(() => {
        (async () => {
          // serve from cache if recent
          const cached = cacheRef.current.get(key);
          if (cached && Date.now() - cached.t < 60_000) {
            setSugs(cached.rows);
            return;
          }

          let rows = [];
          if (typeof onSearchItems === "function") {
            try {
              rows = await onSearchItems(q, dept, inventoryId, attachOnly, ctrl.signal);
            } catch (e) {
              // optional: console.warn(e);
            }
          } else {
            rows = (catalog || []).filter(it =>
              (!it.dept || String(it.dept).toLowerCase() === String(dept).toLowerCase()) &&
              matchesItem(it, q)
            );
          }
          if (ctrl.signal.aborted) return;

          // light ranking: exact SKU > prefix SKU > name include
          const L = q.toLowerCase();
          const like = (s) => String(s || "").toLowerCase();
          const rank = (r) =>
            (like(r.sku) === L ? 3 :
            like(r.sku).startsWith(L) ? 2 :
            like(r.name).includes(L) ? 1 : 0);

          rows = (Array.isArray(rows) ? rows : []).sort((a, b) =>
            rank(b) - rank(a) || like(a.name).localeCompare(like(b.name))
          );

          const trimmed = rows.slice(0, 12);
          setSugs(trimmed);
          cacheRef.current.set(key, { t: Date.now(), rows: trimmed });
        })(); // <-- async IIFE for await
      }, 180);

      return () => {
        ctrl.abort();
        clearTimeout(t);
      };
    }, [open, name, dept, inventoryId, attachOnly]);


  // keep highlighted item visible when navigating with arrows
  React.useEffect(() => {
    if (!listRef.current || hi < 0) return;
    const row = listRef.current.querySelectorAll(".ai-suggest__row")[hi];
    if (row?.scrollIntoView) row.scrollIntoView({ block: "nearest" });
  }, [hi]);

  // close on click outside
  React.useEffect(() => {
    if (!open) return;
    function onDocPointer(e) {
      const el = nameBoxRef.current;
      if (el && !el.contains(e.target)) {
        setShowSugs(false);
        setHi(-1);
      }
    }
    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("touchstart", onDocPointer, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("touchstart", onDocPointer);
    };
  }, [open]);

  // close on ESC (document-level to catch focus quirks)
  React.useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") {
        setShowSugs(false); setHi(-1);
        // keep focus on the input for quick re-open
        nameInputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open]);

  // apply a suggestion and fill fields
  function applySuggestion(it) {
    if (!it) return;
    // prevent the upcoming name change from triggering the search effect
    suppressNextSearchRef.current = true;

    setName(it.name || "");
    setSku(it.sku || "");
    setSelectedItem({ id: it.id, sku: it.sku || "" });
    setCategory(it.category || "");
    setMin(Number(it.min ?? 0));
    setLocation(it.location || "");
    setDescription(it.description || "");
    if (it.image_url) setPreview(it.image_url);

    // HARD close + clear results so onFocus can't reopen it
    setShowSugs(false);
    setSugs([]);
    setHi(-1);
    // keep focus for continued typing
    requestAnimationFrame(() => nameInputRef.current?.focus());
  }

  // name input keyboard nav
    function onNameKeyDown(e) {
    if (e.key === 'Escape') {
      setShowSugs(false); setHi(-1);
      e.stopPropagation();         // don’t let modal eat it
      return;
    }
    if (!showSugs || sugs.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => Math.min(h + 1, sugs.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHi(h => Math.max(h - 1, 0)); }
    if (e.key === 'Enter')     { e.preventDefault(); applySuggestion(sugs[hi >= 0 ? hi : 0]); }
  }

  React.useEffect(() => {
    if (!showSugs) return;
    const onEsc = (e) => {
      if (e.key === 'Escape') { setShowSugs(false); setHi(-1); }
    };
    window.addEventListener('keydown', onEsc, true);   // capture
    return () => window.removeEventListener('keydown', onEsc, true);
  }, [showSugs]);


  async function handleSubmit() {
    setError("");
    if (!name.trim()) return setError("Name is required");
    const batchTotal = (batches || []).reduce((s, b) => s + (Number(b.qty) || 0), 0);
    if (Number(qty) <= 0 && batchTotal <= 0) {
      return setError("Enter a Quantity or at least one Batch qty > 0");
    }

    await onConfirm?.({
      id: selectedItem?.id ?? null,
      sku: (selectedItem?.sku ?? sku).trim(),
      name: name.trim(),
      category: category.trim() || null,
      qty: Number(qty),
      min: Number(min),
      description: description.trim() || "",
      acquired_at: acqDate || null,
      location: location.trim() || "",
      dept,
      image: imageFile || null,
      imagePreview: preview || "",
      batches: batches.filter(b => Number(b.qty) > 0),  
    });

    resetForm();  
    // close suggestions after confirm
    setShowSugs(false); setHi(-1);
  }

  function addBatchRow() {
    setBatches((b) => [...b, { expires_at: "", qty: 0 }]);
  }
  function removeBatchRow(i) {
    setBatches((b) => b.length > 1 ? b.filter((_, x) => x !== i) : b);
  }
  function editBatch(i, field, value) {
    setBatches((b) => b.map((row, x) => x === i ? { ...row, [field]: value } : row));
  }

  return (
    <Modal
      open={open}
      onClose={() => { resetForm(); onClose?.(); }} 
      title="Add New Item"
      actions={
        <>
          <button className="btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Confirm"}
          </button>
        </>
      }
    >
      <div className="grid-2">
        <label>
          <span>Department</span>
          <input value={dept} readOnly />
        </label>

        {/* ---------- SMART NAME FIELD ---------- */}
        <label style={{ position: "relative" }} ref={nameBoxRef}>
          <span>Name</span>
          <input
            ref={nameInputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => { if (sugs.length) setShowSugs(true); }}
            onKeyDown={onNameKeyDown}
            onBlur={() => {
              queueMicrotask(() => {
                const box = nameBoxRef.current;
                if (box && !box.contains(document.activeElement)) {
                  setShowSugs(false); setHi(-1);
                }
              });
            }}
            placeholder="Type new item name or search existing items…"
            autoComplete="off"
          />

          {showSugs && (
            <div
              className="ai-suggest"
              role="listbox"
              ref={listRef}
              style={{
                position: "absolute", left: 0, right: 0, top: "calc(100% + 6px)",
                background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
                boxShadow: "0 12px 24px rgba(17,24,39,.10)",
                maxHeight: 260, overflow: "auto", zIndex: 50
              }}
            >
              {sugs.length === 0 && (
                <div className="ai-suggest__empty" style={{ padding: 12, color: "#6b7280" }}>
                  No matches. Keep typing…
                </div>
              )}

              {sugs.map((it, i) => (
                <button
                  key={it.id ?? i}
                  type="button"
                  className="ai-suggest__row"
                  aria-selected={hi === i}
                  onMouseEnter={() => setHi(i)}
                  // prevent input blur so clicks don't collapse layout before applySuggestion
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applySuggestion(it)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px 1fr auto",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "10px 12px",
                    background: hi === i ? "#fff7cc" : "#fff",
                    border: "0",
                    borderTop: i ? "1px solid #f3f4f6" : "0",
                    textAlign: "left",
                    cursor: "pointer"
                  }}
                >
                  <div style={{
                    width:44, height:44, borderRadius:8, overflow:"hidden",
                    border:"1px solid #e5e7eb", background:"#f3f4f6", display:"grid", placeItems:"center"
                  }}>
                    {it.image_url ? <img src={it.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                  </div>

                  <div style={{ overflow: "hidden" }}>
                    <div style={{ fontWeight: 800, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                      {it.name}
                    </div>
                    <div className="muted" style={{ fontSize: 12, display:"flex", gap:8, flexWrap:"wrap" }}>
                      {it.sku ? <span className="mono">{it.sku}</span> : null}
                      {it.category ? <span>· {it.category}</span> : null}
                      {typeof it.on_hand === "number" ? <span>· On hand: {it.on_hand}</span> : null}
                      {it.soonest_exp ? <span>· Exp: <span className="mono">{String(it.soonest_exp).slice(0,10)}</span></span> : null}
                    </div>
                  </div>

                   <span style={{ fontSize:12, fontWeight:700, color:"#065f46", background:"#dcfce7", padding:"2px 8px", borderRadius:999 }}>
                     {typeof it.min === "number" ? `Min: ${it.min}` : "Attach"}
                   </span>
                </button>
              ))}
            </div>
          )}
        </label>

        <label>
          <span>Category</span>
          <input value={category} onChange={(e) => setCategory(e.target.value)} />
        </label>

        <label>
          <span>Quantity</span>
          <input type="number" min="0" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
        </label>

        <label>
          <span>Minimum Stock</span>
          <input type="number" min="0" value={min} onChange={(e) => setMin(Number(e.target.value))} />
        </label>

        <label>
          <span>Acquisition Date</span>
          <input type="date" value={acqDate} onChange={(e) => setAcqDate(e.target.value)} />
        </label>

        {/* Batches (Expiry) */}
        <div style={{ gridColumn: "1/-1", marginTop: 8 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Expiration Batches</div>
          <div style={{ display:"grid", gap: 8 }}>
            {batches.map((row, i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap: 8 }}>
                <label>
                  <span>Expiration Date</span>
                  <input
                    type="date"
                    value={row.expires_at}
                    onChange={(e) => editBatch(i, "expires_at", e.target.value)}
                  />
                </label>
                <label>
                  <span>Quantity for this expiry</span>
                  <input
                    type="number" min="0"
                    value={row.qty}
                    onChange={(e) => editBatch(i, "qty", Math.max(0, Number(e.target.value)))}
                  />
                </label>
                <div style={{ display:"grid", alignContent:"end" }}>
                  <button type="button" className="btn" onClick={() => removeBatchRow(i)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <button type="button" className="btn" onClick={addBatchRow}>+ Add another expiry</button>
          </div>
        </div>


        <label style={{ gridColumn: "1/-1" }}>
          <span>Location</span>
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
        </label>

        <label style={{ gridColumn: "1/-1" }}>
          <span>Description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>

        <label>
          <span>Image</span>
          <input key={fileKey} type="file" accept="image/*" onChange={onPickFile} />
        </label>
        <div className="thumb-preview-wrap">
          <div className="thumb thumb--xl">
            {preview ? <img src={preview} alt="preview" /> : <span className="muted">No image</span>}
          </div>
        </div>
      </div>

      {error && <div className="muted" style={{ color: "#b91c1c", marginTop: 8 }}>{error}</div>}
    </Modal>
  );
}
