import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function routeFor(user) {
  const role = (user?.role || user?.type || "").toLowerCase();
  const dept = user?.dept;
  if (role === "lab_faci") {
    // tweak if your dept keys differ
    if (dept === "HTM") return "/htm_labfaci";
    if (dept === "PE")  return "/pe_labfaci";
    if (dept === "SCI") return "/sci_labfaci";
    if (dept === "ICT") return "/ict_labfaci";
  }
  if (role === "custodian" || role === "admin") return "/custodian_dashboard";
  if (role === "borrower") return "/borrower";
  return "/custodian_dashboard";
}

export default function RedirectIfAuthed({ children }) {
  const { status, user } = useAuth();

  if (status === "checking") return <div style={{ padding: 24 }}>Loading…</div>;
  if (status === "authed")  return <Navigate to={routeFor(user)} replace />;

  return children; // guest -> render the login form
}
