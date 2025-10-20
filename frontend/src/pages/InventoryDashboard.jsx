//inventorydashboard.jsx
import React from "react";
import "./css/inventory.css";
import { useNavigate } from "react-router-dom";
import { AddItemModal } from "../components/modals/AddItemModal";
import { DeleteItemsModal } from "../components/modals/DeleteItemsModal";
import { IncidentModal } from "../components/modals/IncidentModal";
import { AuditTemplateModal } from "../components/modals/AuditTemplateModal";
import { DeclineReasonModal } from "../components/modals/DeclineReasonModal";
import { RequestBorrowModal } from "../components/modals/RequestBorrowModal";
import { NewInventoryModal } from "../components/modals/NewInventoryModal";
import { DeleteInventoryModal } from "../components/modals/DeleteInventoryModal";
import { Items } from "../services/items";
import { Inventories } from "../services/inventories"
import ProfileMenu from "./ProfileMenu";
import { Loans } from "../services/loans";

export const fmtYMD = (d) => (d ? String(d).slice(0, 10) : "—");

export default function InventoryDashboard({ dept = [{}], data = {} }) {
  const nav = useNavigate();

  const deptCode = React.useMemo(() => {
    if (typeof dept === "string" && dept.trim()) return dept.trim();
    if (dept && typeof dept === "object") return (dept.code || dept.name || "HTM").toString().trim();
    return "HTM";
  }, [dept]);

  const [invState, setInvState]   = React.useState([]);
  const [invLoading, setInvLoading] = React.useState(false);
  const [invError, setInvError]     = React.useState("");

  React.useEffect(() => {
    let abort = new AbortController();
    async function loadInventories() {
      setInvLoading(true); setInvError("");
      try {
        const list = await Inventories.list({ dept: deptCode }, abort.signal);
        setInvState(list.length ? list : [{
          id: "main", key: "main",
          name: `${deptCode} Main`,
          kpis: { totalItems:0, borrowedNow:0, lowStock:0, incidentsOpen:0, upcomingAudits:0 },
          inventory: [], lowStockRows: [], incidents: [], audits: [],
          historyDates: [], recentBorrow: [], borrowHistory: [], concerns: [],
        }]);
      } catch (e) {
        setInvError(e?.message || "Failed to load inventories");
        setInvState([{
          id: "main", key: "main",
          name: `${deptCode} Main`,
          kpis: { totalItems:0, borrowedNow:0, lowStock:0, incidentsOpen:0, upcomingAudits:0 },
          inventory: [], lowStockRows: [], incidents: [], audits: [],
          historyDates: [], recentBorrow: [], borrowHistory: [], concerns: [],
        }]);
      } finally {
        setInvLoading(false);
      }
    }
    loadInventories();
    return () => abort.abort();
  }, [deptCode]);

  const [activeInvKey, setActiveInvKey] = React.useState("");
  const currentInv = React.useMemo(
    () => invState.find(i => i.key === activeInvKey) || invState[0],
    [invState, activeInvKey]
  );
  const currentInvId = currentInv?.id ?? null;
  
  

  React.useEffect(() => {
    if (invState.length) {
      const hasActive = invState.some(i => i.key === activeInvKey);
      setActiveInvKey(hasActive ? activeInvKey : invState[0].key);
    }
  }, [invState]);

  // Collapsible side-nav groups
  const MODULE_GROUPS = [
    {
      id: "borrowers",
      title: "Borrowers",
      items: [
        ["recent", "Borrowing Activities"],
        ["history", "Borrow History"],
        ["concerns", "Concerns & Suggestions"],
      ],
    },
    {
      id: "reports",
      title: "Reports",
      items: [
        ["incidents", "Incidents"],
        ["disposal", "Disposal Report"],
        ["audits", "Audits"],
      ],
    },
  ];

  // persist dropdown open/closed state per user
  const [openGroups, setOpenGroups] = React.useState(() => {
    const saved = localStorage.getItem("inv_open_groups");
    if (saved) return JSON.parse(saved);
    return Object.fromEntries(MODULE_GROUPS.map((g) => [g.id, true]));
  });
  const toggleGroup = (id) =>
    setOpenGroups((s) => {
      const next = { ...s, [id]: !s[id] };
      localStorage.setItem("inv_open_groups", JSON.stringify(next));
      return next;
    });
  
  const [activeModule, setActiveModule] = React.useState("dashboard"); // dashboard | items | low | recent | incidents | audits | history | concerns

  // NEW: table density toggle (compact/cozy)
  const [density, setDensity] = React.useState(
    localStorage.getItem("inv_density") || "cozy"
  );
  function toggleDensity() {
    const next = density === "cozy" ? "compact" : "cozy";
    setDensity(next);
    localStorage.setItem("inv_density", next);
  }

  // selected item for borrow modal + current user (optional)
  const [selectedItem, setSelectedItem] = React.useState(null);
  const currentUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("arti_user") || "{}");
    } catch {
      return {};
    }
  }, []);

  React.useEffect(() => {
    const hasActive = invState.some((i) => i.key === activeInvKey);
    if (!hasActive) {
      setActiveInvKey(invState[0]?.key || "main");
      setActiveModule("dashboard");
    }
  }, [invState, activeInvKey]);

  const current =
    invState.find((i) => i.key === activeInvKey) ||
    invState[0] || {
      name: `${dept} Main`,
      kpis: {
        totalItems: 0,
        borrowedNow: 0,
        lowStock: 0,
        incidentsOpen: 0,
        upcomingAudits: 0,
      },
      inventory: [],
      lowStockRows: [],
      incidents: [],
      audits: [],
      historyDates: [],
      recentBorrow: [],
      borrowHistory: [],
      concerns: [],
    };

  // Modal states
  const [openAdd, setOpenAdd] = React.useState(false);
  const [openDel, setOpenDel] = React.useState(false);
  const [openIncident, setOpenIncident] = React.useState(false);
  const [openAudit, setOpenAudit] = React.useState(false);
  const [openDecline, setOpenDecline] = React.useState(false);
  const [declineRow, setDeclineRow] = React.useState(null);
  const [openRequest, setOpenRequest] = React.useState(false);
  const [openMenu, setOpenMenu] = React.useState(false);

  // Inventory CRUD
  const [openNewInv, setOpenNewInv] = React.useState(false);
  const [openDelInv, setOpenDelInv] = React.useState(false);
  const [toDeleteInv, setToDeleteInv] = React.useState(null);
  const [confirmName, setConfirmName] = React.useState("");

  // Live items for the currently selected department
  const [items, setItems] = React.useState([]);
  const [itemsLoading, setItemsLoading] = React.useState(false);
  const [itemsError, setItemsError] = React.useState("");

  // Search (items tab)
  const [itemQuery, setItemQuery] = React.useState("");
  const norm = (s) => (s || "").toString().toLowerCase();

  // Inline edit mode
  const [editMode, setEditMode] = React.useState(false);

  // Row drafts: { [id]: { ...partial fields being edited... } }
  const [drafts, setDrafts] = React.useState({});

  // Borrowing data (custodian view)
  const [borrowQueue, setBorrowQueue] = React.useState([]);     // pending for current inventory
  const [borrowQueueLoading, setBorrowQueueLoading] = React.useState(false);
  const [borrowHistory, setBorrowHistory] = React.useState([]); // dept-wide history
  const [borrowHistoryLoading, setBorrowHistoryLoading] = React.useState(false);

  function toQueueRows(paginated) {
    const list = Array.isArray(paginated?.data) ? paginated.data : (Array.isArray(paginated) ? paginated : []);
    // Flatten loan -> lines for display
    return list.flatMap(loan =>
      (loan.lines || []).map(line => ({
        loanId: loan.id,
        lineId: line.id,
        who: loan.borrower_name,
        item: line?.inventory_item?.item?.name || `Item#${line.inventory_item_id}`,
        qty: line.qty,
        status: loan.status,
        date: loan.requested_at || loan.created_at,
      }))
    );
  }

  function toHistoryRows(paginated) {
    const list = Array.isArray(paginated?.data) ? paginated.data : (Array.isArray(paginated) ? paginated : []);
    return list.flatMap(loan =>
      (loan.lines || []).map(line => ({
        loanId: loan.id,
        lineId: line.id,
        who: loan.borrower_name,
        item: line?.inventory_item?.item?.name || `Item#${line.inventory_item_id}`,
        qty: line.qty,
        status: loan.status,
        date: loan.returned_at || loan.issued_at || loan.approved_at || loan.requested_at || loan.created_at,
      }))
    );
  }

  React.useEffect(() => {
    let ac = new AbortController();
    async function loadQueue() {
      if (!currentInvId) { setBorrowQueue([]); return; }
      setBorrowQueueLoading(true);
      try {
        const res = await Loans.list({ inventory_id: currentInvId, status: "pending", page: 1, per_page: 50 }, ac.signal);
        setBorrowQueue(toQueueRows(res));
      } catch (e) {
        setBorrowQueue([]);
        console.warn("Queue load failed", e);
      } finally {
        setBorrowQueueLoading(false);
      }
    }
    loadQueue();
    return () => ac.abort();
  }, [currentInvId]);

  React.useEffect(() => {
    let ac = new AbortController();
    async function loadHist() {
      setBorrowHistoryLoading(true);
      try {
        const res = await Loans.history({ dept: deptCode, page: 1, per_page: 50 }, ac.signal);
        setBorrowHistory(toHistoryRows(res));
      } catch (e) {
        setBorrowHistory([]);
        console.warn("History load failed", e);
      } finally {
        setBorrowHistoryLoading(false);
      }
    }
    loadHist();
    return () => ac.abort();
  }, [deptCode]);



  // merge any draft into a base row (used for rendering & searching)
  function withDraft(row) {
    return drafts[row.id] ? { ...row, ...drafts[row.id] } : row;
  }

  // update a single field in a row's draft
  function editField(id, field, value) {
    setDrafts((d) => ({ ...d, [id]: { ...(d[id] || {}), [field]: value } }));
  }

  // discard a row's draft
  function discardRow(id) {
    setDrafts((d) => {
      const n = { ...d };
      delete n[id];
      return n;
    });
  }

  // save a row (call API then refresh list)
  async function saveRow(id) {
    const row = items.find((x) => x.id === id);
    const draft = drafts[id] || {};
    if (!row) return;

    const payload = {
      id,
      name: draft.name ?? row.name,
      category: draft.category ?? row.category,
      qty: draft.qty ?? row.qty,
      min: draft.min ?? row.min,
      location: draft.location ?? row.location,
      description: draft.description ?? row.description,
      image: draft.image,
    };

    try {
      await Items.update(id, payload, deptCode, currentInvId);
      await loadItems(deptCode);
      discardRow(id);
    } catch (e) {
      alert(e?.message || "Update failed");
    }
  }

  const filteredItems = React.useMemo(() => {
    const q = norm(itemQuery);
    const source = items.map(withDraft); // <- include draft values
    if (!q) return source;
    return source.filter((r) =>
      [r.sku, r.name, r.category, r.location, r.description]
        .some((v) => norm(v).includes(q))
    );
  }, [items, drafts, itemQuery]);

  const [deleting, setDeleting] = React.useState(false);

  async function handleDeleteItemsConfirm(ids) {
    try {
      setDeleting(true);
      await Items.removeMany(ids);
      await loadItems(deptCode);
      setOpenDel(false);
    } catch (e) {
      alert(e?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const [histSearch, setHistSearch] = React.useState("");
  const [selectedBorrower, setSelectedBorrower] = React.useState("");
  const [openUserHist, setOpenUserHist] = React.useState(false);

  const [requestStatus, setRequestStatus] = React.useState({});

  
  

  async function loadItems(code) {
    setItemsLoading(true);
    setItemsError("");
    try {
      const data = await Items.list({ dept: code, inventoryId: currentInvId });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setItems([]);
      setItemsError(e?.message || "Failed to load items");
    } finally {
      setItemsLoading(false);
    }
  }

  // Refresh when dept OR active inventory changes
  React.useEffect(() => {
    loadItems(deptCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptCode, currentInvId]);


  function handleLogout() {
    localStorage.removeItem("arti_user");
    nav("/loginpage", { replace: true });
  }

  const k =
    current.kpis || {
      totalItems: 0,
      borrowedNow: 0,
      lowStock: 0,
      incidentsOpen: 0,
      upcomingAudits: 0,
    };

  const statusKey = (invKey, index) => `${invKey}:${index}`;
  function approveRequest(invKey, index) {
    setRequestStatus((s) => ({ ...s, [statusKey(invKey, index)]: "approved" }));
  }
  function askDecline(invKey, index, row) {
    setDeclineRow({ invKey, index, row });
    setOpenDecline(true);
  }
  function handleDeclineModalClose() {
    if (declineRow) {
      const { invKey, index } = declineRow;
      setRequestStatus((s) => ({ ...s, [statusKey(invKey, index)]: "declined" }));
    }
    setOpenDecline(false);
    setDeclineRow(null);
  }

  const historySource = borrowHistory;

  const borrowerNames = React.useMemo(
    () =>
      Array.from(new Set((historySource || []).map((r) => r.who).filter(Boolean))).sort(),
    [historySource]
  );

  const filteredHistory = (historySource || []).filter((r) => {
    if (selectedBorrower) return r.who === selectedBorrower;
    if (!histSearch.trim()) return true;
    const q = histSearch.toLowerCase();
    return (
      (r.who || "").toLowerCase().includes(q) ||
      (r.item || r.items || "").toLowerCase().includes(q) ||
      (r.status || "").toLowerCase().includes(q)
    );
  });

  function allInventoriesHistoryFor(name) {
    return invState
      .flatMap((inv) => {
        const src = inv.borrowHistory?.length ? inv.borrowHistory : inv.recentBorrow || [];
        return (src || [])
          .filter((h) => h.who === name)
          .map((h) => ({ ...h, _inv: inv.name }));
      })
      .sort((a, b) => (a.date > b.date ? -1 : 1));
  }

  function openDeleteInv(inv) {
    setToDeleteInv(inv);
    setConfirmName("");
    setOpenDelInv(true);
  }
  async function handleConfirmDelete() {
    if (!toDeleteInv) return;
     try {
      if (toDeleteInv.id && toDeleteInv.id !== "main") {
        await Inventories.remove(toDeleteInv.id);
      }
      const next = invState.filter((i) => i.key !== toDeleteInv.key);
      setInvState(next);
      
      if (activeInvKey === toDeleteInv.key) {
        setActiveInvKey(next[0]?.key || "");
        setActiveModule("dashboard");
      }

      } catch (e) {
        alert(e?.message || "Delete failed");
        return;
      }
    
    setOpenDelInv(false);
    setToDeleteInv(null);
    setConfirmName("");
  }

   async function handleAddInventory(name) {
    try {
      const saved = await Inventories.create({ dept: deptCode, name });
      setInvState(prev => [...prev, saved]);
      setActiveInvKey(saved.key);
      setActiveModule("dashboard");
    } catch (e) {
      alert(e?.message || "Create failed");
    }
  }

  function getLatestAck(audits) {
    if (!Array.isArray(audits)) return null;
    const acked = audits
      .filter((a) => a?.ack?.at)
      .sort((a, b) => (a.ack.at > b.ack.at ? -1 : 1));
    return acked[0] || null;
  }
  const latestAck = getLatestAck(current.audits);

  // keyboard helpers for dropdown buttons
  function onDropdownKeyDown(e, id) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleGroup(id);
    }
  }

  async function onApprove(loanId) {
    try {
      await Loans.approve(loanId);
      // Optionally issue immediately:
      // await Loans.issue(loanId);
    } catch (e) {
      alert(e?.message || "Approve failed");
    } finally {
      // refresh both queue & history to reflect status changes
      await Promise.all([reloadQueue(), reloadHistory()]);
    }
  }

  async function onDecline(loanId) {
    const reason = window.prompt("Reason for declining?");
    if (!reason) return;
    try {
      await Loans.decline(loanId, reason);
    } catch (e) {
      alert(e?.message || "Decline failed");
    } finally {
      await Promise.all([reloadQueue(), reloadHistory()]);
    }
  }

  async function onIssue(loanId) {
    try {
      await Loans.issue(loanId);
    } catch (e) {
      alert(e?.message || "Issue failed");
    } finally {
      await Promise.all([reloadQueue(), reloadHistory(), loadItems(deptCode)]);
    }
  }

  async function onReturnAll(loanId) {
    try {
      await Loans.returnAll(loanId);
    } catch (e) {
      alert(e?.message || "Return failed");
    } finally {
      await Promise.all([reloadQueue(), reloadHistory(), loadItems(deptCode)]);
    }
  }

  // small wrappers to reuse in finally{}
  async function reloadQueue() {
    try {
      const res = await Loans.list({ inventory_id: currentInvId, status: "pending", page: 1, per_page: 50 });
      setBorrowQueue(toQueueRows(res));
    } catch {}
  }
  async function reloadHistory() {
    try {
      const res = await Loans.history({ dept: deptCode, page: 1, per_page: 50 });
      setBorrowHistory(toHistoryRows(res));
    } catch {}
  }

  return (
    <div className="inv-root" data-density={density}>
      <header className="topbar">
        <div className="brand">STI College Muñoz-EDSA {dept} Inventory</div>
        <div className="top-actions">
          <div className="dropdown">
            <button
              className="btn btn--primary"
              onClick={() => setOpenMenu((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={openMenu ? "true" : "false"}
            >
              + New
            </button>
            {openMenu && (
              <div className="dropdown-menu" role="menu">
                <button role="menuitem" onClick={() => { setOpenIncident(true); setOpenMenu(false); }}>⚠️ Incident Report</button>
                <button
                  role="menuitem"
                  onClick={() => {
                    const first = current.inventory?.[0];
                    setSelectedItem(first ? { sku: first.sku, name: first.name } : null);
                    setOpenRequest(true);
                    setOpenMenu(false);
                  }}
                >
                  📋 Borrow Request
                </button>
                <button role="menuitem" onClick={() => { setOpenAudit(true); setOpenMenu(false); }}>📝 Audit</button>
              </div>
            )}
          </div>

          {/* Density toggle */}
          <button
            className="btn"
            onClick={toggleDensity}
            title={`Switch to ${density === "cozy" ? "compact" : "cozy"} density`}
          >
            {density === "cozy" ? "⇲ Compact" : "⇱ Cozy"}
          </button>
            <ProfileMenu onLogout={handleLogout} />
        </div>
      </header>

      {/* Sidebar + Main */}
      <div className="shell">
        <aside className="side">
          <div className="side__group">
            <div className="side__eyebrow">Department</div>
            <div className="side__title">{dept}</div>
          </div>

          <div className="side__group">
            <div className="side__eyebrow">Inventories</div>
            <div className="side__list">
              {invState.map((inv) => {
                const isOnly = invState.length === 1;
                const isProtected = false;
                return (
                  <div
                    key={inv.key}
                    style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}
                  >
                    <button
                      className={`navbtn ${activeInvKey === inv.key ? "navbtn--active" : ""}`}
                      onClick={() => { setActiveInvKey(inv.key); setActiveModule("dashboard"); }}
                      aria-current={activeInvKey === inv.key ? "page" : undefined}
                    >
                      <span>{inv.name}</span>
                      <span className="chip-count" aria-label="Total items">{inv.kpis?.totalItems ?? 0}</span>
                    </button>
                    <button
                      className="btn btn--small"
                      title="Delete inventory"
                      onClick={() => openDeleteInv(inv)}
                      disabled={isOnly || isProtected}
                      aria-disabled={isOnly || isProtected}
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
              <button className="navbtn" onClick={() => setOpenNewInv(true)}>➕ New Inventory</button>
            </div>
          </div>

          <div className="side__group">
            <div className="side__eyebrow">Modules</div>

            {/* Top-level items */}
            <div className="side__list">
              <button
                className={`navbtn ${activeModule === "dashboard" ? "navbtn--active" : ""}`}
                onClick={() => setActiveModule("dashboard")}
                aria-current={activeModule === "dashboard" ? "page" : undefined}
              >
                Dashboard
              </button>
              <button
                className={`navbtn ${activeModule === "items" ? "navbtn--active" : ""}`}
                onClick={() => setActiveModule("items")}
                aria-current={activeModule === "items" ? "page" : undefined}
              >
                Items
              </button>
            </div>

            {/* Dropdown groups */}
            {MODULE_GROUPS.map((group) => (
              <div key={group.id} className="side__dropdown">
                <button
                  className="navbtn navbtn--dropdown"
                  onClick={() => toggleGroup(group.id)}
                  onKeyDown={(e) => onDropdownKeyDown(e, group.id)}
                  aria-expanded={openGroups[group.id] ? "true" : "false"}
                  aria-controls={`grp-${group.id}`}
                >
                  <span>{group.title}</span>
                  <span className={`chev ${openGroups[group.id] ? "open" : ""}`} aria-hidden>▾</span>
                </button>

                <div
                  id={`grp-${group.id}`}
                  className="side__list"
                  style={{ display: openGroups[group.id] ? "grid" : "none" }}
                >
                  {group.items.map(([key, label]) => (
                    <button
                      key={key}
                      className={`navbtn ${activeModule === key ? "navbtn--active" : ""}`}
                      onClick={() => setActiveModule(key)}
                      aria-current={activeModule === key ? "page" : undefined}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="side__group">
            <div className="side__eyebrow">Quick actions</div>
            <div className="side__list">
              <button className="navbtn" onClick={() => setOpenIncident(true)}>➕ New incident</button>
              <button className="navbtn" onClick={() => setOpenAudit(true)}>📝 Generate audit</button>
              <button
                className="navbtn"
                onClick={() => {
                  const first = current.inventory?.[0];
                  setSelectedItem(first ? { sku: first.sku, name: first.name } : null);
                  setOpenRequest(true);
                }}
              >
                📋 Borrow request
              </button>
            </div>
          </div>

          <div className="side__footer">
            Active: <strong>{current.name}</strong>
          </div>
        </aside>

        <main className="main">
          {/* KPIs */}
          <section className="kpis">
            <Kpi title="Total Items" value={k.totalItems} />
            <Kpi title="Borrowed (now)" value={k.borrowedNow} />
            <Kpi title="Low Stock" value={k.lowStock} tone="warn" />
            <Kpi title="Incidents" value={k.incidentsOpen} tone="danger" />
            <Kpi title="Upcoming Audits" value={k.upcomingAudits} />
          </section>

          {/* Acknowledgment banner */}
          {latestAck && activeModule === "dashboard" && (
            <section className="panel" style={{ borderLeft: "4px solid #16a34a" }}>
              <div className="panel__head">
                <h3 style={{ margin: 0 }}>Custodian Acknowledgment</h3>
              </div>
              <p className="muted" style={{ marginTop: 4 }}>
                <strong>{latestAck.ack.by || "Property Custodian"}</strong> acknowledged your audit
                for <strong>{dept}</strong> — <strong>{current.name}</strong> on{" "}
                <span className="mono">{latestAck.ack.at}</span>
                {latestAck.ack.note ? <> — “{latestAck.ack.note}”</> : null}
              </p>
            </section>
          )}

          {/* DASHBOARD */}
          {activeModule === "dashboard" && (
            <>
              {/* Recent Borrowing */}
              <section className="panel">
                <div className="panel__head">
                  <div>
                    <div className="eyebrow">{dept.toUpperCase()} — {current.name}</div>
                    <h3>Recent Borrowing</h3>
                  </div>
                </div>

                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Account</th><th>Item</th><th>Qty</th><th>Status</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {borrowQueueLoading && <tr><td className="muted" colSpan={5}>Loading…</td></tr>}
                      {!borrowQueueLoading && borrowQueue.map((r, i) => {
                        const isPending = r.status === "pending";
                        return (
                          <tr key={`${r.loanId}-${r.lineId}`}>
                            <td>{r.who}</td>
                            <td>{r.item}</td>
                            <td>{r.qty}</td>
                            <td>
                              <span className={`pill ${r.status === "approved" ? "pill--ok" : r.status === "pending" ? "pill--warn" : r.status === "returned" ? "pill--info" : "pill--danger"}`}>
                                {r.status}
                              </span>
                            </td>
                            <td style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                              <button className="btn btn--small" disabled={!isPending} onClick={() => onApprove(r.loanId)}>Approve</button>
                              <button className="btn btn--small" disabled={!isPending} onClick={() => onDecline(r.loanId)}>Decline</button>
                            </td>
                          </tr>
                        );
                      })}
                      {!borrowQueueLoading && !borrowQueue.length && (
                        <tr><td className="muted" colSpan={5}>No pending requests</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Incidents */}
              <section className="panel">
                <div className="panel__head">
                  <div>
                    <div className="eyebrow">{dept.toUpperCase()} — {current.name}</div>
                    <h3>Incidents</h3>
                  </div>
                </div>
                <DataTable
                  cols={["Item", "Qty", "Note", "Tag"]}
                  rows={(current.incidents || []).map((x) => [x.item, x.qty, x.remark, x.tag])}
                />
              </section>

              {/* Low Stock */}
              <section className="panel">
                <div className="panel__head">
                  <div>
                    <div className="eyebrow">{dept.toUpperCase()} — {current.name}</div>
                    <h3>Low Stock</h3>
                  </div>
                </div>
                <DataTable
                  cols={["SKU", "Item", "On hand", "Min"]}
                  rows={(current.lowStockRows || []).map((r) => [r.sku, r.name, r.onHand, r.min])}
                />
              </section>

              {/* Audits */}
              <section className="panel">
                <div className="panel__head">
                  <div>
                    <div className="eyebrow">{dept.toUpperCase()} — {current.name}</div>
                    <h3>Audit Schedule</h3>
                  </div>
                  <div className="panel__actions">
                    <button className="btn" onClick={() => setOpenAudit(true)}>Generate Audit</button>
                  </div>
                </div>
                <ul className="timeline">
                  {(current.audits || []).map((a, i) => (
                    <li key={i}>
                      <span className={`dot ${a.status === "Completed" ? "dot--ok" : "dot--info"}`} />
                      <div style={{ display: "grid", gap: 2 }}>
                        <div className="timeline__title">{dept} — {current.name}</div>
                        <div className="muted">{a.date} • {a.status}</div>
                        <div>
                          {a?.ack?.at ? (
                            <span className="pill pill--ok" title={a.ack.note || "Acknowledged"}>
                              Acknowledged by {a.ack.by || "Custodian"} • {a.ack.at}
                            </span>
                          ) : (
                            <span className="pill pill--warn">Awaiting custodian acknowledgment</span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                  {!current.audits?.length && <li className="muted">No scheduled audits</li>}
                </ul>
              </section>
            </>
          )}

          {/* ITEMS */}
          {activeModule === "items" && (
            <section className="panel">
              <div className="panel__head">
                <div>
                  <div className="eyebrow">{dept.toUpperCase()} — {current.name}</div>
                  <h3>Items</h3>
                </div>
                <div className="panel__actions" style={{ gap: 8 }}>
                  <div className="searchbar" role="search">
                    <span className="icon">🔎</span>
                    <input
                      type="search"
                      placeholder="Search SKU, name, category, location…"
                      value={itemQuery}
                      onChange={(e) => setItemQuery(e.target.value)}
                      aria-label="Search items"
                    />
                    {itemQuery && (
                      <button
                        type="button"
                        className="clear"
                        onClick={() => setItemQuery("")}
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>  
                  <button
                    className="btn"
                    onClick={() => {
                      setEditMode((v) => !v);
                      if (editMode) setDrafts({}); // leaving edit mode clears unfinished drafts
                    }}
                    title={editMode ? "Finish editing" : "Enable inline editing"}
                  >
                    {editMode ? "Done" : "Enable Editing"}
                  </button>
                  <button className="btn" onClick={() => setOpenDel(true)}>Delete Items</button>
                </div>
              </div>

              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Image</th><th>SKU</th><th>Item</th>
                      <th>On hand</th><th>Min</th><th>Low Stock</th><th>Location</th>
                      <th>Description</th><th>Available</th><th>Borrowed</th><th>Expiration Dates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsError && (
                      <tr>
                        <td colSpan={5} className="muted" style={{ background: "#fff7ed" }}>
                          Error: {itemsError}
                        </td>
                      </tr>
                    )}

                    {!itemsError && itemsLoading && (
                      <>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <tr key={`skeleton-${i}`} className="skeleton-row">
                            <td><div className="skeleton skeleton--thumb" /></td>
                            <td colSpan={4}><div className="skeleton skeleton--bar" /></td>
                          </tr>
                        ))}
                      </>
                    )}

                    {!itemsError && !itemsLoading && filteredItems.length === 0 && itemQuery && (
                      <tr>
                        <td colSpan={11} className="muted">No matches for “{itemQuery}”.</td>
                      </tr>
                    )}

                    {!itemsError && !itemsLoading && filteredItems.map((r) => {
                      const row = withDraft(r);
                      return (
                        <tr key={row.id ?? row.sku}>
                          <td>
                            {editMode ? (
                              <div style={{ display: "grid", gap: 6, justifyItems: "center" }}>
                                {row.imageUrl ? (
                                  <img
                                    src={row.imageUrl}
                                    alt=""
                                    width={44}
                                    height={44}
                                    style={{ objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }}
                                  />
                                ) : (
                                  <div style={{ width:44, height:44, borderRadius:8, background:"#f3f4f6", border:"1px solid #e5e7eb" }} />
                                )}
                                <label className="btn btn--small">
                                  Change
                                  <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) editField(row.id, "image", f);
                                    }}
                                  />
                                </label>
                              </div>
                            ) : (
                              row.imageUrl ? (
                                <img
                                  src={row.imageUrl}
                                  alt=""
                                  width={44}
                                  height={44}
                                  style={{ objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }}
                                />
                              ) : (
                                <div style={{ width:44, height:44, borderRadius:8, background:"#f3f4f6", border:"1px solid #e5e7eb" }} />
                              )
                            )}
                          </td>

                          <td className="mono">{row.sku || "—"}</td>

                          <td>
                            {editMode ? (
                              <input
                                className="cell-input"
                                value={row.name || ""}
                                onChange={(e) => editField(row.id, "name", e.target.value)}
                              />
                            ) : (
                              row.name
                            )}
                          </td>

                          <td className="mono">{row.qty || "—"}</td>

                          <td>
                            {editMode ? (
                              <input
                                type="number"
                                min="0"
                                className="cell-input cell-input--num"
                                value={row.min ?? 0}
                                onChange={(e) => editField(row.id, "min", Number(e.target.value))}
                              />
                            ) : (
                              row.min ?? 0
                            )}
                          </td>

                          <td>{(row.low_stock ?? row.low) ? "Yes" : "No"}</td>

                          <td>
                            {editMode ? (
                              <input
                                className="cell-input"
                                value={row.location || ""}
                                onChange={(e) => editField(row.id, "location", e.target.value)}
                              />
                            ) : (
                              row.location || "—"
                            )}
                          </td>

                          <td style={{ maxWidth: 300 }}>
                            {editMode ? (
                              <input
                                className="cell-input"
                                value={row.description || ""}
                                onChange={(e) => editField(row.id, "description", e.target.value)}
                              />
                            ) : (
                              <span className="muted">{row.description || "—"}</span>
                            )}
                          </td>

                          <td>{row.available ?? "—"}</td>
                          <td>{row.borrowed ?? "—"}</td>
                          <td>
                            {(row.expirations || []).map((x, i) => (
                              <span key={i} className="mono">{x.date}</span>
                            )).join ? (row.expirations || []).map(x => fmtYMD(x.date)).join(", ") : "—"}
                          </td>

                          {editMode && (
                            <td style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                              <button className="btn btn--small" onClick={() => saveRow(row.id)}>Save</button>
                              <button className="btn btn--small" onClick={() => discardRow(row.id)}>Cancel</button>
                            </td>
                          )}
                        </tr>
                      );
                    })}

                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* LOW */}
          {activeModule === "low" && (
            <section className="panel">
              <div className="panel__head"><h3>Low Stock</h3></div>
              <DataTable
                cols={["SKU", "Item", "On hand", "Min"]}
                rows={(current.lowStockRows || []).map((r) => [r.sku, r.name, r.onHand, r.min])}
              />
            </section>
          )}

          {/* RECENT */}
          {activeModule === "recent" && (
            <section className="panel">
              <div className="panel__head"><h3>Recent Activity</h3></div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Account</th><th>Item</th><th>Qty</th><th>Status</th><th></th></tr>
                  </thead>
                  <tbody>
                    {borrowQueueLoading && <tr><td className="muted" colSpan={5}>Loading…</td></tr>}
                    {!borrowQueueLoading && borrowQueue.map((r, i) => {
                      const isPending = r.status === "pending";
                      return (
                        <tr key={`${r.loanId}-${r.lineId}`}>
                          <td>{r.who}</td>
                          <td>{r.item}</td>
                          <td>{r.qty}</td>
                          <td>
                            <span className={`pill ${r.status === "approved" ? "pill--ok" : r.status === "pending" ? "pill--warn" : r.status === "returned" ? "pill--info" : "pill--danger"}`}>
                              {r.status}
                            </span>
                          </td>
                          <td style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button className="btn btn--small" disabled={!isPending} onClick={() => onApprove(r.loanId)}>Approve</button>
                            <button className="btn btn--small" disabled={!isPending} onClick={() => onDecline(r.loanId)}>Decline</button>
                          </td>
                        </tr>
                      );
                    })}
                    {!borrowQueueLoading && !borrowQueue.length && (
                      <tr><td className="muted" colSpan={5}>No pending requests</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* INCIDENTS */}
          {activeModule === "incidents" && (
            <section className="panel">
              <div className="panel__head"><h3>Incidents</h3></div>
              <DataTable
                cols={["Item", "Qty", "Note", "Tag"]}
                rows={(current.incidents || []).map((r) => [r.item, r.qty, r.remark, r.tag])}
              />
            </section>
          )}

          {/* AUDITS */}
          {activeModule === "audits" && (
            <section className="panel">
              <div className="panel__head">
                <h3>Audits</h3>
                <div className="panel__actions">
                  <button className="btn" onClick={() => setOpenAudit(true)}>Generate Audit</button>
                </div>
              </div>
              <ul className="timeline">
                {(current.audits || []).map((a, i) => (
                  <li key={i}>
                    <span className={`dot ${a.status === "Completed" ? "dot--ok" : "dot--info"}`} />
                    <div style={{ display:"grid", gap:2 }}>
                      <div className="timeline__title">{dept} — {current.name}</div>
                      <div className="muted">{a.date} • {a.status}</div>
                      <div>
                        {a?.ack?.at ? (
                          <span className="pill pill--ok" title={a.ack.note || "Acknowledged"}>
                            Acknowledged by {a.ack.by || "Custodian"} • {a.ack.at}
                          </span>
                        ) : (
                          <span className="pill pill--warn">Awaiting custodian acknowledgment</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
                {!current.audits?.length && <li className="muted">No audits</li>}
              </ul>
            </section>
          )}

          {/* BORROW HISTORY */}
          {activeModule === "history" && (
            <section className="panel">
              <div className="panel__head">
                <div>
                  <div className="eyebrow">{dept.toUpperCase()} — {current.name}</div>
                  <h3>Borrow History</h3>
                </div>
                <div className="panel__actions">
                  <button className="btn" onClick={() => { setHistSearch(""); setSelectedBorrower(""); }}>
                    Clear filters
                  </button>
                </div>
              </div>

              <div className="grid-2" style={{ marginBottom: 8 }}>
                <label>
                  <span>Search (name, item, status)</span>
                  <input
                    placeholder="e.g. Student A or 'approved'"
                    value={histSearch}
                    onChange={(e) => { setHistSearch(e.target.value); setSelectedBorrower(""); }}
                  />
                </label>
                <div>
                  <span className="eyebrow">Quick select</span>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:6 }}>
                    {borrowerNames.map((n) => (
                      <button
                        key={n}
                        className={`pill ${selectedBorrower === n ? "pill--ok" : ""}`}
                        onClick={() => { setSelectedBorrower(prev => prev === n ? "" : n); setHistSearch(""); }}
                        title={`Show only ${n}`}
                      >
                        {n}
                      </button>
                    ))}
                    {!borrowerNames.length && <span className="muted">No borrowers yet</span>}
                  </div>
                </div>
              </div>

              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th><th>Borrower</th><th>Item</th><th>Qty</th><th>Status</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((r, i) => (
                      <tr key={`${r.date}-${i}-${r.item || r.items}`}>
                        <td>{r.date}</td>
                        <td>{r.who}</td>
                        <td>{r.item || r.items}</td>
                        <td>{r.qty}</td>
                        <td>
                          <span className={`pill ${
                            r.status === "approved" ? "pill--ok" :
                            r.status === "pending"  ? "pill--warn" : "pill--danger"
                          }`}>{r.status}</span>
                        </td>
                        <td>
                          <button
                            className="btn btn--small"
                            onClick={() => { setSelectedBorrower(r.who); setOpenUserHist(true); }}
                          >
                            View user
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!filteredHistory.length && (
                      <tr><td className="muted" colSpan={6}>No matching records</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* CONCERNS & SUGGESTIONS */}
          {activeModule === "concerns" && (
            <section className="panel">
              <div className="panel__head">
                <div>
                  <div className="eyebrow">{dept.toUpperCase()} — {current.name}</div>
                  <h3>Borrowers’ Concerns & Suggestions</h3>
                </div>
                <div className="panel__actions">
                  <button className="btn">Export</button>
                </div>
              </div>

              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th><th>Date</th><th>From</th><th>Item</th><th>Type</th><th>Message</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(current.concerns || []).map((c) => (
                      <tr key={c.id}>
                        <td className="mono">{c.id}</td>
                        <td>{c.date}</td>
                        <td>{c.from}</td>
                        <td>{c.item}</td>
                        <td>{c.type || "Concern"}</td>
                        <td className="muted">{c.message}</td>
                        <td>
                          <span className={`pill ${
                            c.status === "open"     ? "pill--warn" :
                            c.status === "resolved" ? "pill--ok"   : "pill--danger"
                          }`}>{c.status || "open"}</span>
                        </td>
                      </tr>
                    ))}
                    {!current.concerns?.length && (
                      <tr><td className="muted" colSpan={7}>No submissions</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Modals */}
      <AddItemModal open={openAdd} onClose={() => setOpenAdd(false)} />
      <DeleteItemsModal
        open={openDel}
        onClose={() => setOpenDel(false)}
        items={items}
        onConfirm={handleDeleteItemsConfirm}
        busy={deleting}
      />
      <IncidentModal open={openIncident} onClose={() => setOpenIncident(false)} />
      <AuditTemplateModal open={openAudit} onClose={() => setOpenAudit(false)} />
      <DeclineReasonModal open={openDecline} onClose={handleDeclineModalClose} item={declineRow} />
      <RequestBorrowModal
        open={openRequest}
        onClose={() => setOpenRequest(false)}
        item={selectedItem}
        dept={dept}
        borrowerName={currentUser?.name}
      />
      <NewInventoryModal open={openNewInv} onClose={() => setOpenNewInv(false)} onConfirm={handleAddInventory} />
      <DeleteInventoryModal
        open={openDelInv}
        inv={toDeleteInv}
        confirmName={confirmName}
        setConfirmName={setConfirmName}
        onCancel={() => { setOpenDelInv(false); setToDeleteInv(null); setConfirmName(""); }}
        onConfirm={handleConfirmDelete}
      />
      <UserHistoryModal
        open={openUserHist}
        onClose={() => setOpenUserHist(false)}
        name={selectedBorrower}
        data={allInventoriesHistoryFor}
      />
    </div>
  );
}

function Kpi({ title, value, tone }) {
  return (
    <div className={`kpi ${tone || ""}`}>
      <div className="kpi__title">{title}</div>
      <div className="kpi__value">{value}</div>
    </div>
  );
}

function DataTable({ cols, rows }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>
          {safeRows.map((r, i) => <tr key={i}>{r.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}
          {!safeRows.length && <tr><td className="muted" colSpan={cols.length}>No data</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function UserHistoryModal({ open, onClose, name, data }) {
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
