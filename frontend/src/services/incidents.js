import { api } from '../lib/apiClient';
export const Incidents = {
  list(dept){ return api(`/incidents?dept=${encodeURIComponent(dept)}`); },
  create({ dept, sku, qty, tag, remark }){ return api('/incidents', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ dept, sku, qty, tag, remark }) }); },
};
