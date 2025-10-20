// demoData.js
export const demoHTMData = {
  inventories: [
    {
      key: "hot",
      name: "Hot Kitchen",
      kpis: { totalItems: 210, borrowedNow: 8, lowStock: 5, incidentsOpen: 2, upcomingAudits: 1 },
      inventory: [
        { sku: "HTM-HOT-001", name: "Cooking Pot", location: "Hot Kitchen A", onHand: 25, min: 10, status: "ok", imageUrl: "" },
        { sku: "HTM-HOT-002", name: "Gas Stove", location: "Hot Kitchen B", onHand: 4, min: 3, status: "ok", imageUrl: "" },
        { sku: "HTM-HOT-003", name: "Meat Thermometer", location: "Hot Kitchen A", onHand: 2, min: 5, status: "low", imageUrl: "" },
      ],
      lowStockRows: [
        { sku: "HTM-HOT-003", name: "Meat Thermometer", onHand: 2, min: 5 },
      ],
      incidents: [
        { item: "Cooking Pot", qty: 1, remark: "Handle broken", tag: "Damaged" },
        { item: "Gas Stove", qty: 1, remark: "Gas leak", tag: "Condemn" },
      ],
      audits: [
        { date: "2025-09-15", status: "Scheduled" },
        { date: "2025-08-10", status: "Completed" },
      ],
      historyDates: ["2025-08-01", "2025-08-15", "2025-08-30"],
      recentBorrow: [
        { who: "Student A", items: "Cooking Pot", qty: 2, status: "approved" },
        { who: "Student B", items: "Gas Stove", qty: 1, status: "pending" },
      ],
      borrowHistory: [
        { date:"2025-09-01", who:"Student A", item:"Cooking Pot", qty:1, status:"approved" },
        { date:"2025-09-03", who:"Student B", item:"Gas Stove", qty:1, status:"pending" },
      ],
      concerns: [
        { id:"C-1021", date:"2025-09-02", from:"Student C", item:"Mixing Bowl", dept:"HTM",
        type:"Concern", message:"Handle is loose.", status:"open" }]
    },
    {
      key: "cold",
      name: "Cold Kitchen",
      kpis: { totalItems: 140, borrowedNow: 3, lowStock: 2, incidentsOpen: 1, upcomingAudits: 0 },
      inventory: [
        { sku: "HTM-COLD-001", name: "Refrigerator", location: "Cold Storage", onHand: 3, min: 2, status: "ok", imageUrl: "" },
        { sku: "HTM-COLD-002", name: "Mixing Bowl", location: "Cold Kitchen Lab", onHand: 6, min: 10, status: "low", imageUrl: "" },
      ],
      lowStockRows: [
        { sku: "HTM-COLD-002", name: "Mixing Bowl", onHand: 6, min: 10 },
      ],
      incidents: [
        { item: "Refrigerator", qty: 1, remark: "Not cooling properly", tag: "Repair" },
      ],
      audits: [
        { date: "2025-09-20", status: "Scheduled" },
      ],
      historyDates: ["2025-07-25", "2025-08-18"],
      recentBorrow: [
        { who: "Student C", items: "Mixing Bowl", qty: 4, status: "approved" },
      ],
      borrowHistory: [
        { date:"2025-09-01", who:"Student A", item:"Cooking Pot", qty:1, status:"approved" },
        { date:"2025-09-03", who:"Student B", item:"Gas Stove", qty:1, status:"pending" },
      ],
      concerns: [
        { id:"C-1021", date:"2025-09-02", from:"Student C", item:"Mixing Bowl", dept:"HTM",
        type:"Concern", message:"Handle is loose.", status:"open" }]
    },
    {
      key: "bar",
      name: "Bar Station",
      kpis: { totalItems: 75, borrowedNow: 1, lowStock: 1, incidentsOpen: 0, upcomingAudits: 1 },
      inventory: [
        { sku: "HTM-BAR-001", name: "Wine Glass", location: "Bar Shelf", onHand: 30, min: 25, status: "ok", imageUrl: "" },
        { sku: "HTM-BAR-002", name: "Cocktail Shaker", location: "Bar Shelf", onHand: 2, min: 5, status: "low", imageUrl: "" },
      ],
      lowStockRows: [
        { sku: "HTM-BAR-002", name: "Cocktail Shaker", onHand: 2, min: 5 },
      ],
      incidents: [],
      audits: [
        { date: "2025-09-25", status: "Scheduled" },
      ],
      historyDates: ["2025-08-05"],
      recentBorrow: [
        { who: "Student D", items: "Wine Glass", qty: 6, status: "approved" },
      ],
      borrowHistory: [
        { date:"2025-09-01", who:"Student A", item:"Cooking Pot", qty:1, status:"approved" },
        { date:"2025-09-03", who:"Student B", item:"Gas Stove", qty:1, status:"pending" },
      ],
      concerns: [
        { id:"C-1021", date:"2025-09-02", from:"Student C", item:"Mixing Bowl", dept:"HTM",
        type:"Concern", message:"Handle is loose.", status:"open" }]
    }
  ]
};
