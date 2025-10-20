export function DisposalView({ dept }){
  return (
    <div className="inv-root">
      <header className="topbar"><div className="brand">{dept} — Disposal</div></header>
      <div className="layout">
        <main className="main">
          <section className="grid-2">
            <div className="panel">
              <div className="panel__head"><h3>Asset Control A — Transport Report</h3></div>
              <p className="muted">Choose items for transfer to disposal area and generate a transport report.</p>
              <div style={{display:"flex",gap:8}}>
                <button className="btn">Select Items</button>
                <button className="btn btn--primary">Generate PDF</button>
              </div>
            </div>
            <div className="panel">
              <div className="panel__head"><h3>Asset Control B — Deletion Report</h3></div>
              <p className="muted">Confirm items to be deleted from inventory and produce a deletion report.</p>
              <div style={{display:"flex",gap:8}}>
                <button className="btn">Select Items</button>
                <button className="btn btn--primary">Generate PDF</button>
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panel__head"><h3>Gate Pass</h3></div>
            <div className="grid-2">
              <label><span>Date</span><input type="date"/></label>
              <label><span>Authorized by</span><input placeholder="Name"/></label>
              <label style={{gridColumn:"1/-1"}}><span>Remarks</span><input placeholder="Reason / notes"/></label>
            </div>
            <div style={{marginTop:12}}>
              <button className="btn btn--primary">Export Gate Pass (PDF)</button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}