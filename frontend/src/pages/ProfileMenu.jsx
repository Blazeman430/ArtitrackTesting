// src/components/ProfileMenu.jsx
import React from "react";
import { api } from "../lib/apiClient";
import { primeCsrf } from "../lib/apiClient";

function getStoredUser() {
  try { const raw = localStorage.getItem("arti_user"); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}

export default function ProfileMenu({ onLogout }) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef(null);
  const menuRef = React.useRef(null);

  const user = getStoredUser() || {};
  const name = user.name || "Signed user";
  const email = user.email || "no-email@example.com";
  const role = user.role || "—";
  const dept = user.dept || "—";
  const acct = user.account_no || "N/A";
  const photo = user.photo_url;

  React.useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current || !btnRef.current) return;
      if (!menuRef.current.contains(e.target) && !btnRef.current.contains(e.target)) setOpen(false);
    }
    function onEsc(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  async function handleLogoutClick() {
    try {
      await primeCsrf();                // harmless
      await api("/api/auth/logout", { method: "POST" });
    } catch (_) {
      // ignore; we'll still clear client state
    } finally {
      try { localStorage.removeItem("arti_user"); } catch {}
      try {
        localStorage.setItem("arti_auth_broadcast", JSON.stringify({ t: Date.now(), action: "logout" }));
      } catch {}
      window.location.assign("/loginpage"); // full reload -> no stale in-memory state
    }
  }

  return (
    <div className="profile" aria-haspopup="true" aria-expanded={open}>
      <button className="profile__btn" onClick={() => setOpen(v => !v)} ref={btnRef} title="Account menu">
        <span className="profile__name">{name}</span>
        <span className="profile__avatar" aria-hidden="true">
          {photo ? <img src={photo} alt="" /> : <span className="profile__avatar-fallback">{name[0] || email[0] || "U"}</span>}
        </span>
        <span className={`profile__chev ${open ? "open" : ""}`} />
      </button>
      {open && (
        <div className="profile__menu" ref={menuRef} role="menu">
          <div className="profile__card">
            <div className="profile__id">
              <div className="profile__avatar profile__avatar--lg" aria-hidden="true">
                {photo ? <img src={photo} alt="" /> : <span className="profile__avatar-fallback">{name[0] || email[0] || "U"}</span>}
              </div>
              <div className="profile__meta">
                <div className="profile__meta-name">{name}</div>
                <div className="profile__meta-email">{email}</div>
                <div className="profile__meta-role">Role: <span>{role}</span></div>
                <div className="profile__meta-dept">Dept: <span>{dept}</span></div>
                <div className="profile__meta-acct">Account No: <span className="mono">{acct}</span></div>
              </div>
            </div>

            <div className="profile__links">
              <button className="profile__item" type="button" onClick={() => window.print()}>🖨️ Print this page</button>
              <a className="profile__item" href="/help" target="_blank" rel="noreferrer">❓ Help</a>
              <hr className="profile__sep" />
              <button className="profile__item profile__logout" type="button" onClick={handleLogoutClick}>↪ Log out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
