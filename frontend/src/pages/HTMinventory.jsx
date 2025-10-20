import React from "react";
import InventoryDashboard from "./InventoryDashboard";

const mockData = {
  kpis: {
    totalItems: 178,
    borrowedNow: 9,
    lowStock: 4,
    incidentsOpen: 2,
    upcomingAudits: 1,
  },
  historyDates: ["01/24/2025", "01/05/2025", "02/07/2025"],
  recentBorrow: [
    { who: "COACHNAME1", items: "Glass", qty: 1, status: "approved" },
    { who: "STUDENTNAME1", items: "Cups", qty: 3, status: "pending" },
  ],
  lowStockRows: [
    { sku: "HTM-GLS-001", name: "Glass", onHand: 18, min: 20 },
    { sku: "HTM-CKW-031", name: "Round Pan", onHand: 9, min: 10 },
  ],
  incidents: [
    { item: "Glass", qty: 1, remark: "Broken edge", tag: "Broken" },
    { item: "Cookies", qty: 6, remark: "Expired", tag: "Expired" },
  ],
  audits: [
    { date: "2025-03-15", status: "Scheduled" },
    { date: "2025-01-20", status: "Completed" },
  ],
};

export default function HTMInventory() {
  return <InventoryDashboard dept="HTM" data={mockData} />;
}
