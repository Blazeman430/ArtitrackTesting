import { api, absolutize } from "../lib/apiClient";

export async function searchItems(q, dept, inventoryId = null, attachOnly = false, signal) {
  const qs = new URLSearchParams();
  if (dept) qs.set("dept", dept);
  if (q) qs.set("q", q);
  if (inventoryId != null) qs.set("inventory_id", String(inventoryId));
  if (attachOnly) qs.set("attach_only", "1");
  // keep using the same index route (backend already supports q + inventory scoping in your setup)
  const res = await api(`/api/items?${qs.toString()}`, { method: "GET", signal });
  const rows = Array.isArray(res) ? res : [];
  // normalize a bit for the typeahead UI
  return rows.map(r => ({
    id: r.id,
    inventory_id: r.inventory_id ?? r.inventory?.id ?? null,
    inventory_item_id: r.inventory_item_id ?? r.inv_item_id ?? null,
    sku: r.sku,
    name: r.name,
    category: r.category ?? "",
    min: Number(r.min ?? 0),
    on_hand: Number(r.on_hand ?? r.qty ?? 0),
    image_url: r.image_url || "",
    // derive soonest expiry if backend returns expirations[]
    soonest_exp: Array.isArray(r.expirations) && r.expirations.length
      ? String(r.expirations.map(e => e?.date).filter(Boolean).sort()[0] || "")
      : null,
  }));
}

export const Items = {
  create: async (form, dept, inventoryId, signal) => {
    const fd = new FormData();
    fd.append("dept", dept);
    if (inventoryId != null) fd.append("inventory_id", String(inventoryId));
    if (form.id != null) fd.append("item_id", String(form.id));
    fd.append("name", form.name || "");

    // ---- batches vs single quantity ----
    const batchTotal = Array.isArray(form.batches)
      ? form.batches.reduce((sum, b) => sum + (Number(b?.qty) || 0), 0)
      : 0;

    // Only send on_hand when there are NO batch quantities
    if (batchTotal === 0) {
      fd.append("on_hand", String(form.qty ?? 0));
    } else {
      // backend will compute delta from batches; avoid double-counting
      fd.append("on_hand", "0");
    }

    if (form.min != null){fd.append("min", String(form.min));} 
    if (form.category) {fd.append("category", form.category);}
    if (form.location) {fd.append("location", form.location);}
    if (typeof form.description === "string" && form.description.trim() !== "") 
      {fd.append("description", form.description.trim());}
    if (form.image instanceof File) {fd.append("image", form.image);}

    if (Array.isArray(form.batches) && form.batches.length) {
      fd.append(
        "batches",
        JSON.stringify(
          form.batches.map((b) => ({
            expires_at: b.expires_at || null,
            qty: Number(b.qty || 0),
          }))
        )
      );
    }

    const saved = await api("/api/items", {
      method: "POST",
      body: fd,
      signal,
      credentials: "omit", // keep search/public reads simple; auth not required here
    });

    return {
      id: saved.id,
      dept: saved.dept,
      sku: saved.sku ?? "",
      name: saved.name ?? "",
      // qty comes from server truth; do NOT fall back to form.qty if server provided it
      qty: Number(saved.on_hand ?? 0),
      min: Number(saved.min ?? form.min ?? 0),
      category: saved.category ?? "Uncategorized",
      location: saved.location ?? "",
      description: saved.description ?? "",
      expirations: Array.isArray(saved.expirations) ? saved.expirations : [],
      imageUrl: absolutize(saved.image_url || saved.imageUrl || ""),
    };
  },

  list: async ({ dept, inventoryId, attachOnly = true}, signal) => {
    const qs = new URLSearchParams();
    if (dept) qs.set("dept", dept);
    if (inventoryId) qs.set("inventory_id", String(inventoryId));
    if (attachOnly) qs.set("attach_only", "1");
    const rows = await api(`/api/items?${qs}`, { signal, credentials: "omit" });

    // ✅ normalize API → UI shape
    return (Array.isArray(rows) ? rows : []).map(r => {
      const qty = Number(r.on_hand ?? 0);
      const min = Number(r.min ?? 0);
      const computedLow = min > 0 && qty < min;
      const lowStock = typeof r.low_stock !== "undefined" ? !!r.low_stock : computedLow;
      return {
        id: r.id,
        dept: r.dept,
        sku: r.sku,
        name: r.name,
        category: r.category ?? "",
        inventory_id: r.inventory_id ?? null,
        inventory_item_id: r.inventory_item_id ?? null,
        qty,
        min,
        location: r.location ?? "",
        description: r.description ?? "",
        available: Number(r.available ?? Math.max(0, qty - Number(r.borrowed ?? 0))),
        borrowed: Number(r.borrowed ?? 0),
        low_stock: lowStock,  // canonical
        low: lowStock,        // legacy alias so existing JSX still works
        imageUrl: absolutize(r.image_url || r.imageUrl || ""),
        expirations: Array.isArray(r.expirations) ? r.expirations : [],
      };
    });
  },

  update: async (id, form, dept, inventoryId, signal) => {
    const fd = new FormData();
    fd.append("_method", "PUT");
    if (dept != null)             fd.append("dept", dept);
    if (inventoryId != null)      fd.append("inventory_id", String(inventoryId)); // NEW
    if (form.sku != null)         fd.append("sku", form.sku);
    if (form.name != null)        fd.append("name", form.name);
    if (form.min != null)         fd.append("min", form.min);
    if (form.category != null)    fd.append("category", form.category);
    if (form.description != null) fd.append("description", form.description);
    if (form.location != null)    fd.append("location", form.location); // pivot when inventoryId present
    if (form.qty != null)         fd.append("on_hand", form.qty);       // pivot when inventoryId present
    if (form.image instanceof File) fd.append("image", form.image);

    const updated = await api(`/api/items/${encodeURIComponent(String(id).split(":")[0])}`, {
      method: "POST", body: fd, signal, credentials: "omit"
    });

    return {
      id: updated.id,
      dept: updated.dept,
      sku: updated.sku ?? "",
      name: updated.name ?? "",
      qty: Number(updated.on_hand ?? form.qty ?? 0),
      min: Number(updated.min ?? form.min ?? 0),
      category: updated.category ?? "Uncategorized",
      location: updated.location ?? "",
      description: updated.description ?? "",
      expirations: Array.isArray(updated.expirations) ? updated.expirations : [],
      imageUrl: absolutize(updated.image_url || updated.imageUrl || "")
    };
  },

  removeMany: async (ids, signal) => {
    await Promise.all(ids.map(id =>
      Items.remove(id, signal).catch(err => {
        // keep going; surface one error at the end if you prefer
        console.warn('Delete failed for', id, err);
      })
    ));
  },

    /** Permanently deletes a catalog item */
  remove: async (id, signal) => {
    const res = await api(`/api/items/${encodeURIComponent(String(id))}`, {
      method: "DELETE",
      signal,
    });
    // backend responds 204 No Content (or 200); both are fine
    return true;
  },


};
