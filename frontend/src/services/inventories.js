// src/services/inventories.js
import { api } from "../lib/apiClient";

export const Inventories = {
  list: async ({ dept }, signal) => {
    const data = await api(`/api/inventories?dept=${encodeURIComponent(dept)}`, { signal, credentials: "omit" });
    return (Array.isArray(data) ? data : []).map(inv => ({
      id: inv.id,
      key: String(inv.id),         // use DB id as stable key
      name: inv.name,
      kpis: {
        totalItems:    inv?.kpis?.totalItems    ?? 0,
        borrowedNow:   inv?.kpis?.borrowedNow   ?? 0,
        lowStock:      inv?.kpis?.lowStock      ?? 0,
        incidentsOpen: inv?.kpis?.incidentsOpen ?? 0,
        upcomingAudits:inv?.kpis?.upcomingAudits?? 0,
      },
      // You can hydrate incidents/audits/history separately later
      inventory: [], lowStockRows: [], incidents: [], audits: [],
      historyDates: [], recentBorrow: [], borrowHistory: [], concerns: [],
    }));
  },

  create: async ({ dept, name }, signal) => {
    const saved = await api(`/api/inventories`, {
      method: "POST",
      body: { dept, name },
      signal,
      credentials: "omit",
    });
    return {
      id: saved.id,
      key: String(saved.id),
      name: saved.name,
      kpis: saved.kpis || { totalItems:0, borrowedNow:0, lowStock:0, incidentsOpen:0, upcomingAudits:0 },
      inventory: [], lowStockRows: [], incidents: [], audits: [],
      historyDates: [], recentBorrow: [], borrowHistory: [], concerns: [],
    };
  },

  remove: async (id, signal) => api(`/api/inventories/${id}`, {
    method: "DELETE",
    signal,
    credentials: "omit",
  }),
};
