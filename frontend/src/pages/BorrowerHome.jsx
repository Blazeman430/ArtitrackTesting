import React from "react";
import { useNavigate } from "react-router-dom";
import "./css/borrower.css";
import ConcernsModal from "../components/modals/ConcernsModal"; 
import ProfileMenu from "./ProfileMenu";

export function BorrowerHome() {
  const nav = useNavigate();
  const [openConcerns, setOpenConcerns] = React.useState(false);

  function handleLogout() {
    localStorage.removeItem("arti_user");
    nav("/loginpage", { replace: true });
  }

  return (
    <div className="borrow-root">
      <header className="borrow-topbar">
        <div className="brand">ARTiTRACK — Borrow</div>

        <div className="top-actions">
          <button className="btn" onClick={() => nav("/borrower/items")} type="button">
            Browse Items
          </button>
          <button className="btn" onClick={() => nav("/borrower/history")} type="button">
            My History
          </button>
          <ProfileMenu onLogout={handleLogout} />
        </div>
      </header>

      {/* Hero */}
      <section className="borrow-hero">
        <div className="hero__text">
          <h1>Borrow items with STI Muñoz-EDSA's ARTiTrack!</h1>
          <p className="muted">
            Request items from your department labs and track approvals in one place.
          </p>
          <div className="hero__cta">
            <button className="btn btn--primary" onClick={() => nav("/borrower/items")}>
              Start Request
            </button>
            <button className="btn" onClick={() => nav("/borrower/history")}>
              View Requests
            </button>
          </div>
        </div>

        <ul className="hero__list">
          <li>
            <span className="dot dot--ok" />
            <div>
              <div className="hero__title">Fast approvals</div>
              <div className="muted">See status updates in real time</div>
            </div>
          </li>
          <li>
            <span className="dot dot--info" />
            <div>
              <div className="hero__title">Transparent rules</div>
              <div className="muted">Clear minimums and return reminders</div>
            </div>
          </li>
          <li>
            <span className="dot dot--warn" />
            <div>
              <div className="hero__title">Accountability</div>
              <div className="muted">Every request is tied to your ID</div>
            </div>
          </li>
        </ul>
      </section>

      {/* Quick links */}
      <section className="borrow-panels">
        <div className="panel">
          <div className="panel__head">
            <h3>Popular Actions</h3>
          </div>
          <div className="grid-3">
            <button className="tile" onClick={() => nav("/borrower/items")}>
              <span className="tile__emoji">📦</span>
              <div className="tile__title">Browse Items</div>
              <div className="muted">Search and filter by category</div>
            </button>

            <button className="tile" onClick={() => nav("/borrower/history")}>
              <span className="tile__emoji">🕘</span>
              <div className="tile__title">My Requests</div>
              <div className="muted">Track approvals & returns</div>
            </button>

            {/* FIXED: use the state setter, not ConcernsModal.setOpen */}
            <button className="tile" onClick={() => setOpenConcerns(true)}>
              <span className="tile__emoji">❓</span>
              <div className="tile__title">Feedback</div>
              <div className="muted">Send here your concerns and suggestions about items.</div>
            </button>
          </div>
        </div>
      </section>

      {/* Mount the modal once */}
      <ConcernsModal
        open={openConcerns}
        onClose={() => setOpenConcerns(false)}
        defaultDept=""   // or pass the user’s dept if you have it
      />
    </div>
  );
}