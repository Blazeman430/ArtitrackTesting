import { api } from "../lib/apiClient";

export const Loans = {
  // Use the backend’s expected shape
  request({ inventory_id, borrower_name, due_at = null, lines }, signal) {
    return api("/api/loans", {
      method: "POST",
      body: { inventory_id, borrower_name, due_at, lines },
      signal,
      credentials: "include", // ← cookie/Sanctum style (recommended)
    });
  },

  myHistory(params, signal) {
    const qs = new URLSearchParams(params || {}).toString();
    return api(`api/borrower/history${qs ? `?${qs}` : ""}`, {
      signal, 
      credentials: "include",
    });
  },

  list(params = {}, signal) {
    const qs = new URLSearchParams(params).toString();
    return api(`/api/loans${qs ? `?${qs}` : ""}`, { signal, credentials: "include" });
  },

  recent(params = {}, signal) {
    const qs = new URLSearchParams(params).toString();
    return api(`/api/loans/recent${qs ? `?${qs}` : ""}`, { signal, credentials: "include" });
  },

  history(params = {}, signal) {
    const qs = new URLSearchParams(params).toString();
    return api(`/api/loans/history${qs ? `?${qs}` : ""}`, { signal, credentials: "include" });
  },

  approve(id, signal) {
    return api(`/api/loans/${id}/approve`, { method: "POST", signal, credentials: "include" });
  },

  decline(id, reason, signal) {
    return api(`/api/loans/${id}/decline`, {
      method: "POST",
      body: { decline_reason: reason },
      signal,
      credentials: "include",
    });
  },

  issue(id, signal) {
    return api(`/api/loans/${id}/issue`, { method: "POST", signal, credentials: "include" });
  },

  returnAll(id, signal) {
    return api(`/api/loans/${id}/return`, { method: "POST", signal, credentials: "include" });
  },
  
  returnLine(loanId, lineId, qty, signal) {
    return api(`/api/loans/${loanId}/return-line/${lineId}`, {
      method: "POST",
      body: { qty },
      signal,
      credentials: "include",
    });
  },
};