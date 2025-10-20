import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./css/borrower.css";
import { Items } from "../services/items";
import { Loans } from "../services/loans";
import { Inventories } from "../services/inventories";

export const fmtYMD = (d) => (d ? String(d).slice(0, 10) : "—");

export function BorrowerItems() {
  const nav = useNavigate();
  const { dept: routeDept } = useParams();

  // filters
  const [query, setQuery] = React.useState("");
  const [deptFilter, setDeptFilter] = React.useState(routeDept || "HTM");
  const [catFilter, setCatFilter] = React.useState("ALL");
  const [inventoryId, setInventoryId] = React.useState(null);        // NEW

  // data
  const [inventories, setInventories] = React.useState([]);          // NEW
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [qty, setQty] = React.useState({});
  const [submittingKey, setSubmittingKey] = React.useState(null);
  const cardKey = (i) => i.inventory_item_id ?? `${inventoryId}:${i.id ?? i.sku}`;

  const user = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("arti_user")) || {}; } catch { return {}; }
  }, []);

  // Load inventories for the selected dept and pick one
  React.useEffect(() => {
    const ac = new AbortController();
    async function loadInv() {
      try {
        const data = await Inventories.list({ dept: deptFilter }, ac.signal);
        setInventories(data);
        // prefer keeping the current selection if it still exists
        const exists = data.some((d) => d.id === inventoryId);
        setInventoryId(exists ? inventoryId : (data[0]?.id ?? null));
      } catch (e) {
        // leave inventories empty on error
        setInventories([]);
        setInventoryId(null);
      }
    }
    loadInv();
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptFilter]);

  // Load items from API, scoped by inventory_id so on_hand is the pivot quantity
  React.useEffect(() => {
    const ac = new AbortController();
    const load = async () => {
      if (!inventoryId) { setItems([]); return; } // wait for inventory
      setLoading(true);
      setError("");
      try {
        const data = await Items.list(
          { dept: deptFilter, inventoryId, attachOnly: true },
          ac.signal
        );
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name !== "AbortError") {
          setError(e.message || "Failed to load items");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => ac.abort();
  }, [deptFilter, inventoryId]);

  // derived filters
  const categories = React.useMemo(() => {
    const s = new Set(items.map(i => i.category || "Uncategorized"));
    return ["ALL", ...Array.from(s)];
  }, [items]);

  // apply search + filters client-side
  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(i => {
      const passQ =
        !q ||
        (i.name || "").toLowerCase().includes(q) ||
        (i.sku || "").toLowerCase().includes(q);
      const passC = catFilter === "ALL" || (i.category || "Uncategorized") === catFilter;
      return passQ && passC;
    });
  }, [items, query, catFilter]);

  function changeQty(key, delta) {
    setQty(prev => ({ ...prev, [key]: Math.max(1, (prev[key] || 1) + delta) }));
  }

  async function handleRequest(item) {
    const key = cardKey(item);
    const requested = Math.max(1, qty[key] || 1);

    const invId = Number(item.inventory_id);
    const invItemId = Number(item.inventory_item_id);

    if (!invId || !invItemId) {
      return alert("Item is missing inventory mapping (inventory_id / inventory_item_id).");
    }
    if ((item.qty ?? 0) <= 0) {
      return alert("This item is currently not available.");
    }

    const borrowerName = user.name || user.email || "Borrower";

    try {
      setSubmittingKey(key);
      await Loans.request({
        inventory_id: invId,
        borrower_name: borrowerName,
        due_at: null,
        lines: [{ inventory_item_id: invItemId, qty: requested }],
      });
      setQty(q => ({ ...q, [key]: 1 }));
      if (window.confirm("Request submitted! View your history now?")) {
        nav("/borrower/history");
      }
    } catch (e) {
      alert(e.message || "Request failed");
    } finally {
      setSubmittingKey(null);
    }
  }

  return (
    <div className="borrow-root">
      <header className="borrow-topbar">
        <div className="brand">Items</div>
        <div className="actions">
          <button className="btn btn--ghost" onClick={() => nav("/borrower")}>Back</button>
          <button className="btn" onClick={() => nav("/borrower/history")}>My History</button>
        </div>
      </header>

      <section className="panel">
        <div className="panel__head">
          <h3>Browse Items</h3>
          <div className="panel__actions">
            <input
              aria-label="Search items"
              className="input"
              placeholder="Search by name or SKU…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            {/* Department selector */}
            <select className="input" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="HTM">HTM</option>
              <option value="PE">PE</option>
              <option value="SCI">SCI</option>
              <option value="ICT">ICT</option>
            </select>

            {/* NEW: Inventory selector (scopes stock to pivot) */}
            <select
              className="input"
              value={inventoryId ?? ""}
              onChange={(e) => setInventoryId(Number(e.target.value) || null)}
            >
              {inventories.length === 0 && <option value="">No inventories</option>}
              {inventories.map(inv => (
                <option key={inv.id} value={inv.id}>{inv.name}</option>
              ))}
            </select>

            <select className="input" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {loading && <div className="muted">Loading…</div>}
        {!loading && error && (
          <div className="empty">
            <div className="empty__icon">⚠️</div>
            <div className="empty__title">Couldn’t load items</div>
            <div className="muted">{error}</div>
          </div>
        )}

        {!loading && !error && (
          <div className="cards">
            {rows.map(i => {
              const key = cardKey(i);
              const requested = qty[key] || 1;
              const min = Number(i.min ?? 0);
              const onHand = Number(i.qty ?? 0);  // qty already normalized from API
              const low = min > 0 ? onHand < min : onHand <= 0;
              const soonest =
                (i.expirations || [])
                  .map(e => e?.date)
                  .filter(Boolean)
                  .sort()[0] || null;

              return (
                <div key={i.id || i.sku} className="card">
                  <div className="card__row">
                    <div className="card__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {i.imageUrl ? (
                        <img
                          src={i.imageUrl}
                          alt=""
                          width={40}
                          height={40}
                          style={{ objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }}
                          onError={(ev) => { ev.currentTarget.style.visibility = "hidden"; }}
                        />
                      ) : (
                        <div style={{ width:40, height:40, borderRadius:8, background:"#f3f4f6", border:"1px solid #e5e7eb" }} />
                      )}
                      {i.name}
                    </div>
                    <span className={`pill ${low ? "pill--warn" : "pill--ok"}`}>
                      {low ? "LOW" : "OK"}
                    </span>
                  </div>

                  <div className="card__meta mono">
                    {(i.sku || "—")} • {deptFilter} • {(i.category || "Uncategorized")}
                  </div>

                  <div className="card__row">
                    <div className="muted">
                      On hand: {onHand} &nbsp;•&nbsp; Min: {min}
                      {soonest ? (
                        <>
                          &nbsp;•&nbsp; Exp: <span className="mono">{fmtYMD(soonest)}</span>
                        </>
                      ) : null}
                    </div>
                    <div className="qty">
                      <button className="btn btn--small" onClick={() => changeQty(key, -1)}>-</button>
                      <input className="input input--qty" value={requested} readOnly aria-label="Quantity" />
                      <button className="btn btn--small" onClick={() => changeQty(key, +1)}>+</button>
                    </div>
                  </div>

                  <div className="card__row">
                    <button
                      className="btn btn--primary"
                      disabled={!inventoryId || onHand <= 0 || submittingKey === key}
                      onClick={() => handleRequest(i)}
                    >
                      {submittingKey === key ? "Sending…" : "Request"}
                    </button>
                    <button className="btn btn--ghost">Details</button>
                  </div>
                </div>
              );
            })}

            {!rows.length && (
              <div className="empty">
                <div className="empty__icon">🔍</div>
                <div className="empty__title">No matches</div>
                <div className="muted">Try a different search or filters.</div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
