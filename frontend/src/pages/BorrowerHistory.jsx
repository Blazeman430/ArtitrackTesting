import React from "react";
import { useNavigate } from "react-router-dom";
import "./css/borrower.css";
import { Loans } from "../services/loans";

export function BorrowerHistory() {
  const nav = useNavigate();
  const [rows, setRows] = React.useState([]);
  const [status, setStatus] = React.useState("");
  const [dept, setDept] = React.useState("");
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [last, setLast] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  async function load(p = 1) {
    setLoading(true);
    setError("");

    try {
      const data = await Loans.myHistory({
        page: p,
        per_page: 20,
        ...(dept ? { dept } : {}),
        ...(status ? { status } : {}),
      });

      const list = Array.isArray(data?.data) ? data.data : [];

      const flat = list.flatMap((loan) =>
        (loan.lines || []).map((line) => ({
          id: `${loan.id}-${line.id}`,
          date:
            loan.requested_at ||
            loan.approved_at ||
            loan.issued_at ||
            loan.returned_at ||
            loan.created_at,
          dept: loan.inventory?.dept || loan.dept || "",
          item:
            line.inventory_item?.item?.name ||
            `Item#${line.inventory_item_id}`,
          qty: line.qty,
          status: loan.status,
        }))
      );

      const filtered = q.trim()
        ? flat.filter((r) =>
            (r.item || "").toLowerCase().includes(q.trim().toLowerCase())
          )
        : flat;

      setRows(filtered);
      setPage(data.current_page || p);
      setLast(data.last_page || 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, [dept, status]);

  return (
    <div className="borrow-root">
      <header className="borrow-topbar">
        <div className="brand">My Requests</div>
        <div className="actions">
          <button className="btn btn--ghost" onClick={() => nav("/borrower")}>Back</button>
          <button className="btn" onClick={() => nav("/borrower/items")}>Browse Items</button>
        </div>
      </header>

      <section className="panel">
        <div className="panel__head">
          <h3>Borrowing History</h3>
          <div className="panel__actions">
            <input
              className="input"
              placeholder="Search item…"
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && load(1)}
              aria-label="Search history"
            />
            <select className="input" value={status} onChange={e => setStatus(e.target.value)} aria-label="Filter status">
              <option value="">All status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="out">Borrowed</option>
              <option value="returned">Returned</option>
              <option value="declined">Declined</option>
            </select>
            <select className="input" value={dept} onChange={e => setDept(e.target.value)} aria-label="Filter dept">
              <option value="">All depts</option>
              <option value="HTM">HTM</option>
              <option value="PE">PE</option>
              <option value="SCI">SCI</option>
              <option value="ICT">ICT</option>
            </select>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="table-wrap">
          {loading ? (
            <div className="muted">Loading…</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Dept</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? rows.map((r) => (
                  <tr key={`${r.id}-${r.item}-${r.date}`}>
                    <td>{r.date || "—"}</td>
                    <td>{r.dept || "—"}</td>
                    <td>{r.item || "—"}</td>
                    <td>{r.qty ?? "—"}</td>
                    <td>
                      <span className={`pill ${
                        r.status === "approved" ? "pill--ok" :
                        r.status === "pending"  ? "pill--warn" :
                        r.status === "returned" ? "pill--info" : "pill--danger"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="muted center">No records found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <button disabled={page<=1} onClick={()=>load(page-1)}>Prev</button>
          <span>Page {page} / {last}</span>
          <button disabled={page>=last} onClick={()=>load(page+1)}>Next</button>
        </div>
      </section>
    </div>
  );
}
