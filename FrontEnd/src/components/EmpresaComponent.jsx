// archivo: src/components/EmpresaComponent.jsx
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

export default function EmpresaComponent() {
  const auth = useAuthAxios();

  // filtros grilla
  const [fIDE, setFIDE] = useState("");
  const [fRazon, setFRazon] = useState("");
  const [fRuc, setFRuc] = useState("");

  // combos
  const [regimenes, setRegimenes] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [situaciones, setSituaciones] = useState([]);
  const [otrasEmpresas, setOtrasEmpresas] = useState([]);

  // grilla
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  // form
  const empty = {
    PKID: null,
    IDEmpresa: "",
    RazonSocial: "",
    NumeroRuc: "",
    PKIDRegimenTributario: "",
    PKIDSituacionRegistro: "",
    PKIDSectorEconomico: "",
    Direccion: "",
    RegistroPatronal: "",
    PKIDOtraEmpresa: "",
    Siglas: "",
  };
  const [form, setForm] = useState(empty);
  const isEditing = form.PKID !== null;

  const loadCombos = async () => {
    try {
      const [c1, c2, c3] = await Promise.all([
        auth.get(`/empresa-combos/regimen/`),
        auth.get(`/empresa-combos/sector/`),
        auth.get(`/empresa-combos/situacion/`),
      ]);
      setRegimenes(c1.data || []);
      setSectores(c2.data || []);
      setSituaciones(c3.data || []);
      // otras empresas se cargan aparte (para poder excluirse si estoy editando)
      await loadOtrasEmpresas(null);
    } catch (err) {
      console.error(err);
      alert("No se pudieron cargar los combos.");
    }
  };

  const loadOtrasEmpresas = async (excludeId) => {
    try {
      const url = excludeId ? `/empresa-combos/otra-empresa/?exclude_id=${excludeId}` : `/empresa-combos/otra-empresa/`;
      const r = await auth.get(url);
      setOtrasEmpresas(r.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRows = async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      if (fIDE) qs.append("ide", fIDE);
      if (fRazon) qs.append("razon", fRazon);
      if (fRuc) qs.append("ruc", fRuc);
      const url = qs.toString() ? `/empresa/?${qs.toString()}` : `/empresa/`;
      const res = await auth.get(url);
      setRows(res.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudo listar empresas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCombos();
    loadRows();
  }, []);

  // cuando entro en edición, recargo "otras empresas" excluyéndome
  useEffect(() => {
    if (isEditing) loadOtrasEmpresas(form.PKID);
    else loadOtrasEmpresas(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, form.PKID]);

  const onFilter = (e) => {
    e?.preventDefault();
    loadRows();
  };
  const onClearFilter = () => {
    setFIDE("");
    setFRazon("");
    setFRuc("");
    loadRows();
  };

  const onNew = () => {
    setForm(empty);
    setSelected(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onEdit = (r) => {
    setSelected(r);
    setForm({
      PKID: r.PKID,
      IDEmpresa: r.IDEmpresa ?? "",
      RazonSocial: r.RazonSocial ?? "",
      NumeroRuc: r.NumeroRuc ?? "",
      PKIDRegimenTributario: r.PKIDRegimenTributario ?? "",
      PKIDSituacionRegistro: r.PKIDSituacionRegistro ?? "",
      PKIDSectorEconomico: r.PKIDSectorEconomico ?? "",
      Direccion: r.Direccion ?? "",
      RegistroPatronal: r.RegistroPatronal ?? "",
      PKIDOtraEmpresa: r.PKIDOtraEmpresa ?? "",
      Siglas: r.Siglas ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    if (!window.confirm("¿Eliminar empresa?")) return;
    try {
      await auth.delete(`/empresa/${id}`);
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

  const toNumberOrNull = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      IDEmpresa: Number(form.IDEmpresa),
      RazonSocial: String(form.RazonSocial || "").trim(),
      NumeroRuc: String(form.NumeroRuc || "").trim(),
      PKIDRegimenTributario: Number(form.PKIDRegimenTributario),
      PKIDSituacionRegistro: Number(form.PKIDSituacionRegistro),
      PKIDSectorEconomico: Number(form.PKIDSectorEconomico),
      Direccion: String(form.Direccion || "").trim(),
      RegistroPatronal: form.RegistroPatronal?.trim() || null,
      PKIDOtraEmpresa: toNumberOrNull(form.PKIDOtraEmpresa),
      Siglas: form.Siglas?.trim() || null,
    };
    try {
      if (isEditing) {
        await auth.put(`/empresa/${form.PKID}`, payload);
        alert("Actualizado.");
      } else {
        await auth.post(`/empresa/`, payload);
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
      <h2 style={{ marginBottom: 12 }}>Empresa</h2>

      {/* Formulario */}
      <div style={{ ...card, marginBottom: 16 }}>
        <form onSubmit={onSubmit}>
          <div style={row4}>
            <div>
              <label style={label}>ID Empresa *</label>
              <input name="IDEmpresa" value={form.IDEmpresa} onChange={onChange} style={input} />
            </div>
            <div>
              <label style={label}>Razón Social *</label>
              <input name="RazonSocial" value={form.RazonSocial} onChange={onChange} style={input} />
            </div>
            <div>
              <label style={label}>RUC *</label>
              <input name="NumeroRuc" value={form.NumeroRuc} onChange={onChange} style={input} />
            </div>
            <div>
              <label style={label}>Siglas</label>
              <input name="Siglas" value={form.Siglas} onChange={onChange} style={input} />
            </div>
          </div>

          <div style={{ ...row4, marginTop: 12 }}>
            <div>
              <label style={label}>Régimen Tributario *</label>
              <select name="PKIDRegimenTributario" value={form.PKIDRegimenTributario} onChange={onChange} style={input}>
                <option value="">-- Seleccionar --</option>
                {regimenes.map((r) => (
                  <option key={r.PKID} value={r.PKID}>
                    {r.RegimenTributario}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={label}>Sector Económico *</label>
              <select name="PKIDSectorEconomico" value={form.PKIDSectorEconomico} onChange={onChange} style={input}>
                <option value="">-- Seleccionar --</option>
                {sectores.map((s) => (
                  <option key={s.PKID} value={s.PKID}>
                    {s.SectorEconomico}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={label}>Situación *</label>
              <select name="PKIDSituacionRegistro" value={form.PKIDSituacionRegistro} onChange={onChange} style={input}>
                <option value="">-- Seleccionar --</option>
                {situaciones.map((s) => (
                  <option key={s.PKID} value={s.PKID}>
                    {s.SituacionRegistro}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={label}>Otra Empresa (opcional)</label>
              <select name="PKIDOtraEmpresa" value={form.PKIDOtraEmpresa} onChange={onChange} style={input}>
                <option value="">-- Ninguna --</option>
                {otrasEmpresas.map((e) => (
                  <option key={e.PKID} value={e.PKID}>
                    {e.RazonSocial}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ ...row3, marginTop: 12 }}>
            <div>
              <label style={label}>Dirección *</label>
              <input name="Direccion" value={form.Direccion} onChange={onChange} style={input} />
            </div>
            <div>
              <label style={label}>Registro Patronal</label>
              <input name="RegistroPatronal" value={form.RegistroPatronal} onChange={onChange} style={input} />
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
              <label style={label}>ID Empresa</label>
              <input value={fIDE} onChange={(e) => setFIDE(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>Razón Social</label>
              <input value={fRazon} onChange={(e) => setFRazon(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>RUC</label>
              <input value={fRuc} onChange={(e) => setFRuc(e.target.value)} style={input} />
            </div>
            <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
              <button type="submit" style={{ ...btn.base, ...btn.primary }}>
                Buscar
              </button>
              <button type="button" onClick={onClearFilter} style={{ ...btn.base, ...btn.neutral }}>
                Limpiar
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Grilla */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <strong>Empresas</strong>
          <span style={{ fontSize: 12, color: "#6b7280" }}>Total: {rows.length}</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>ID</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Razón Social</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>RUC</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Régimen</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Sector</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Situación</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Otra Empresa</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.PKID} style={selected?.PKID === r.PKID ? { background: "#fef3c7" } : undefined}>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.IDEmpresa}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.RazonSocial}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.NumeroRuc}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.RegimenTributario}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.SectorEconomico}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.SituacionRegistro}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.OtraEmpresa ?? ""}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                    <button onClick={() => onEdit(r)} style={{ ...btn.base, ...btn.neutral, marginRight: 6 }}>
                      ✏️
                    </button>
                    <button onClick={() => onDelete(r.PKID)} style={{ ...btn.base, ...btn.danger }}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
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
