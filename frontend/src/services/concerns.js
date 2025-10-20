import { api } from '../lib/apiClient';
export const Concerns = {
  list(dept){ return api(`/concerns?dept=${encodeURIComponent(dept)}`); },
  create({ dept, from, item_sku, type, message }){ return api('/concerns', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ dept, from, item_sku, type, message }) }); },
};
