// src/components/CuentaContableComponent.jsx
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

export default function CuentaContableComponent() {
  const auth = useAuthAxios();
  const { empresaId, empresaNombre } = useGlobal() || {};

  const empty = {
    PKID: null,
    IDCuentaContable: "",
    CuentaContable: "",
    IndicadorMovimientoCheck: false,
    IndicadorAnaliticaCheck: false,
    IndicadorCentroCostoCheck: false,
    NivelCuenta: "",
    PKIDSituacionRegistro: "",
    IndicadorCuentaCorrienteCheck: false, // se enviará como 1/0
  };
  const [form, setForm] = useState(empty);
  const isEditing = form.PKID !== null;

  const [situaciones, setSituaciones] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // filtros
  const [fId, setFId] = useState("");
  const [fNombre, setFNombre] = useState("");

  // Combos
  const loadSituaciones = async () => {
    try {
      const res = await auth.get("/cuenta-contable-combos/situacion");
      setSituaciones(res.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudieron cargar las situaciones.");
    }
  };

  // Listado
  const loadRows = async () => {
    if (!empresaId) {
      setRows([]);
      return;
    }
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("empresaId", empresaId);
      if (fId) params.append("id", fId);
      if (fNombre) params.append("nombre", fNombre);
      const res = await auth.get(`/cuenta-contable/?${params.toString()}`);
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

  // Handlers
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const onNew = () => setForm(empty);

  const onEdit = (r) => {
    setForm({
      PKID: r.PKID,
      IDCuentaContable: r.IDCuentaContable ?? "",
      CuentaContable: r.CuentaContable ?? "",
      IndicadorMovimientoCheck: !!r.IndicadorMovimientoCheck,
      IndicadorAnaliticaCheck: !!r.IndicadorAnaliticaCheck,
      IndicadorCentroCostoCheck: !!r.IndicadorCentroCostoCheck,
      NivelCuenta: r.NivelCuenta ?? "",
      PKIDSituacionRegistro: r.PKIDSituacionRegistro ?? "",
      IndicadorCuentaCorrienteCheck: !!(r.IndicadorCuentaCorrienteCheck ?? 0),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    if (!window.confirm("¿Eliminar cuenta contable?")) return;
    try {
      setLoading(true);
      await auth.delete(`/cuenta-contable/${id}`);
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
    const required = ["IDCuentaContable", "CuentaContable", "NivelCuenta", "PKIDSituacionRegistro"];
    for (const k of required) {
      const v = form[k];
      if (!v && v !== 0) {
        alert("Complete los campos obligatorios.");
        return;
      }
    }
    const payloadCreate = {
      PKIDEmpresa: Number(empresaId),
      IDCuentaContable: Number(form.IDCuentaContable),
      CuentaContable: String(form.CuentaContable),
      IndicadorMovimientoCheck: !!form.IndicadorMovimientoCheck,
      IndicadorAnaliticaCheck: !!form.IndicadorAnaliticaCheck,
      IndicadorCentroCostoCheck: !!form.IndicadorCentroCostoCheck,
      NivelCuenta: Number(form.NivelCuenta),
      PKIDSituacionRegistro: Number(form.PKIDSituacionRegistro),
      IndicadorCuentaCorrienteCheck: form.IndicadorCuentaCorrienteCheck ? 1 : 0,
    };
    const payloadUpdate = {
      IDCuentaContable: Number(form.IDCuentaContable),
      CuentaContable: String(form.CuentaContable),
      IndicadorMovimientoCheck: !!form.IndicadorMovimientoCheck,
      IndicadorAnaliticaCheck: !!form.IndicadorAnaliticaCheck,
      IndicadorCentroCostoCheck: !!form.IndicadorCentroCostoCheck,
      NivelCuenta: Number(form.NivelCuenta),
      PKIDSituacionRegistro: Number(form.PKIDSituacionRegistro),
      IndicadorCuentaCorrienteCheck: form.IndicadorCuentaCorrienteCheck ? 1 : 0,
    };

    try {
      setLoading(true);
      if (isEditing) {
        await auth.put(`/cuenta-contable/${form.PKID}`, payloadUpdate);
        alert("Actualizado.");
      } else {
        await auth.post(`/cuenta-contable/`, payloadCreate);
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

  const onBuscar = (e) => {
    e?.preventDefault();
    loadRows();
  };

  const empresaLabel = empresaNombre
    ? `${empresaNombre} (ID ${empresaId ?? "-"})`
    : empresaId
    ? `Empresa ID ${empresaId}`
    : "(sin empresa)";

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>Cuenta Contable</h2>

      {/* Filtros */}
      <div style={{ ...card, marginBottom: 12 }}>
        <form onSubmit={onBuscar}>
          <div style={row4}>
            <div>
              <label style={label}>ID Cuenta</label>
              <input value={fId} onChange={(e) => setFId(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>Nombre Cuenta</label>
              <input value={fNombre} onChange={(e) => setFNombre(e.target.value)} style={input} />
            </div>
            <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
              <button type="submit" style={{ ...btn.base, ...btn.primary }}>Buscar</button>
              <button type="button" style={{ ...btn.base, ...btn.neutral }}
                onClick={() => { setFId(""); setFNombre(""); loadRows(); }}>Limpiar</button>
            </div>
            <div />
          </div>
        </form>
      </div>

      {/* Form */}
      <div style={{ ...card, marginBottom: 16 }}>
        <form onSubmit={onSubmit}>
          <div style={row4}>
            <div>
              <label style={label}>Empresaxd</label>
              <input value={empresaLabel} disabled style={{ ...input, background: "#f9fafb" }} />
            </div>
            <div>
              <label style={label}>ID Cuenta *</label>
              <input name="IDCuentaContable" value={form.IDCuentaContable} onChange={onChange} style={input} />
            </div>
            <div>
              <label style={label}>Nombre Cuenta *</label>
              <input name="CuentaContable" value={form.CuentaContable} onChange={onChange} style={input} />
            </div>
            <div>
              <label style={label}>Nivel Cuenta *</label>
              <input name="NivelCuenta" value={form.NivelCuenta} onChange={onChange} style={input} />
            </div>
          </div>

          <div style={{ ...row4, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 22 }}>
              <input type="checkbox" name="IndicadorMovimientoCheck" checked={!!form.IndicadorMovimientoCheck} onChange={onChange} />
              <span>Movimiento</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 22 }}>
              <input type="checkbox" name="IndicadorAnaliticaCheck" checked={!!form.IndicadorAnaliticaCheck} onChange={onChange} />
              <span>Analítica</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 22 }}>
              <input type="checkbox" name="IndicadorCentroCostoCheck" checked={!!form.IndicadorCentroCostoCheck} onChange={onChange} />
              <span>Centro Costo</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 22 }}>
              <input type="checkbox" name="IndicadorCuentaCorrienteCheck" checked={!!form.IndicadorCuentaCorrienteCheck} onChange={onChange} />
              <span>Cuenta Corriente</span>
            </div>
          </div>

          <div style={{ ...row4, marginTop: 12 }}>
            <div>
              <label style={label}>Situación *</label>
              <select name="PKIDSituacionRegistro" value={form.PKIDSituacionRegistro} onChange={onChange} style={input}>
                <option value="">-- Seleccionar --</option>
                {situaciones.map((s) => (
                  <option key={s.PKID} value={s.PKID}>{s.SituacionRegistro}</option>
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
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>ID</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Cuenta</th>
                <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Nivel</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Situación</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Mov</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Analítica</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>CCosto</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Cta Cte</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.PKID}>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.IDCuentaContable}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.CuentaContable}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>{r.NivelCuenta}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{r.SituacionRegistro}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>{r.IndicadorMovimientoCheck ? "✔" : ""}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>{r.IndicadorAnaliticaCheck ? "✔" : ""}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>{r.IndicadorCentroCostoCheck ? "✔" : ""}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>{r.IndicadorCuentaCorrienteCheck ? "✔" : ""}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid " +
                    "#f3f4f6", textAlign: "center" }}>
                    <button onClick={() => onEdit(r)} style={{ ...btn.base, ...btn.neutral, marginRight: 6 }}>✏️</button>
                    <button onClick={() => onDelete(r.PKID)} style={{ ...btn.base, ...btn.danger }}>🗑️</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
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
