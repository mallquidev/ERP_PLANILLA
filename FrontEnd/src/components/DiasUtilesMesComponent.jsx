// src/components/DiasUtilesMesComponent.jsx
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
const row4 = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 };
const row3 = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 };
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

export default function DiasUtilesMesComponent() {
  const auth = useAuthAxios();
  const { empresaId, empresaNombre } = useGlobal() || {};

  // filtros
  const [fAno, setFAno] = useState("");
  const [fMes, setFMes] = useState("");

  // combos
  const [situaciones, setSituaciones] = useState([]);

  // grilla
  const [rows, setRows] = useState([]);

  // form
  const empty = {
    PKID: null,
    Ano: "",
    Mes: "",
    NumeroDiasUtiles: "",
    PKIDSituacionRegistro: "",
  };
  const [form, setForm] = useState(empty);
  const isEditing = form.PKID !== null;
  const [loading, setLoading] = useState(false);

  const empresaLabel =
    empresaNombre ? `${empresaNombre} (ID ${empresaId ?? "-"})` : empresaId ? `Empresa ID ${empresaId}` : "(sin empresa)";

  const loadSituaciones = async () => {
    try {
      const res = await auth.get("/dias-utiles-mes-combos/situacion");
      setSituaciones(res.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudieron cargar las situaciones.");
    }
  };

  const loadRows = async () => {
    if (!empresaId) {
      setRows([]);
      return;
    }
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("empresaId", empresaId);
      if (fAno) params.append("ano", fAno);
      if (fMes) params.append("mes", fMes);
      const res = await auth.get(`/dias-utiles-mes/?${params.toString()}`);
      setRows(res.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudo listar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSituaciones();
  }, []);
  useEffect(() => {
    loadRows();
  }, [empresaId]);

  // handlers
  const onBuscar = (e) => {
    e?.preventDefault();
    loadRows();
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onNew = () => setForm(empty);

  const onEdit = (r) => {
    setForm({
      PKID: r.PKID,
      Ano: r.Ano ?? "",
      Mes: r.Mes ?? "",
      NumeroDiasUtiles: r.NumeroDiasUtiles ?? "",
      PKIDSituacionRegistro: r.PKIDSituacionRegistro ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    if (!window.confirm("¿Eliminar registro?")) return;
    try {
      setLoading(true);
      await auth.delete(`/dias-utiles-mes/${id}`);
      await loadRows();
      onNew();
    } catch (err) {
      alert(prettyError(err));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!empresaId) {
      alert("Seleccione una empresa en el Selector de Contexto.");
      return;
    }
    // Validaciones mínimas
    if (!form.Ano || !form.Mes) {
      alert("Complete Año y Mes.");
      return;
    }
    // Payloads
    const payloadCreate = {
      PKIDEmpresa: Number(empresaId),
      Ano: Number(form.Ano),
      Mes: Number(form.Mes),
      NumeroDiasUtiles: form.NumeroDiasUtiles === "" ? null : Number(form.NumeroDiasUtiles),
      PKIDSituacionRegistro: form.PKIDSituacionRegistro ? Number(form.PKIDSituacionRegistro) : null,
    };
    const payloadUpdate = {
      Ano: Number(form.Ano),
      Mes: Number(form.Mes),
      NumeroDiasUtiles: form.NumeroDiasUtiles === "" ? null : Number(form.NumeroDiasUtiles),
      PKIDSituacionRegistro: form.PKIDSituacionRegistro ? Number(form.PKIDSituacionRegistro) : null,
    };

    try {
      setLoading(true);
      if (isEditing) {
        await auth.put(`/dias-utiles-mes/${form.PKID}`, payloadUpdate);
        alert("Actualizado.");
      } else {
        await auth.post(`/dias-utiles-mes/`, payloadCreate);
        alert("Creado.");
      }
      await loadRows();
      onNew();
    } catch (err) {
      alert(prettyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>Días Útiles por Mes</h2>

      {/* Filtros */}
      <div style={{ ...card, marginBottom: 12 }}>
        <form onSubmit={onBuscar}>
          <div style={row4}>
            <div>
              <label style={label}>Año</label>
              <input value={fAno} onChange={(e) => setFAno(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>Mes</label>
              <input value={fMes} onChange={(e) => setFMes(e.target.value)} style={input} />
            </div>
            <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
              <button type="submit" style={{ ...btn.base, ...btn.primary }}>Buscar</button>
              <button type="button" style={{ ...btn.base, ...btn.neutral }}
                onClick={() => { setFAno(""); setFMes(""); loadRows(); }}>Limpiar</button>
            </div>
            <div />
          </div>
        </form>
      </div>

      {/* Formulario */}
      <div style={{ ...card, marginBottom: 16 }}>
        <form onSubmit={onSubmit}>
          <div style={row4}>
            <div>
              <label style={label}>Empresa</label>
              <input value={empresaLabel} disabled style={{ ...input, background: "#f9fafb" }} />
            </div>
            <div>
              <label style={label}>Año *</label>
              <input name="Ano" value={form.Ano} onChange={onChange} style={input} />
            </div>
            <div>
              <label style={label}>Mes *</label>
              <input name="Mes" value={form.Mes} onChange={onChange} style={input} />
            </div>
            <div>
              <label style={label}>N° Días Útiles</label>
              <input name="NumeroDiasUtiles" value={form.NumeroDiasUtiles} onChange={onChange} style={input} />
            </div>
          </div>

          <div style={{ ...row4, marginTop: 12 }}>
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
                  <option key={s.PKID} value={s.PKID}>
                    {s.SituacionRegistro}
                  </option>
                ))}
              </select>
            </div>
            <div />
            <div />
            <div />
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button type="submit" disabled={loading} style={{ ...btn.base, ...btn.primary }}>
              {isEditing ? "Actualizar" : "Agregar"}
            </button>
            <button type="button" disabled={loading} onClick={onNew} style={{ ...btn.base, ...btn.neutral }}>
              Limpiar
            </button>
          </div>
        </form>
      </div>

      {/* Grilla */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <strong>Registros</strong>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Empresa: {empresaNombre || empresaId || "(sin empresa)"} — Total: {rows.length}
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Año</th>
                <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Mes</th>
                <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Días Útiles</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Situación</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.PKID}>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>{r.Ano}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>{r.Mes}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>
                    {r.NumeroDiasUtiles ?? ""}
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.SituacionRegistro || ""}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                    <button onClick={() => onEdit(r)} style={{ ...btn.base, ...btn.neutral, marginRight: 6 }}>✏️</button>
                    <button onClick={() => onDelete(r.PKID)} style={{ ...btn.base, ...btn.danger }}>🗑️</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
                    {empresaId ? "Sin resultados." : "Seleccione una empresa."}
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
