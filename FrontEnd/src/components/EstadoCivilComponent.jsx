// archivo: src/components/EstadoCivilComponent.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../api";

function useAuthAxios() {
  const token = localStorage.getItem("token");
  return useMemo(
    () =>
      axios.create({
        baseURL: API_BASE_URL,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    [token]
  );
}

const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,.05)" };
const input = { width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" };
const label = { display: "block", fontSize: 12, color: "#374151", marginBottom: 4 };
const row4 = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 };
const btn = {
  base: { border: "none", borderRadius: 6, padding: "8px 12px", cursor: "pointer", fontWeight: 600 },
  primary: { background: "#2563eb", color: "#fff" },
  neutral: { background: "#f3f4f6", color: "#111827" },
  danger: { background: "#ef4444", color: "#fff" },
};

function prettyError(err) {
  const d = err?.response?.data;
  if (!d) return err?.message || "Error";
  if (Array.isArray(d.detail))
    return d.detail.map((e) => `• ${(Array.isArray(e.loc) ? e.loc.join(".") : e.loc)}: ${e.msg}`).join("\n");
  return String(d.detail || "Error");
}

export default function EstadoCivilComponent() {
  const auth = useAuthAxios();

  // filtros
  const [fId, setFId] = useState("");
  const [fNombre, setFNombre] = useState("");
  const [fSituacion, setFSituacion] = useState("");

  // combos
  const [situaciones, setSituaciones] = useState([]);

  // grilla
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);

  // form
  const empty = {
    PKID: null,
    IDEstadoCivil: "",
    EstadoCivil: "",
    PKIDSituacionRegistro: "",
  };
  const [form, setForm] = useState(empty);
  const isEditing = form.PKID !== null;

  const loadSituaciones = async () => {
    try {
      const r = await auth.get(`/estado-civil-combos/situacion/`);
      setSituaciones(r.data || []);
    } catch {
      alert("No se pudo cargar Situación.");
    }
  };

  const loadRows = async () => {
    try {
      const qs = new URLSearchParams();
      if (fId) qs.append("id_estado", fId);
      if (fNombre) qs.append("nombre", fNombre);
      if (fSituacion) qs.append("situacion_id", fSituacion);
      const url = qs.toString() ? `/estado-civil/?${qs.toString()}` : `/estado-civil/`;
      const res = await auth.get(url);
      setRows(res.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudo listar Estados Civiles.");
    }
  };

  useEffect(() => {
    loadSituaciones();
    loadRows();
  }, []);

  const onFilter = (e) => { e?.preventDefault(); loadRows(); };
  const onClearFilter = () => { setFId(""); setFNombre(""); setFSituacion(""); loadRows(); };

  const onNew = () => {
    setSelected(null);
    setForm(empty);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onEdit = (r) => {
    setSelected(r);
    setForm({
      PKID: r.PKID,
      IDEstadoCivil: r.IDEstadoCivil ?? "",
      EstadoCivil: r.EstadoCivil ?? "",
      PKIDSituacionRegistro: r.PKIDSituacionRegistro ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    if (!window.confirm("¿Eliminar Estado Civil?")) return;
    try {
      await auth.delete(`/estado-civil/${id}`);
      await loadRows();
      if (selected?.PKID === id) setSelected(null);
      onNew();
      alert("Eliminado.");
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      IDEstadoCivil: Number(form.IDEstadoCivil),
      EstadoCivil: String(form.EstadoCivil || "").trim(),
      PKIDSituacionRegistro: form.PKIDSituacionRegistro ? Number(form.PKIDSituacionRegistro) : null,
    };
    try {
      if (isEditing) {
        await auth.put(`/estado-civil/${form.PKID}`, payload);
        alert("Actualizado.");
      } else {
        await auth.post(`/estado-civil/`, payload);
        alert("Creado.");
      }
      await loadRows();
      onNew();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Estado Civil</h2>

      {/* Formulario */}
      <div style={{ ...card, marginBottom: 16 }}>
        <form onSubmit={onSubmit}>
          <div style={row4}>
            <div>
              <label style={label}>ID Estado Civil *</label>
              <input name="IDEstadoCivil" value={form.IDEstadoCivil} onChange={onChange} style={input} />
            </div>
            <div>
              <label style={label}>Estado Civil *</label>
              <input name="EstadoCivil" value={form.EstadoCivil} onChange={onChange} style={input} />
            </div>
            <div>
              <label style={label}>Situación</label>
              <select
                name="PKIDSituacionRegistro"
                value={form.PKIDSituacionRegistro}
                onChange={onChange}
                style={input}
              >
                <option value="">-- Seleccionar --</option>
                {situaciones.map((s) => (
                  <option key={s.PKID} value={s.PKID}>{s.SituacionRegistro}</option>
                ))}
              </select>
            </div>
            <div />
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button type="submit" style={{ ...btn.base, ...btn.primary }}>
              {isEditing ? "Actualizar" : "Agregar"}
            </button>
            <button type="button" onClick={onNew} style={{ ...btn.base, ...btn.neutral }}>
              Limpiar
            </button>
          </div>
        </form>
      </div>

      {/* Filtros (encima de la grilla) */}
      <div style={{ ...card, marginBottom: 8 }}>
        <form onSubmit={onFilter}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr 1fr", gap: 12 }}>
            <div>
              <label style={label}>ID Estado Civil</label>
              <input value={fId} onChange={(e) => setFId(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>Estado Civil</label>
              <input value={fNombre} onChange={(e) => setFNombre(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>Situación</label>
              <select value={fSituacion} onChange={(e) => setFSituacion(e.target.value)} style={input}>
                <option value="">-- Todas --</option>
                {situaciones.map((s) => (
                  <option key={s.PKID} value={s.PKID}>{s.SituacionRegistro}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
              <button type="submit" style={{ ...btn.base, ...btn.primary }}>Buscar</button>
              <button type="button" onClick={onClearFilter} style={{ ...btn.base, ...btn.neutral }}>Limpiar</button>
            </div>
          </div>
        </form>
      </div>

      {/* Grilla */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <strong>Estados Civiles</strong>
          <span style={{ fontSize: 12, color: "#6b7280" }}>Total: {rows.length}</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>ID</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Estado Civil</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Situación</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.PKID} style={selected?.PKID === r.PKID ? { background: "#fef3c7" } : undefined}>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.IDEstadoCivil}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.EstadoCivil}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.SituacionRegistro ?? ""}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                    <button onClick={() => onEdit(r)} style={{ ...btn.base, ...btn.neutral, marginRight: 6 }}>✏️</button>
                    <button onClick={() => onDelete(r.PKID)} style={{ ...btn.base, ...btn.danger }}>🗑️</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
                    Sin resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
