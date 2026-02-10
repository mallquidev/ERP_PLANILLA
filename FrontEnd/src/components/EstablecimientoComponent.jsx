// archivo: src/components/EstablecimientoComponent.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../api";
import { useGlobal } from "../GlobalContext";

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
const row3 = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 };
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

export default function EstablecimientoComponent() {
  const auth = useAuthAxios();
  const { empresaId, empresaNombre } = useGlobal() || {};

  // combos
  const [tipos, setTipos] = useState([]);
  const [situaciones, setSituaciones] = useState([]);

  // grilla
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);

  // filtros
  const [fId, setFId] = useState("");
  const [fNombre, setFNombre] = useState("");
  const [fTipo, setFTipo] = useState("");
  const [fSituacion, setFSituacion] = useState("");

  // form
  const empty = {
    PKID: null,
    PKIDEmpresa: null, // viene del contexto
    IDEstablecimiento: "",
    NombreEstablecimiento: "",
    PKIDTipoEstablecimiento: "",
    IndicadorCentroDeRiesgoCheck: false,
    TasaEstablecimiento: "",
    PKIDSituacionRegistro: "",
  };
  const [form, setForm] = useState(empty);
  const isEditing = form.PKID !== null;

  const loadCombos = async () => {
    try {
      const [cTipo, cSit] = await Promise.all([
        auth.get(`/establecimiento-combos/tipo-establecimiento/`),
        auth.get(`/establecimiento-combos/situacion/`),
      ]);
      setTipos(cTipo.data || []);
      setSituaciones(cSit.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudieron cargar los combos.");
    }
  };

  const loadRows = async () => {
    if (!empresaId) return; // esperamos a que contexto tenga empresa
    try {
      const qs = new URLSearchParams({ empresaId: String(empresaId) });
      if (fId) qs.append("id_est", fId);
      if (fNombre) qs.append("nombre", fNombre);
      if (fTipo) qs.append("tipo_id", fTipo);
      if (fSituacion) qs.append("situacion_id", fSituacion);
      const url = `/establecimiento/?${qs.toString()}`;
      const r = await auth.get(url);
      setRows(r.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudo listar Establecimientos.");
    }
  };

  // Inicializa combos/lista al montar o al cambiar empresaId
  useEffect(() => {
    loadCombos();
  }, []);
  useEffect(() => {
    // cuando cambie empresaId, resetear form con PKIDEmpresa del contexto y recargar lista
    setForm((f) => ({ ...empty, PKIDEmpresa: empresaId || null }));
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  const onFilter = (e) => { e?.preventDefault(); loadRows(); };
  const onClearFilter = () => {
    setFId(""); setFNombre(""); setFTipo(""); setFSituacion("");
    loadRows();
  };

  const onNew = () => {
    setSelected(null);
    setForm({ ...empty, PKIDEmpresa: empresaId || null });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onEdit = (r) => {
    setSelected(r);
    setForm({
      PKID: r.PKID,
      PKIDEmpresa: r.PKIDEmpresa,
      IDEstablecimiento: r.IDEstablecimiento ?? "",
      NombreEstablecimiento: r.NombreEstablecimiento ?? "",
      PKIDTipoEstablecimiento: r.PKIDTipoEstablecimiento ?? "",
      IndicadorCentroDeRiesgoCheck: Boolean(r.IndicadorCentroDeRiesgoCheck),
      TasaEstablecimiento: r.TasaEstablecimiento ?? "",
      PKIDSituacionRegistro: r.PKIDSituacionRegistro ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    if (!window.confirm("¿Eliminar establecimiento?")) return;
    try {
      await auth.delete(`/establecimiento/${id}`);
      await loadRows();
      if (selected?.PKID === id) setSelected(null);
      onNew();
      alert("Eliminado.");
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const onChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const toNumberOrNull = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!empresaId) {
      alert("Seleccione una empresa en el selector superior.");
      return;
    }
    const payload = {
      PKIDEmpresa: Number(empresaId),
      IDEstablecimiento: Number(form.IDEstablecimiento),
      NombreEstablecimiento: String(form.NombreEstablecimiento || "").trim(),
      PKIDTipoEstablecimiento: Number(form.PKIDTipoEstablecimiento),
      IndicadorCentroDeRiesgoCheck: Boolean(form.IndicadorCentroDeRiesgoCheck),
      TasaEstablecimiento: toNumberOrNull(form.TasaEstablecimiento),
      PKIDSituacionRegistro: toNumberOrNull(form.PKIDSituacionRegistro),
    };
    try {
      if (isEditing) {
        await auth.put(`/establecimiento/${form.PKID}`, payload);
        alert("Actualizado.");
      } else {
        await auth.post(`/establecimiento/`, payload);
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
      <h2 style={{ marginBottom: 12 }}>Establecimientos</h2>

      {/* Formulario */}
      <div style={{ ...card, marginBottom: 16 }}>
        <form onSubmit={onSubmit}>
          <div style={row4}>
            <div>
              <label style={label}>Empresa</label>
              <input value={empresaNombre || ""} disabled style={input} />
            </div>
            <div>
              <label style={label}>ID Establecimiento *</label>
              <input name="IDEstablecimiento" value={form.IDEstablecimiento} onChange={onChange} style={input} />
            </div>
            <div>
              <label style={label}>Nombre Establecimiento *</label>
              <input name="NombreEstablecimiento" value={form.NombreEstablecimiento} onChange={onChange} style={input} />
            </div>
            <div>
              <label style={label}>Tipo Establecimiento *</label>
              <select
                name="PKIDTipoEstablecimiento"
                value={form.PKIDTipoEstablecimiento}
                onChange={onChange}
                style={input}
              >
                <option value="">-- Seleccionar --</option>
                {tipos.map((t) => (
                  <option key={t.PKID} value={t.PKID}>{t.TipoEstablecimiento}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ ...row4, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 22 }}>
              <input
                type="checkbox"
                name="IndicadorCentroDeRiesgoCheck"
                checked={!!form.IndicadorCentroDeRiesgoCheck}
                onChange={onChange}
              />
              <span>Centro de riesgo</span>
            </div>
            <div>
              <label style={label}>Tasa Establecimiento</label>
              <input
                name="TasaEstablecimiento"
                value={form.TasaEstablecimiento}
                onChange={onChange}
                style={input}
                placeholder="e.g. 1.5000"
              />
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={label}>ID Establecimiento</label>
              <input value={fId} onChange={(e) => setFId(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>Nombre</label>
              <input value={fNombre} onChange={(e) => setFNombre(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>Tipo</label>
              <select value={fTipo} onChange={(e) => setFTipo(e.target.value)} style={input}>
                <option value="">-- Todos --</option>
                {tipos.map((t) => (
                  <option key={t.PKID} value={t.PKID}>{t.TipoEstablecimiento}</option>
                ))}
              </select>
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
          <strong>Establecimientos</strong>
          <span style={{ fontSize: 12, color: "#6b7280" }}>Total: {rows.length}</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>ID</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Nombre</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Tipo</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Centro Riesgo</th>
                <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Tasa</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Situación</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.PKID} style={selected?.PKID === r.PKID ? { background: "#fef3c7" } : undefined}>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.IDEstablecimiento}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.NombreEstablecimiento}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.TipoEstablecimiento}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                    {r.IndicadorCentroDeRiesgoCheck ? "Sí" : "No"}
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>
                    {r.TasaEstablecimiento ?? ""}
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.SituacionRegistro ?? ""}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                    <button onClick={() => onEdit(r)} style={{ ...btn.base, ...btn.neutral, marginRight: 6 }}>✏️</button>
                    <button onClick={() => onDelete(r.PKID)} style={{ ...btn.base, ...btn.danger }}>🗑️</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
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
