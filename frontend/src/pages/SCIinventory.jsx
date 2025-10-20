import React from "react";
import InventoryDashboard from "./InventoryDashboard";

const mockData = {
  kpis: { totalItems: 95, borrowedNow: 6, lowStock: 2, incidentsOpen: 1, upcomingAudits: 0 },
  historyDates: ["02/01/2025", "02/18/2025"],
  recentBorrow: [
    { who: "COACHNAME2", items: "Basketball", qty: 2, status: "approved" },
    { who: "STUDENTNAME3", items: "Volleyball", qty: 1, status: "pending" },
  ],
  lowStockRows: [
    { sku: "PE-BALL-010", name: "Basketball", onHand: 6, min: 10 },
  ],
  incidents: [
    { item: "Shoes", qty: 1, remark: "Torn sole", tag: "Broken" },
  ],
  audits: [{ date: "2025-04-01", status: "Scheduled" }],
  borrowHistory: [
  { date:"2025-09-01", who:"Student A", item:"Cooking Pot", qty:1, status:"approved" },
  { date:"2025-09-03", who:"Student B", item:"Gas Stove", qty:1, status:"pending" },
  ],
  concerns: [
  { id:"C-1021", date:"2025-09-02", from:"Student C", item:"Mixing Bowl", dept:"HTM",
    type:"Concern", message:"Handle is loose.", status:"open" },
],
};

export default function SCIInventory() {
  return <InventoryDashboard dept="SCI" data={mockData} />;
}
