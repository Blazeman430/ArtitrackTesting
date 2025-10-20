import React from "react";
import { useNavigate } from "react-router-dom";
import "./css/custodian.css";
import { AddItemModal } from "../components/modals/AddItemModal";
import {Items} from "../services/items";  
import { useAsync, useAborter } from "../lib/async";
import { AuditReviewModal } from "../components/modals/AuditReviewModal";
import ProfileMenu from "./ProfileMenu";
import { searchItems } from "../services/items";
import {Inventories} from "../services/inventories";

/** Mock data (grouped by department) */
const DEPTS = ["HTM", "PE", "SCI", "ICT"];

/** seed audits per department (added ids + sample "Submitted" to demo reviewing) */
const AUDITS_SEED = [
  { id: "HTM-2025-08", dept: "HTM", date: "2025-09-05", status: "Submitted", submittedBy: "HTM Faci", summary: { counted: 118, system: 120, mismatches: 2 }, note: "2 glasses missing; probably broken during demo." },
  { id: "SCI-2025-08", dept: "SCI", date: "2025-09-08", status: "In progress" },
  { id: "PE-2025-08",  dept: "PE",  date: "2025-09-10", status: "Completed" },
  { id: "ICT-2025-09", dept: "ICT", date: "2025-09-12", status: "Scheduled" },
];

export const fmtYMD = (d) => (d ? String(d).slice(0, 10) : "—");

export function CustodianDashboard() {
  const nav = useNavigate();
 /** Inventory rows kept in state so "Add Item" can push to UI */
  const [rows, setRows] = React.useState([]);
  const [navCollapsed, setNavCollapsed] = React.useState(false);
  const [section, setSection] = React.useState("dashboard"); // dashboard | inventory | audits
  const [selectedDept, setSelectedDept] = React.useState("HTM");
  const [openAdd, setOpenAdd] = React.useState(false);
  const [inventories, setInventories] = React.useState([]);
  const [currentInvId, setCurrentInvId] = React.useState(null);
  const aborter = useAborter();
  const { loading: savingAdd, run: runAdd } = useAsync(); 
  const { run: runList } = useAsync();

  React.useEffect(() => {
    let ac = new AbortController();
    (async () => {
      try {
        const invs = await Inventories.list({ dept: selectedDept }, ac.signal);
        setInventories(invs);
        setCurrentInvId(prev =>
          invs.some(i => i.id === prev) ? prev : (invs[0]?.id ?? null)
        );
      } catch {
        setInventories([]); setCurrentInvId(null);
      }
    })();
    return () => ac.abort();
  }, [selectedDept]);


  const reloadInventory = React.useCallback(() => runList(async () => {
    const data = await Items.list({ 
      dept: selectedDept, 
      inventoryId: currentInvId,
      attachOnly: true}, 
      aborter());
    setRows(data);
  }), [selectedDept, currentInvId, runList, aborter]);

  React.useEffect(() => { reloadInventory(); }, [reloadInventory]);
  React.useEffect(() => {
    setRows([]);               // prevent stale/global bleed-over
  }, [selectedDept, currentInvId]);


  /** Derived: inventory grouped by department */
  const inventoryByDept = React.useMemo(() => {
    const map = Object.fromEntries(DEPTS.map(d => [d, []]));
    rows.forEach(r => { if (!map[r.dept]) map[r.dept] = []; map[r.dept].push(r); });
    return map;
  }, [rows]);

  // --- search ---
  // Search + inline edit
  const [q, setQ] = React.useState("");
  const [editMode, setEditMode] = React.useState(false);
  const [edits, setEdits] = React.useState({}); // { [id]: { name, qty, min, location, description } }

  // Derived: token-filtered list for selected dept
  const filteredRows = React.useMemo(() => {
    const list = inventoryByDept[selectedDept] || [];
    const t = q.trim().toLowerCase();
    if (!t) return list;
    const tokens = t.split(/\s+/);
    return list.filter(r => {
      const hay = `${r.name||""} ${r.sku||""} ${r.location||""} ${r.description||""}`.toLowerCase();
      return tokens.every(tok => hay.includes(tok));
    });
  }, [inventoryByDept, selectedDept, q]);

  function beginEdit() {
    const seed = {};
    (inventoryByDept[selectedDept] || []).forEach(r => {
      seed[r.id] = {
        name: r.name, qty: r.qty, min: r.min,
        location: r.location, description: r.description
      };
    });
    setEdits(seed);
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
    setEdits({});
  }

  async function saveEdit() {
    const list = inventoryByDept[selectedDept] || [];
    for (const r of list) {
      const d = edits[r.id];
      if (!d) continue;
      const changed =
        d.name !== r.name ||
        Number(d.qty) !== Number(r.qty) ||
        Number(d.min) !== Number(r.min) ||
        d.location !== r.location ||
        d.description !== r.description;

      if (!changed) continue;

      try {
        const upd = await Items.update(
          r.id,
          {
            name: d.name,
            qty: Number(d.qty),
            min: Number(d.min),
            location: d.location,
            description: d.description,
          },
          selectedDept,
          currentInvId,
          aborter()
        );
        setRows(prev => prev.map(x => (x.id === r.id ? { ...x, ...upd, qty: upd.qty } : x)));
      } catch (e) {
        alert(e?.message || "Update failed");
      }
    }
    setEditMode(false);
    setEdits({});
  }

  async function handleAddItemConfirm(form) {
  await runAdd(async () => {
    const tmpKey = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic = {
      _key: tmpKey,
      __tmp: true,
      dept: selectedDept,
      sku: form.sku || "",
      name: form.name,
      qty: Number(form.qty ?? 0),
      location: form.location || "",
      imageUrl: form.image ? URL.createObjectURL(form.image) : null, 
    };
    setRows(prev => [optimistic, ...prev]);

    try {
      const saved = await Items.create(form, selectedDept, currentInvId, aborter());

      setRows(prev => {
        const withoutTmp = prev.filter(x => x._key !== tmpKey);

        const ix = withoutTmp.findIndex(
          x => (saved.id && x.id === saved.id) || (saved.sku && x.sku === saved.sku)
        );

        if (ix !== -1) {
          const copy = [...withoutTmp];
          copy[ix] = {
            ...copy[ix],
            ...saved,
            qty: Number(saved.qty ?? saved.on_hand ?? copy[ix].qty ?? 0),
            imageUrl: saved.imageUrl ?? copy[ix].imageUrl ?? null,
          };
          return copy;
        }

        return [
          {
            ...saved,
            qty: Number(saved.qty ?? saved.on_hand ?? optimistic.qty),
            imageUrl: saved.imageUrl ?? optimistic.imageUrl ?? null,
          },
          ...withoutTmp,
        ];
      });
    } catch (e) {
      setRows(prev => prev.filter(x => x._key !== tmpKey));
      alert(e.message || "Failed to save item");
    } finally {
      setOpenAdd(false);
    }
  });
}

  /** KPIS (mock) */
  const KPIS = [
    { title: "Total Items (All Depts)", value: 1420 },
    { title: "Low Stock", value: 28 },
    { title: "Incidents", value: 11 },
    { title: "Audits This Month", value: 6 },
  ];

  /** Keep audits per department in state so scheduling / acknowledgement updates the UI */
  const [auditsByDept, setAuditsByDept] = React.useState(() => {
    const map = Object.fromEntries(DEPTS.map(d => [d, []]));
    AUDITS_SEED.forEach(a => { if (!map[a.dept]) map[a.dept] = []; map[a.dept].push(a); });
    return map;
  });

  /*notifications store (per dept) for outbound notices */
  const [notificationsByDept, setNotificationsByDept] = React.useState(() =>
    Object.fromEntries(DEPTS.map(d => [d, []]))
  );

  /*scheduler */
  const [newAuditDate, setNewAuditDate] = React.useState("");
  function scheduleAudit() {
    if (!newAuditDate) return;
    const id = `${selectedDept}-${newAuditDate}`;
    setAuditsByDept(prev => ({
      ...prev,
      [selectedDept]: [
        ...(prev[selectedDept] || []),
        { id, dept: selectedDept, date: newAuditDate, status: "Scheduled" }
      ],
    }));
    setNewAuditDate("");
  }

  /*review modal state */
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [reviewAudit, setReviewAudit] = React.useState(null);
  function openReview(audit) {
    setReviewAudit(audit);
    setReviewOpen(true);
  }

  function closeReview() {
    setReviewOpen(false);
    setReviewAudit(null);
  }

  /*acknowledge + notify */
  function addNotification(dept, message) {
    setNotificationsByDept(prev => ({
      ...prev,
      [dept]: [
        { id: `n${Date.now()}`, date: new Date().toISOString().slice(0,10), message },
        ...prev[dept],
      ].slice(0, 20) 
    }));
  }

  function acknowledgeAudit(audit) {
    setAuditsByDept(prev => {
      const next = { ...prev };
      next[audit.dept] = (next[audit.dept] || []).map(a =>
        a.id === audit.id ? { ...a, status: "Acknowledged", ackBy: "Custodian", ackDate: new Date().toISOString().slice(0,10) } : a
      );
      return next;
    });
    addNotification(audit.dept, `Audit ${audit.id} acknowledged by Custodian. Records match / accepted.`);
    closeReview();
  }

  function requestRevision(audit, reason) {
    setAuditsByDept(prev => {
      const next = { ...prev };
      next[audit.dept] = (next[audit.dept] || []).map(a =>
        a.id === audit.id ? { ...a, status: "Needs Revision", revisionReason: reason || "Please update discrepancies" } : a
      );
      return next;
    });
    addNotification(audit.dept, `Audit ${audit.id} requires revision: ${reason || "Please update discrepancies."}`);
    closeReview();
  }

  function MiniTable({ cols, rows, empty }) {
    return (
      <div className="table-wrap">
        <table className="table">
          <thead><tr>{cols.map(c => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {rows.length ? rows.map((r,i)=>(
              <tr key={i}>{r.map((cell,j)=><td key={j}>{cell}</td>)}</tr>
            )) : <tr><td className="muted" colSpan={cols.length}>{empty}</td></tr>}
          </tbody>
        </table>
      </div>
    );
  }

  function DeptSwitcher({ value, onChange }) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select department"
        style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #e5e7eb" }}
      >
        {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
    );
  }

  function handleLogout() {
    localStorage.removeItem("arti_user");
    nav("/loginpage", { replace: true });
  }

  return (
    <div className={`cust-root ${navCollapsed ? "nav--collapsed" : ""}`}>
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand">ARTiTRACK — Property Custodian</div>
      </div>
      <div className="top-actions">
        <ProfileMenu onLogout={handleLogout} />
      </div>
    </header>

      {/* Side-nav shell */}
      <div className="layout layout--withnav">
        <nav className="sidenav" aria-label="Section navigation">
          <div className="sidenav__group">
            <button
                className="btn btn--ghost nav-toggle"
                type="button"
                aria-label="Toggle sidebar"
                aria-pressed={navCollapsed}
                onClick={() => setNavCollapsed(v => !v)}
                title={navCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                {/* simple icon that flips */}
                {navCollapsed ? "»" : "«"}
            </button>
            <button
              className={`sidenav__link ${section === "dashboard" ? "active" : ""}`}
              onClick={() => setSection("dashboard")}
            >
              <span className="nav-icon">🏠</span>
              <span className="nav-text">Dashboard</span>
            </button>
          </div>

          {/* Departments group */}
          <div className="sidenav__group">
            <div className="sidenav__label">Departments</div>
            {DEPTS.map((d) => (
              <button
                key={d}
                className={`sidenav__link ${selectedDept === d ? "active" : ""}`}
                onClick={() => setSelectedDept(d)}
                title={`Switch to ${d}`}
                data-short={d}               // 👈 used in collapsed mode
              >
                <span className="nav-text">{d}</span>
              </button>
            ))}
          </div>

          <div className="sidenav__group">
            <div className="sidenav__label">Modules</div>
            <button
              className={`sidenav__link ${section === "inventory" ? "active" : ""}`}
              onClick={() => setSection("inventory")}
            >
              <span className="nav-icon">📦</span>
              <span className="nav-text">Inventory (by Dept)</span>
            </button>

            <button
              className={`sidenav__link ${section === "audits" ? "active" : ""}`}
              onClick={() => setSection("audits")}
            >
              <span className="nav-icon">📝</span>
              <span className="nav-text">Audits (by Dept)</span>
            </button>
          </div>

          <button className="sidenav__link" onClick={() => setOpenAdd(true)}>
            <span className="nav-icon">➕</span>
            <span className="nav-text">Add Item (Global)</span>
          </button>

          <div className="sidenav__footer muted">
            Viewing: <strong>{selectedDept}</strong>
          </div>
        </nav>

        <main className="main">
          {/* DASHBOARD */}
          {section === "dashboard" && (
            <>
              <section className="kpis">
                {KPIS.map((k) => (
                  <div key={k.title} className="kpi">
                    <div className="kpi__title">{k.title}</div>
                    <div className="kpi__value">{k.value}</div>
                  </div>
                ))}
              </section>

              <section className="grid-2">
                <div className="panel">
                  <div className="panel__head">
                    <h3>Per-Department Inventory</h3>
                    <div className="panel__actions">
                      <button className="btn" onClick={() => setSection("inventory")}>Open Inventory</button>
                    </div>
                  </div>
                  <MiniTable
                    cols={["Dept", "SKU", "Item", "Qty"]}
                    rows={rows.slice(0, 6).map((r) => [r.dept, r.sku, r.name, r.qty])}
                    empty="No data"
                  />
                </div>

                <div className="panel">
                  <div className="panel__head">
                    <h3>Audits (All Depts)</h3>
                    <div className="panel__actions">
                      <button className="btn" onClick={() => setSection("audits")}>Open Audits</button>
                    </div>
                  </div>
                  <ul className="timeline">
                    {AUDITS_SEED.slice(0, 5).map((a, i) => (
                      <li key={`${a.dept}-${i}`}>
                        <span className={`dot ${a.status === "Completed" ? "dot--ok" : "dot--info"}`} />
                        <div>
                          <div className="timeline__title">{a.dept} Department</div>
                          <div className="muted">{a.date} • {a.status}</div>
                        </div>
                      </li>
                    ))}
                    {!AUDITS_SEED.length && <li className="muted">No audits scheduled</li>}
                  </ul>
                </div>
              </section>
            </>
          )}

          {/* INVENTORY — filtered by selectedDept */}
          {section === "inventory" && (
            <section className="panel">
              <div className="panel__head">
                <h3>{selectedDept} — Inventory</h3>
                <div className="panel__actions">
                  <DeptSwitcher value={selectedDept} onChange={setSelectedDept} />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search item / SKU / location..."
                    aria-label="Search inventory"
                    className="toolbar-search"   // 👈 use class, not inline width
                  />
                  <select
                    value={currentInvId ?? ""}
                    onChange={(e) => setCurrentInvId(Number(e.target.value) || null)}
                    className="border rounded-md px-2 py-1 text-sm"
                    aria-label="Select inventory"
                  >
                    {inventories.map(inv => (
                      <option key={inv.id} value={inv.id}>{inv.name}</option>
                    ))}
                    {!inventories.length && <option value="">No inventories</option>}
                  </select>
                  <button className="btn" onClick={() => setOpenAdd(true)}>Add Item</button>
                  {!editMode ? (
                    <button className="btn" onClick={beginEdit}>Edit</button>
                  ) : (
                    <>
                      <button className="btn" onClick={cancelEdit}>Cancel</button>
                      <button className="btn btn--primary" onClick={saveEdit}>Save</button>
                    </>
                  )}
                </div>
              </div>

              <div className="table-wrap">
                  <table className="table">
                    <colgroup>
                      <col className="col-image" />
                      <col className="col-sku" />
                      <col className="col-item" />
                      <col className="col-num" />
                      <col className="col-num" />
                      <col className="col-act" />
                    </colgroup>

                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>SKU</th>
                        <th>Item</th>
                        <th>On hand</th>
                        <th>Min</th>
                        <th>Low Stock</th>
                        <th>Location</th>
                        <th>Description</th>
                        <th>Available</th>
                        <th>Borrowed</th>
                        <th>Expiration Dates</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRows.map((r) => {
                        const d = edits[r.id] || {};
                        const exp = Array.isArray(r.expirations) && r.expirations.length
                          ? r.expirations.map(e => `${fmtYMD(e.date)} (${e.qty})`).join(", ")
                          : "—";

                        return (
                          <tr key={r.id}>
                            {/* Image */}
                            <td className="col-image">
                              {r.imageUrl ? (
                                <img
                                  src={r.imageUrl}
                                  alt=""
                                  className="cell-thumb"
                                  onError={(ev) => { ev.currentTarget.style.visibility = "hidden"; }}
                                />
                              ) : <div className="cell-thumb" />}
                            </td>

                            {/* SKU (also mirrored inside Item meta on small screens) */}
                            <td className="col-sku">{r.sku}</td>

                            {/* Item (now includes a responsive meta line that re-surfaces hidden columns) */}
                            <td className="col-item">
                              {!editMode ? r.name : (
                                <input
                                  value={d.name ?? r.name}
                                  onChange={(e) => setEdits(p => ({ ...p, [r.id]: { ...p[r.id], name: e.target.value } }))}
                                />
                              )}
                            </td>

                            {/* On hand */}
                            <td className="col-num">
                               {r.qty}
                            </td>

                            {/* Min */}
                            <td className="col-num">
                              {!editMode ? r.min : (
                                <input
                                  type="number" min={0}
                                  value={d.min ?? r.min}
                                  onChange={(e) => setEdits(p => ({ ...p, [r.id]: { ...p[r.id], min: e.target.value } }))}
                                  style={{ width: 80, textAlign: "right" }}
                                />
                              )}
                            </td>

                            {/* Low stock */}
                            <td>
                              <span className={(r.low_stock ?? r.low) ? "pill pill--danger" : "pill pill--ok"}>
                                {(r.low_stock ?? r.low) ? "Yes" : "No"}
                              </span>
                            </td>

                            {/* Location (also mirrored in Item meta) */}
                            <td>
                              {!editMode ? <span className="td-loc">{r.location}</span> : (
                                <input
                                  value={d.location ?? r.location}
                                  onChange={(e) => setEdits(p => ({ ...p, [r.id]: { ...p[r.id], location: e.target.value } }))}
                                />
                              )}
                            </td>

                            {/* Description */}
                            <td className="cell--wrap">
                              {!editMode ? <span className="td-desc">{r.description || "—"}</span> : (
                                <input
                                  value={d.description ?? r.description ?? ""}
                                  onChange={(e) => setEdits(p => ({ ...p, [r.id]: { ...p[r.id], description: e.target.value } }))}
                                />
                              )}
                            </td>

                            {/* Available / Borrowed (also mirrored in Item meta) */}
                            <td className="col-num">{r.available ?? "—"}</td>
                            <td className="col-num">{r.borrowed ?? "—"}</td>

                            {/* Expirations (also mirrored in Item meta) */}
                            <td className="col-date">{exp}</td>
                          </tr>
                        );
                      })}

                      {!filteredRows.length && (
                        <tr><td className="muted" colSpan={11}>No items</td></tr>
                      )}
                    </tbody>
                  </table>
              </div>
            </section>
          )}

          {/* AUDITS — per department with scheduler + review/acknowledge + notify */}
          {section === "audits" && (
            <>
              <section className="panel">
                <div className="panel__head">
                  <h3>{selectedDept} — Audits</h3>
                  <div className="panel__actions">
                    <DeptSwitcher value={selectedDept} onChange={setSelectedDept} />

                    {/* same searchbar pattern as Inventory Items */}
                    <div className="searchbar" role="search">
                      <span className="icon">🔎</span>
                      <input
                        type="search"
                        placeholder="Search SKU, name, category, location…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        aria-label="Search items"
                      />
                      {q && (
                        <button
                          type="button"
                          className="clear"
                          onClick={() => setQ("")}
                          title="Clear search"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <button className="btn" onClick={() => setOpenAdd(true)}>Add Item</button>
                    {!editMode ? (
                      <button className="btn" onClick={beginEdit}>Edit</button>
                    ) : (
                      <>
                        <button className="btn" onClick={cancelEdit}>Cancel</button>
                        <button className="btn btn--primary" onClick={saveEdit}>Save</button>
                      </>
                    )}
                  </div>
                </div>

                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Submitted By</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(auditsByDept[selectedDept] || []).map((a) => (
                        <tr key={a.id || `${a.dept}-${a.date}`}>
                          <td className="mono">{a.id || "—"}</td>
                          <td>{a.date}</td>
                          <td>
                            <span className={`pill ${
                              a.status === "Acknowledged" ? "pill--ok" :
                              a.status === "Needs Revision" ? "pill--danger" :
                              a.status === "Completed" ? "pill--ok" :
                              "pill--warn"
                            }`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="muted">{a.submittedBy || "—"}</td>
                          <td style={{ textAlign:"right" }}>
                            {a.status === "Submitted" ? (
                              <button className="btn" onClick={() => openReview(a)}>Review</button>
                            ) : (
                              <button className="btn" onClick={() => openReview(a)}>View</button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {!auditsByDept[selectedDept]?.length && (
                        <tr><td className="muted" colSpan={5}>No audits</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/*notifications for dept */}
              <section className="panel">
                <div className="panel__head"><h3>{selectedDept} — Notifications (recent)</h3></div>
                <ul className="timeline">
                  {(notificationsByDept[selectedDept] || []).slice(0,8).map(n => (
                    <li key={n.id}>
                      <span className="dot dot--info" />
                      <div>
                        <div className="timeline__title">{n.date}</div>
                        <div className="muted">{n.message}</div>
                      </div>
                    </li>
                  ))}
                  {!notificationsByDept[selectedDept]?.length && <li className="muted">No notifications sent yet</li>}
                </ul>
              </section>

              <AuditReviewModal
                open={reviewOpen}
                audit={reviewAudit}
                onClose={closeReview}
                onAcknowledge={acknowledgeAudit}
                onRequestRevision={requestRevision}
              />
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <AddItemModal
        open={openAdd}
        defaultDept={selectedDept}
        inventoryId={null}          // ← search across ALL inventories
        attachOnly={false}          // ← don’t restrict to attached items
        onSearchItems={(q, dept, _invId, _attachOnly, signal) =>
          searchItems(q, dept, null, false, signal) } // ← force wide scope
        onClose={() => setOpenAdd(false)}
        onConfirm={async (form) => {
          try {
            await Items.create(form, selectedDept, currentInvId);
            await reloadInventory();
            setOpenAdd(false);
          } catch (e) {
            alert(e?.message || "Create failed");
          }
        }} 
      />
    </div>
  );
}




