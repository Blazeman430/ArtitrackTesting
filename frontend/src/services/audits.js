import { api } from '../lib/apiClient';
export const Audits = {
  list(dept){ return api(`/audits?dept=${encodeURIComponent(dept)}`); },
  schedule(dept, date){ return api('/audits', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ dept, date }) }); },
  acknowledge(id, note){ return api(`/audits/${id}/ack`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ note }) }); },
  requestRevision(id, reason){ return api(`/audits/${id}/revise`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ reason }) }); },
};
