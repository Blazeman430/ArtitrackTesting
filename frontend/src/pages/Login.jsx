import React from "react";
import { useNavigate } from "react-router-dom";
import "./css/login.css";
import { api, primeCsrf} from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";

const ROLE_ROUTES = {
  custodian: "/custodian_dashboard",
  lab_faci: { HTM: "/htm_labfaci", PE: "/pe_labfaci", SCI: "/sci_labfaci", ICT: "/ict_labfaci" },
  borrower: "/borrower",
  admin: "/custodian_dashboard",
};

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const { status, refreshAuth } = useAuth();
  // While booting, show something (prevents white flash)
  if (status === "checking") return <div style={{ padding: 24 }}>Loading…</div>;
  // If already authenticated (e.g., opened login while logged in), the RedirectIfAuthed wrapper
  // will handle the redirect. We just render the form for guests.
  // Do NOT redirect from here based on localStorage alone.

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // 1) Get CSRF cookie (sets XSRF-TOKEN + session cookie)
      await primeCsrf();

      // 2) Login (creates a stateful session)
      const res = await api("/api/auth/login", {
        method: "POST",
        body: { email },
      });

      // 3) Immediately refresh auth state from the server
      const me = (await refreshAuth()) || res.user || null;
      if (me) {
        localStorage.setItem("arti_user", JSON.stringify(me));
        // tell other tabs a login happened
        try {
          localStorage.setItem("arti_auth_broadcast", JSON.stringify({ t: Date.now(), action: "login" }));
        } catch {}
      }

      // 4) Route by role
      const { role, dept } = me || {};
      let to = "/loginpage";
      if (role === "lab_faci") to = ROLE_ROUTES.lab_faci[dept] || "/loginpage";
      else to = ROLE_ROUTES[role] || "/loginpage";
      nav(to, { replace: true });
    } catch (err) {
      setError(err?.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="brand">ARTiTRACK — STI College</div>
        <h1>Email sign-in</h1>
        <p className="muted">Enter your authorized STI email.</p>

        <form onSubmit={handleSubmit} className="form">
          <label>
            <span>Email</span>
            <input
              required
              inputMode="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@sti.edu.ph"
            />
          </label>
          {error && <div className="error" role="alert">{error}</div>}
          <div className="actions">
            <button className="btn btn--primary" disabled={loading} type="submit">
              {loading ? "Signing in…" : "Continue"}
            </button>
            <button
              className="btn btn--ghost"
              type="button"
              onClick={() => { setEmail(""); setError(""); }}
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
