// archivo: src/components/FamiliaRemuneracionVariableComponent.jsx
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
  outline: { background: "#fff", color: "#2563eb", border: "1px solid #2563eb" },
};

function prettyError(err) {
  const d = err?.response?.data;
  if (!d) return err?.message || "Error";
  if (Array.isArray(d.detail))
    return d.detail.map((e) => `• ${(Array.isArray(e.loc) ? e.loc.join(".") : e.loc)}: ${e.msg}`).join("\n");
  return String(d.detail || "Error");
}

export default function FamiliaRemuneracionVariableComponent() {
  const auth = useAuthAxios();

  // filtros
  const [fId, setFId] = useState("");
  const [fNombre, setFNombre] = useState("");
  const [fSituacion, setFSituacion] = useState("");

  // combos
  const [situaciones, setSituaciones] = useState([]);

  // grilla + paginación
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // selección fila + form
  const [selected, setSelected] = useState(null);
  const empty = {
    PKID: null,
    IDFamiliaRemuneracionVariable: "",
    FamiliaRemuneracionVariable: "",
    PKIDSituacionRegistro: "",
  };
  const [form, setForm] = useState(empty);
  const isEditing = form.PKID !== null;

  // combos
  const loadSituaciones = async () => {
    try {
      const r = await auth.get(`/familia-remuneracion-variable-combos/situacion`);
      setSituaciones(r.data || []);
    } catch {
      alert("No se pudo cargar Situación.");
    }
  };

  // build query
  const buildQuery = (withPaging = true) => {
    const qs = new URLSearchParams();
    if (fId) qs.append("id_codigo", fId);
    if (fNombre) qs.append("nombre", fNombre);
    if (fSituacion) qs.append("situacion_id", fSituacion);
    if (withPaging) {
      qs.append("page", String(page));
      qs.append("page_size", String(pageSize));
    }
    return qs.toString();
  };

  const loadRows = async () => {
    try {
      const url = `/familia-remuneracion-variable/?${buildQuery(true)}`;
      const res = await auth.get(url);
      setRows(res.data?.items || []);
      setTotal(res.data?.total ?? 0);
    } catch (err) {
      console.error(err);
      alert("No se pudo listar.");
    }
  };

  useEffect(() => {
    loadSituaciones();
  }, []);
  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const onFilter = (e) => { e?.preventDefault(); setPage(1); loadRows(); };
  const onClearFilter = () => { setFId(""); setFNombre(""); setFSituacion(""); setPage(1); loadRows(); };

  const onNew = () => {
    setSelected(null);
    setForm(empty);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onEdit = (r) => {
    setSelected(r);
    setForm({
      PKID: r.PKID,
      IDFamiliaRemuneracionVariable: r.IDFamiliaRemuneracionVariable ?? "",
      FamiliaRemuneracionVariable: r.FamiliaRemuneracionVariable ?? "",
      PKIDSituacionRegistro: r.PKIDSituacionRegistro ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    if (!window.confirm("¿Eliminar registro?")) return;
    try {
      await auth.delete(`/familia-remuneracion-variable/${id}`);
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
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const validateClient = () => {
    if (!form.IDFamiliaRemuneracionVariable) return "El ID es obligatorio.";
    if (Number.isNaN(Number(form.IDFamiliaRemuneracionVariable)) || Number(form.IDFamiliaRemuneracionVariable) <= 0)
      return "El ID debe ser entero positivo.";
    const name = String(form.FamiliaRemuneracionVariable || "").trim();
    if (!name) return "El nombre es obligatorio.";
    if (name.length > 50) return "El nombre no debe superar 50 caracteres.";
    return null;
    };

  const onSubmit = async (e) => {
    e.preventDefault();
    const clientErr = validateClient();
    if (clientErr) { alert(clientErr); return; }

    const payload = {
      IDFamiliaRemuneracionVariable: Number(form.IDFamiliaRemuneracionVariable),
      FamiliaRemuneracionVariable: String(form.FamiliaRemuneracionVariable || "").trim(),
      PKIDSituacionRegistro: form.PKIDSituacionRegistro === "" ? null : Number(form.PKIDSituacionRegistro),
    };
    try {
      if (isEditing) {
        await auth.put(`/familia-remuneracion-variable/${form.PKID}`, payload);
        alert("Actualizado.");
      } else {
        await auth.post(`/familia-remuneracion-variable/`, payload);
        alert("Creado.");
      }
      await loadRows();
      onNew();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  // export
  const exportCSV = async () => {
    try {
      const qs = buildQuery(false);
      const res = await auth.get(`/familia-remuneracion-variable/export?${qs}`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "familia_remuneracion_variable.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("No se pudo exportar CSV.");
    }
  };

  const exportXLSX = async () => {
    try {
      const qs = buildQuery(false);
      const res = await auth.get(`/familia-remuneracion-variable/export-xlsx?${qs}`, { responseType: "blob" });
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "familia_remuneracion_variable.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("No se pudo exportar XLSX.");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  const cell = { padding: 8, borderBottom: "1px solid #f3f4f6" };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Familia Remuneración Variable</h2>

      {/* Formulario */}
      <div style={{ ...card, marginBottom: 16 }}>
        <form onSubmit={onSubmit}>
          <div style={row4}>
            <div>
              <label style={label}>ID *</label>
              <input
                name="IDFamiliaRemuneracionVariable"
                value={form.IDFamiliaRemuneracionVariable}
                onChange={onChange}
                style={input}
              />
            </div>
            <div>
              <label style={label}>Nombre *</label>
              <input
                name="FamiliaRemuneracionVariable"
                value={form.FamiliaRemuneracionVariable}
                onChange={onChange}
                style={input}
                maxLength={50}
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

          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="submit" style={{ ...btn.base, ...btn.primary }}>
              {isEditing ? "Actualizar" : "Agregar"}
            </button>
            <button type="button" onClick={onNew} style={{ ...btn.base, ...btn.neutral }}>
              Limpiar
            </button>
            <button type="button" onClick={exportCSV} style={{ ...btn.base, ...btn.outline }}>
              Exportar CSV
            </button>
            <button type="button" onClick={exportXLSX} style={{ ...btn.base, ...btn.outline }}>
              Exportar XLSX
            </button>
          </div>
        </form>
      </div>

      {/* Filtros encima de la grilla */}
      <div style={{ ...card, marginBottom: 8 }}>
        <form onSubmit={onFilter}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr 1fr", gap: 12 }}>
            <div>
              <label style={label}>ID</label>
              <input value={fId} onChange={(e) => setFId(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>Nombre</label>
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
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
          <strong>Registros</strong>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Mostrando {start}-{end} de {total}
            </span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{ ...btn.base, ...btn.neutral, opacity: page <= 1 ? 0.5 : 1 }}
              >
                ◀
              </button>
              <span style={{ fontSize: 12 }}>Página</span>
              <input
                value={page}
                onChange={(e) => {
                  const v = Number(e.target.value) || 1;
                  const maxp = Math.max(1, Math.ceil(total / pageSize));
                  setPage(Math.min(Math.max(1, v), maxp));
                }}
                style={{ ...input, width: 60 }}
              />
              <span style={{ fontSize: 12 }}>/ {Math.max(1, Math.ceil(total / pageSize))}</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ ...input, width: 90 }}
              >
                {[10, 20, 50, 100, 200].map((n) => (
                  <option key={n} value={n}>{n}/pág</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(total / pageSize)), p + 1))}
                disabled={page >= Math.max(1, Math.ceil(total / pageSize))}
                style={{ ...btn.base, ...btn.neutral, opacity: page >= Math.max(1, Math.ceil(total / pageSize)) ? 0.5 : 1 }}
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>ID</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Nombre</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Situación</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.PKID} style={selected?.PKID === r.PKID ? { background: "#fef3c7" } : undefined}>
                  <td style={cell}>{r.IDFamiliaRemuneracionVariable}</td>
                  <td style={cell}>{r.FamiliaRemuneracionVariable}</td>
                  <td style={cell}>{r.SituacionRegistro}</td>
                  <td style={{ ...cell, textAlign: "center" }}>
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
