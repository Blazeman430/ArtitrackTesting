import React from "react";
import { Modal } from "../../components/Modal";

export function EditItemModal({ open, onClose, item }) {
  const [form, setForm] = React.useState({
    name: "",
    location: "",
    min: 0,
    imageFile: null,
    previewUrl: "",
  });

  React.useEffect(() => {
    if (item) {
      setForm({
        name: item.name || "",
        location: item.location || "",
        min: item.min ?? 0,
        imageFile: null,
        previewUrl: item.imageUrl || "",
      });
    }
  }, [item]);

  function onChange(e){
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === "min" ? Number(value) : value }));
  }

  function onPickFile(e){
    const file = e.target.files?.[0] || null;
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm(f => ({ ...f, imageFile: file, previewUrl: url }));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit Item${item?.sku ? ` — ${item.sku}` : ""}`}
      actions={(
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={onClose}>Save</button>
        </>
      )}
    >
      <div className="grid-2">
        <label><span>Name</span>
          <input name="name" value={form.name} onChange={onChange} />
        </label>
        <label><span>Min</span>
          <input name="min" type="number" min="0" value={form.min} onChange={onChange} />
        </label>
        <label style={{gridColumn:"1/-1"}}><span>Location</span>
          <input name="location" value={form.location} onChange={onChange} />
        </label>
        <div style={{gridColumn:"1/-1", display:"grid", gap:8}}>
          <span>Image</span>
          <div style={{display:"flex", gap:12, alignItems:"center"}}>
            <div style={{width:64,height:64,borderRadius:10,background:"#f3f4f6",display:"grid",placeItems:"center",overflow:"hidden"}}>
              {form.previewUrl ? (
                <img src={form.previewUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />
              ) : (
                <span className="muted" style={{fontSize:12}}>No image</span>
              )}
            </div>
            <label className="btn">
              <input type="file" accept="image/*" onChange={onPickFile} style={{display:"none"}} />
              Upload…
            </label>
            {form.previewUrl && (
              <button className="btn" onClick={()=>setForm(f=>({...f, imageFile:null, previewUrl:""}))}>Remove</button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
