import React from "react";
import { Modal } from "../Modal";

export function AuditTemplateModal({ open, onClose }){
  return (
    <Modal open={open} onClose={onClose} title="Generate Audit" actions={(<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn--primary" onClick={onClose}>Generate</button></>)}>
      <div className="table-wrap">
        <table className="table"><thead><tr><th>Column</th><th>Include</th></tr></thead>
          <tbody>
            {["SKU","Item","On-hand","Counted","Diff","Note"].map((c)=> (
              <tr key={c}><td>{c}</td><td><input type="checkbox" defaultChecked/></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}