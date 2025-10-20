import React from "react";
import { Modal } from "../Modal";

export function IncidentModal({ open, onClose }){
  return (
    <Modal open={open} onClose={onClose} title="New Incident" actions={(<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn--primary" onClick={onClose}>Confirm</button></>)}>
      <div className="grid-2">
        <label><span>Item</span><input/></label>
        <label><span>Qty</span><input type="number" min="1" defaultValue={1}/></label>
        <label style={{gridColumn:"1/-1"}}><span>Reason</span><input placeholder="Broken, expired, etc."/></label>
        <label style={{gridColumn:"1/-1"}}><span>Evidence</span><input type="file"/></label>
      </div>
    </Modal>
  );
}