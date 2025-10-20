import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RedirectAuthed from "./RedirectAuthed"; // for routeFor()

function routeFor(user) {
  // reuse the logic used by RedirectAuthed to decide the home for the user
  const role = (user?.role || user?.type || "").toLowerCase();
  const dept = user?.dept;
  if (role === "lab_faci") {
    if (dept === "HTM") return "/htm_labfaci";
    if (dept === "PE")  return "/pe_labfaci";
    if (dept === "SCI") return "/sci_labfaci";
    if (dept === "ICT") return "/ict_labfaci";
  }
  if (role === "custodian" || role === "admin") return "/custodian_dashboard";
  if (role === "borrower") return "/borrower";
  return "/loginpage";
}

/**
 * <RequireRole allow={['custodian','admin']} />
 * <RequireRole allow={[['lab_faci','HTM']]} /> // role + dept pair
 */
export default function RequireRole({ allow = [], children }) {
  const { status, user } = useAuth();
  if (status === "checking") return <div style={{ padding: 24 }}>Loading…</div>;
  if (status === "guest") return <Navigate to="/loginpage" replace />;

  const userRole = (user?.role || user?.type || "").toLowerCase();
  const userDept = (user?.dept || "").toUpperCase();

  // normalize allow entries to [role, dept?]
  const ok = allow.some((entry) => {
    if (Array.isArray(entry)) {
      const [r, d] = entry;
      return userRole === String(r).toLowerCase() && (!d || userDept === String(d).toUpperCase());
    }
    return userRole === String(entry).toLowerCase();
  });

  // admins can go anywhere
  const pass = ok || userRole === "admin";

  if (!pass) {
    return <Navigate to={routeFor(user)} replace />;
  }
  return children;
}
