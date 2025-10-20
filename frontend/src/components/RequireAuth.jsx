import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth({ children }) {
  const { status } = useAuth();
  if (status === "checking") return <div style={{ padding: 24 }}>Loading…</div>;
  if (status === "guest") return <Navigate to="/loginpage" replace />;
  return children;
}
