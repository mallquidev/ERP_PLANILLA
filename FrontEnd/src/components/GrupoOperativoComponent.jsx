// archivo: src/components/GrupoOperativoComponent.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import API_BASE_URL from "../api";
import { useGlobal } from "../GlobalContext";

const card = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 16,
  boxShadow: "0 1px 2px rgba(0,0,0,.04)",
};
const input = { width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" };
const label = { display: "block", fontSize: 12, color: "#374151", marginBottom: 4 };
const btn = {
  base: { border: "none", borderRadius: 6, padding: "7px 12px", cursor: "pointer", fontWeight: 600 },
  primary: { background: "#2563eb", color: "#fff" },
  neutral: { background: "#f3f4f6", color: "#111827" },
  danger: { background: "#ef4444", color: "#fff" },
  outline: { background: "#fff", color: "#2563eb", border: "1px solid #2563eb" },
};

export default function GrupoOperativoComponent() {
  const { token } = useGlobal(); // ya lo vienes usando así
  const auth = useMemo(() => {
    return axios.create({
      baseURL: API_BASE_URL,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }, [token]);

  // filtros
  const [fId, setFId] = useState("");
  const [fNombre, setFNombre] = useState("");
  const [fSituacion, setFSituacion] = useState("");

  // combos
  const [situaciones, setSituaciones] = useState([]);

  // grilla
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // form
  const empty = {
    PKID: null,
    IDGrupoOperativo: "",
    GrupoOperativo: "",
    PKIDSituacionRegistro: "",
  };
  const [form, setForm] = useState(empty);
  const isEditing = form.PKID !== null;

  const prettyError = (err) => {
    const d = err?.response?.data;
    if (!d) return err?.message || "Error";
    return Array.isArray(d.detail) ? d.detail.map((x) => x.msg).join("\n") : d.detail;
  };

  const loadSituaciones = async () => {
    try {
      const r = await auth.get("/grupo-operativo-combos/situacion");
      setSituaciones(r.data || []);
    } catch {
      alert("No se pudo cargar Situación.");
    }
  };

  const buildQuery = (withPaging = true) => {
    const qs = new URLSearchParams();
    if (fId) qs.append("idgrupo", fId);
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
      const res = await auth.get(`/grupo-operativo/?${buildQuery(true)}`);
      setRows(res.data?.items || []);
      setTotal(res.data?.total ?? 0);
    } catch (err) {
      console.error(err);
      alert("No se pudo listar Grupo Operativo.");
    }
  };

  useEffect(() => {
    loadSituaciones();
  }, []); // eslint-disable-line

  useEffect(() => {
    loadRows();
  }, [page, pageSize]); // eslint-disable-line

  const onFilter = (e) => {
    e?.preventDefault();
    setPage(1);
    loadRows();
  };

  const onClearFilter = () => {
    setFId("");
    setFNombre("");
    setFSituacion("");
    setPage(1);
    loadRows();
  };

  const onNew = () => {
    setForm(empty);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onEdit = (r) => {
    setForm({
      PKID: r.PKID,
      IDGrupoOperativo: r.IDGrupoOperativo ?? "",
      GrupoOperativo: r.GrupoOperativo ?? "",
      PKIDSituacionRegistro: r.PKIDSituacionRegistro ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    if (!window.confirm("¿Eliminar registro?")) return;
    try {
      await auth.delete(`/grupo-operativo/${id}`);
      await loadRows();
      onNew();
    } catch (err) {
      alert(prettyError(err));
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validateClient = () => {
    if (!form.IDGrupoOperativo) return "IDGrupoOperativo es obligatorio.";
    if (!/^-?\d+$/.test(String(form.IDGrupoOperativo))) return "IDGrupoOperativo debe ser entero.";
    if (!String(form.GrupoOperativo || "").trim()) return "GrupoOperativo es obligatorio.";
    if (String(form.GrupoOperativo).length > 50) return "GrupoOperativo máximo 50 caracteres.";
    if (!form.PKIDSituacionRegistro) return "Situación es obligatoria.";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const err = validateClient();
    if (err) {
      alert(err);
      return;
    }
    const payload = {
      IDGrupoOperativo: Number(form.IDGrupoOperativo),
      GrupoOperativo: String(form.GrupoOperativo || "").trim(),
      PKIDSituacionRegistro: Number(form.PKIDSituacionRegistro),
    };
    try {
      if (isEditing) {
        await auth.put(`/grupo-operativo/${form.PKID}`, payload);
        alert("Actualizado.");
      } else {
        await auth.post(`/grupo-operativo/`, payload);
        alert("Creado.");
      }
      await loadRows();
      onNew();
    } catch (err2) {
      alert(prettyError(err2));
    }
  };

  const exportCSV = async () => {
    try {
      const qs = buildQuery(false);
      const res = await auth.get(`/grupo-operativo/export?${qs}`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "grupo_operativo.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("No se pudo exportar CSV.");
    }
  };

  const exportXLSX = async () => {
    try {
      const qs = buildQuery(false);
      const res = await auth.get(`/grupo-operativo/export-xlsx?${qs}`, { responseType: "blob" });
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "grupo_operativo.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("No se pudo exportar XLSX.");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Grupo Operativo</h2>

      {/* Formulario */}
      <div style={{ ...card, marginBottom: 16 }}>
        <form onSubmit={onSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <div>
              <label style={label}>ID Grupo Operativo *</label>
              <input
                name="IDGrupoOperativo"
                value={form.IDGrupoOperativo}
                onChange={onChange}
                style={input}
              />
            </div>
            <div>
              <label style={label}>Grupo Operativo *</label>
              <input
                name="GrupoOperativo"
                value={form.GrupoOperativo}
                onChange={onChange}
                style={input}
                maxLength={50}
              />
            </div>
            <div>
              <label style={label}>Situación *</label>
              <select
                name="PKIDSituacionRegistro"
                value={form.PKIDSituacionRegistro}
                onChange={onChange}
                style={input}
              >
                <option value="">-- Seleccionar --</option>
                {situaciones.map((s) => (
                  <option key={s.PKID} value={s.PKID}>
                    {s.SituacionRegistro}
                  </option>
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

      {/* Filtros */}
      <div style={{ ...card, marginBottom: 8 }}>
        <form onSubmit={onFilter}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            <div>
              <label style={label}>ID Grupo Operativo</label>
              <input value={fId} onChange={(e) => setFId(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>Grupo Operativo</label>
              <input value={fNombre} onChange={(e) => setFNombre(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>Situación</label>
              <select value={fSituacion} onChange={(e) => setFSituacion(e.target.value)} style={input}>
                <option value="">-- Todas --</option>
                {situaciones.map((s) => (
                  <option key={s.PKID} value={s.PKID}>
                    {s.SituacionRegistro}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
              <button type="submit" style={{ ...btn.base, ...btn.primary }}>
                Buscar
              </button>
              <button type="button" onClick={onClearFilter} style={{ ...btn.base, ...btn.neutral }}>
                Limpiar
              </button>
            </div>
            <div />
          </div>
        </form>
      </div>

      {/* Grilla */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <strong>Registros</strong>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Mostrando {total === 0 ? 0 : (page - 1) * pageSize + 1}-
              {Math.min(total, page * pageSize)} de {total}
            </span>
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
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              style={{ ...input, width: 90 }}
            >
              {[10, 20, 50, 100, 200].map((n) => (
                <option key={n} value={n}>
                  {n}/pág
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(total / pageSize)), p + 1))}
              disabled={page >= Math.max(1, Math.ceil(total / pageSize))}
              style={{
                ...btn.base,
                ...btn.neutral,
                opacity: page >= Math.max(1, Math.ceil(total / pageSize)) ? 0.5 : 1,
              }}
            >
              ▶
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>
                  ID Grupo Operativo
                </th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>
                  Grupo Operativo
                </th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>
                  Situación
                </th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.PKID}>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.IDGrupoOperativo}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.GrupoOperativo}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.SituacionRegistro}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                    <button
                      onClick={() => onEdit(r)}
                      style={{ ...btn.base, ...btn.neutral, marginRight: 6 }}
                    >
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
