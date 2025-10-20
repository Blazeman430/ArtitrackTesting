import React from "react";
import { Modal } from "../Modal";

export function DeclineReasonModal({ open, onClose }){
  return (
    <Modal open={open} onClose={onClose} title="Decline Request" actions={(<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn--primary" onClick={onClose}>Confirm</button></>)}>
      <label><span>Reason</span><input placeholder="Why is this declined?"/></label>
    </Modal>
  );
}